const crypto = require('crypto');

const COOKIE_NAME = 'mc_session';
const SESSION_HORAS = 8;

/* ---------- Hash de contraseña (scrypt, sin dependencias externas) ---------- */

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashGuardado] = stored.split(':');
  const hashIntento = crypto.scryptSync(password, salt, 64);
  const bufferGuardado = Buffer.from(hashGuardado, 'hex');
  if (bufferGuardado.length !== hashIntento.length) return false;
  return crypto.timingSafeEqual(hashIntento, bufferGuardado);
}

/* ---------- Sesión firmada (cookie httpOnly, sin librerías de JWT) ---------- */

function firmar(valor, secreto) {
  return crypto.createHmac('sha256', secreto).update(valor).digest('hex');
}

function crearSessionCookie(usuario) {
  const secreto = requerirSecreto();
  const exp = Date.now() + SESSION_HORAS * 3600e3;
  const payload = Buffer.from(JSON.stringify({ u: usuario, exp })).toString('base64url');
  const firma = firmar(payload, secreto);
  const valor = `${payload}.${firma}`;
  const maxAge = SESSION_HORAS * 3600;
  return `${COOKIE_NAME}=${valor}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function cookieDeLogout() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function leerCookie(req, nombre) {
  const header = req.headers.cookie || '';
  const partes = header.split(';').map((p) => p.trim());
  for (const parte of partes) {
    const idx = parte.indexOf('=');
    if (idx === -1) continue;
    if (parte.slice(0, idx) === nombre) return parte.slice(idx + 1);
  }
  return null;
}

function sesionValida(req) {
  try {
    const secreto = requerirSecreto();
    const valor = leerCookie(req, COOKIE_NAME);
    if (!valor) return false;
    const [payload, firma] = valor.split('.');
    if (!payload || !firma) return false;
    if (firmar(payload, secreto) !== firma) return false;
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof datos.exp === 'number' && Date.now() < datos.exp;
  } catch {
    return false;
  }
}

function requerirSecreto() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) throw new Error('Falta la variable de entorno SESSION_SECRET');
  return secreto;
}

module.exports = {
  hashPassword,
  verifyPassword,
  crearSessionCookie,
  cookieDeLogout,
  sesionValida
};

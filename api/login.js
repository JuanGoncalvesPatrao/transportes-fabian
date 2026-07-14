const { verifyPassword, crearSessionCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { usuario, password } = req.body || {};
  const usuarioOk = typeof usuario === 'string' && usuario === process.env.ADMIN_USER;
  const passwordOk = typeof password === 'string' && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);

  if (!usuarioOk || !passwordOk) {
    // Mismo mensaje para usuario o contraseña incorrectos: no dar pistas.
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  res.setHeader('Set-Cookie', crearSessionCookie(usuario));
  res.status(200).json({ ok: true });
};

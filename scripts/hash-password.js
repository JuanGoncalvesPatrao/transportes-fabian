#!/usr/bin/env node
/**
 * Genera el hash para ADMIN_PASSWORD_HASH sin mandar la contraseña en texto plano a ningún lado.
 * Uso: node scripts/hash-password.js "miContraseñaSegura"
 */
const { hashPassword } = require('../lib/auth');

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-password.js "tuContraseña"');
  process.exit(1);
}

console.log(hashPassword(password));

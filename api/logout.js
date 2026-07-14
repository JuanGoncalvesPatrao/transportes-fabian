const { cookieDeLogout } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  res.setHeader('Set-Cookie', cookieDeLogout());
  res.status(200).json({ ok: true });
};

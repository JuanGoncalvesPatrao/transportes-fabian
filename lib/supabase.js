const { createClient } = require('@supabase/supabase-js');

let cliente = null;

/**
 * Cliente de Supabase con la service_role key.
 * Solo se usa server-side (funciones /api) — nunca exponer esta key al navegador.
 */
function getSupabase() {
  if (cliente) return cliente;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan las variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }

  cliente = createClient(url, key, { auth: { persistSession: false } });
  return cliente;
}

module.exports = { getSupabase };

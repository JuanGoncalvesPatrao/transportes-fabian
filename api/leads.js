const { getSupabase } = require('../lib/supabase');
const { sesionValida } = require('../lib/auth');

const TABLA = 'solicitudes';

const VEHICULOS_VALIDOS = new Set(['pickup-100', 'pickup-250', 'pickup-350', 'camion', 'camion-xl']);
const CUANDO_VALIDOS = new Set(['', 'Esta semana', 'Este mes', 'Más adelante']);

const validarEmail = (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function limpiarTexto(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

module.exports = async (req, res) => {
  const supabase = getSupabase();

  if (req.method === 'POST') {
    await crear(req, res, supabase);
  } else if (req.method === 'GET') {
    await listar(req, res, supabase);
  } else if (req.method === 'DELETE') {
    await borrar(req, res, supabase);
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
};

/* ---------- Crear (público: lo llama el formulario de la web) ---------- */
async function crear(req, res, supabase) {
  const body = req.body || {};

  const nombre = limpiarTexto(body.nombre, 120);
  const telefono = limpiarTexto(body.telefono, 40);
  const email = limpiarTexto(body.email, 160);
  const zona = limpiarTexto(body.zona, 160);
  const cuando = limpiarTexto(body.cuando, 40);
  const vehiculoId = limpiarTexto(body.vehiculoId, 40);
  const vehiculo = limpiarTexto(body.vehiculo, 60);
  const ambientes = limpiarTexto(body.ambientes, 60);

  if (nombre.length < 2 || telefono.replace(/\D/g, '').length < 8) {
    res.status(400).json({ error: 'Nombre o teléfono inválidos' });
    return;
  }
  if (!validarEmail(email)) {
    res.status(400).json({ error: 'Email inválido' });
    return;
  }
  if (!VEHICULOS_VALIDOS.has(vehiculoId)) {
    res.status(400).json({ error: 'Vehículo inválido' });
    return;
  }
  if (!CUANDO_VALIDOS.has(cuando)) {
    res.status(400).json({ error: 'Valor de "cuándo" inválido' });
    return;
  }

  const { error } = await supabase.from(TABLA).insert({
    nombre, telefono, email, zona, cuando,
    vehiculo_id: vehiculoId, vehiculo, ambientes
  });

  if (error) {
    console.error('Error al guardar solicitud:', error.message);
    res.status(500).json({ error: 'No se pudo guardar la solicitud' });
    return;
  }

  res.status(201).json({ ok: true });
}

/* ---------- Listar (protegido: lo usa el panel admin) ---------- */
async function listar(req, res, supabase) {
  if (!sesionValida(req)) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .order('ts', { ascending: false });

  if (error) {
    console.error('Error al leer solicitudes:', error.message);
    res.status(500).json({ error: 'No se pudieron leer las solicitudes' });
    return;
  }

  const lista = data.map((fila) => ({
    id: fila.id,
    ts: fila.ts,
    nombre: fila.nombre,
    telefono: fila.telefono,
    email: fila.email,
    zona: fila.zona,
    cuando: fila.cuando,
    vehiculoId: fila.vehiculo_id,
    vehiculo: fila.vehiculo,
    ambientes: fila.ambientes
  }));

  res.status(200).json(lista);
}

/* ---------- Borrar (protegido) ---------- */
async function borrar(req, res, supabase) {
  if (!sesionValida(req)) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const id = (req.query && req.query.id) || '';
  if (!id) {
    res.status(400).json({ error: 'Falta el id' });
    return;
  }

  const { error } = await supabase.from(TABLA).delete().eq('id', id);
  if (error) {
    console.error('Error al borrar solicitud:', error.message);
    res.status(500).json({ error: 'No se pudo borrar la solicitud' });
    return;
  }

  res.status(200).json({ ok: true });
}

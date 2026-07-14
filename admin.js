/* ==========================================================================
   Panel de solicitudes — Mudanzas Centenera
   Lee las solicitudes guardadas por el formulario (localStorage) y las
   muestra en una tabla con WhatsApp por fila y exportación a CSV.
   ========================================================================== */
(() => {
  'use strict';

  const STORAGE_KEY = 'mc_solicitudes';           // misma clave que script.js
  const SEED_FLAG = 'mc_seeded';                   // para no re-sembrar ejemplos
  const WA_CONFIG_MSG = 'Hola! Te escribo por tu pedido de presupuesto de mudanza en Mudanzas Centenera.';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const tbody = $('[data-tbody]');
  const template = $('[data-row-template]');
  const emptyState = $('[data-empty]');
  const filtroVehiculo = $('#filtro-vehiculo');
  const search = $('#search');

  let orden = { campo: 'ts', dir: 'desc' };

  /* ---------- Storage ---------- */
  const leer = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const guardar = (lista) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

  /* ---------- Datos de ejemplo ---------- */
  function ejemplos() {
    const ahora = Date.now();
    const h = 3600e3, d = 24 * h;
    const base = [
      { nombre: 'Marina López',      telefono: '11 5623 8890', email: 'marina.lopez@gmail.com', zona: 'Caballito, CABA',      vehiculo: 'Pickup 250', vehiculoId: 'pickup-250', ambientes: '2 ambientes', cuando: 'Este mes',      off: 2 * h },
      { nombre: 'Diego Fernández',   telefono: '11 3344 1276', email: '',                       zona: 'Flores, CABA',        vehiculo: 'Camión',     vehiculoId: 'camion',     ambientes: '4 ambientes', cuando: 'Esta semana',   off: 6 * h },
      { nombre: 'Sofía Gutiérrez',   telefono: '11 6698 4521', email: 'sofiag@hotmail.com',      zona: 'Villa Urquiza, CABA', vehiculo: 'Pickup 100', vehiculoId: 'pickup-100', ambientes: '1 ambiente',  cuando: 'Más adelante',  off: 1 * d + 3 * h },
      { nombre: 'Rodrigo Paz',       telefono: '11 2211 7788', email: 'rodri.paz@gmail.com',     zona: 'San Isidro, GBA Norte', vehiculo: 'Camión XL', vehiculoId: 'camion-xl', ambientes: '5 ambientes', cuando: 'Este mes',      off: 2 * d },
      { nombre: 'Carla Domínguez',   telefono: '11 4455 9012', email: 'carladom@yahoo.com.ar',   zona: 'Lanús, GBA Sur',      vehiculo: 'Pickup 350', vehiculoId: 'pickup-350', ambientes: '3 ambientes', cuando: 'Esta semana',   off: 3 * d + 5 * h },
      { nombre: 'Javier Ríos',       telefono: '11 7890 3344', email: '',                       zona: 'Morón, GBA Oeste',    vehiculo: 'Pickup 250', vehiculoId: 'pickup-250', ambientes: '2 ambientes', cuando: '',              off: 5 * d + 8 * h }
    ];
    return base.map((x, i) => ({
      id: 'seed-' + i,
      ts: new Date(ahora - x.off).toISOString(),
      nombre: x.nombre, telefono: x.telefono, email: x.email, zona: x.zona,
      vehiculo: x.vehiculo, vehiculoId: x.vehiculoId, ambientes: x.ambientes, cuando: x.cuando
    }));
  }

  function sembrarEjemplos(forzar) {
    const lista = leer();
    const nuevos = ejemplos().filter((e) => !lista.some((l) => l.id === e.id));
    if (!nuevos.length && !forzar) return;
    guardar([...lista, ...nuevos]);
    localStorage.setItem(SEED_FLAG, '1');
  }

  /* ---------- Utilidades ---------- */
  const fmtFecha = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtHora  = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  // Normaliza un teléfono argentino a formato wa.me (54 9 + área + número)
  function waNumero(tel) {
    let d = String(tel).replace(/\D/g, '');
    if (d.startsWith('54')) return d;
    d = d.replace(/^0/, '');            // saca 0 inicial de área
    d = d.replace(/^15/, '');           // saca prefijo 15 de celu
    return '549' + d;
  }
  const waLink = (lead) => `https://wa.me/${waNumero(lead.telefono)}?text=${encodeURIComponent(WA_CONFIG_MSG)}`;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- Render ---------- */
  function filtrar(lista) {
    const q = search.value.trim().toLowerCase();
    const veh = filtroVehiculo.value;
    return lista.filter((l) => {
      if (veh && l.vehiculoId !== veh) return false;
      if (!q) return true;
      return [l.nombre, l.telefono, l.email, l.zona].join(' ').toLowerCase().includes(q);
    });
  }

  function ordenar(lista) {
    const dir = orden.dir === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0) * dir);
  }

  function render() {
    const todas = leer();
    poblarFiltro(todas);
    actualizarMetricas(todas);

    const visibles = ordenar(filtrar(todas));
    tbody.innerHTML = '';

    if (!todas.length) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }

    visibles.forEach((lead) => tbody.appendChild(fila(lead)));

    const total = todas.length;
    const mostradas = visibles.length;
    $('[data-count]').textContent = (mostradas === total)
      ? `${total} ${total === 1 ? 'solicitud' : 'solicitudes'}`
      : `${mostradas} de ${total} solicitudes`;

    // marca de orden en el th
    $$('.leads-table th.sortable').forEach((th) => th.setAttribute('aria-sort', orden.dir === 'asc' ? 'ascending' : 'descending'));
  }

  function fila(lead) {
    const row = template.content.cloneNode(true);
    const tr = row.querySelector('tr');
    tr.dataset.id = lead.id;

    const set = (sel, val, label) => {
      const el = row.querySelector(sel);
      el.textContent = val || '';
      el.setAttribute('data-label', label);
    };
    row.querySelector('.c-date').textContent = fmtFecha(lead.ts);
    row.querySelector('.c-time').textContent = fmtHora(lead.ts) + ' h';
    row.querySelector('.cell-date').setAttribute('data-label', 'Fecha');
    set('.cell-name', lead.nombre, 'Nombre');
    set('.cell-phone', lead.telefono, 'Teléfono');
    set('.cell-email', lead.email, 'Email');
    set('.cell-zone', lead.zona, 'Zona');
    row.querySelector('.cell-vehicle').setAttribute('data-label', 'Mudanza');
    row.querySelector('.veh-tag').textContent = `${lead.vehiculo} · ${lead.ambientes}`;
    set('.cell-cuando', lead.cuando, 'Cuándo');

    row.querySelector('.row-btn--wa').href = waLink(lead);
    return row;
  }

  function poblarFiltro(lista) {
    const actual = filtroVehiculo.value;
    const vehiculos = [...new Map(lista.map((l) => [l.vehiculoId, l.vehiculo])).entries()];
    filtroVehiculo.innerHTML = '<option value="">Todos los vehículos</option>'
      + vehiculos.map(([id, nombre]) => `<option value="${id}">${escapeHtml(nombre)}</option>`).join('');
    filtroVehiculo.value = actual;
  }

  function actualizarMetricas(lista) {
    const semana = Date.now() - 7 * 24 * 3600e3;
    const enSemana = lista.filter((l) => new Date(l.ts).getTime() >= semana).length;
    const conEmail = lista.filter((l) => l.email && l.email.trim()).length;

    const conteo = {};
    lista.forEach((l) => { conteo[l.vehiculo] = (conteo[l.vehiculo] || 0) + 1; });
    const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

    $('[data-metric-total]').textContent = lista.length;
    $('[data-metric-week]').textContent = enSemana;
    $('[data-metric-emails]').textContent = conEmail;
    $('[data-metric-top]').textContent = top ? top[0] : '—';
  }

  /* ---------- Exportar ---------- */
  function descargar(nombre, contenido, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob(['﻿' + contenido], { type: mime }); // BOM para Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  const csvCampo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  function exportarCsv() {
    const lista = ordenar(filtrar(leer()));
    if (!lista.length) return alert('No hay solicitudes para exportar.');
    const cab = ['Fecha', 'Hora', 'Nombre', 'Teléfono', 'Email', 'Zona', 'Mudanza', 'Ambientes', 'Cuándo'];
    const filas = lista.map((l) => [
      fmtFecha(l.ts), fmtHora(l.ts), l.nombre, l.telefono, l.email, l.zona, l.vehiculo, l.ambientes, l.cuando
    ].map(csvCampo).join(';'));
    descargar(`solicitudes-mudanzas-centenera-${hoy()}.csv`, [cab.join(';'), ...filas].join('\r\n'));
  }

  function exportarEmails() {
    const lista = leer().filter((l) => l.email && l.email.trim());
    if (!lista.length) return alert('Todavía no hay solicitudes con email cargado.');
    const cab = ['Nombre', 'Email'];
    const filas = lista.map((l) => [l.nombre, l.email].map(csvCampo).join(';'));
    descargar(`emails-marketing-${hoy()}.csv`, [cab.join(';'), ...filas].join('\r\n'));
  }
  const hoy = () => new Date().toISOString().slice(0, 10);

  /* ---------- Eventos ---------- */
  search.addEventListener('input', render);
  filtroVehiculo.addEventListener('change', render);
  $('[data-export-csv]').addEventListener('click', exportarCsv);
  $('[data-export-emails]').addEventListener('click', exportarEmails);

  $$('.leads-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      orden.dir = orden.dir === 'asc' ? 'desc' : 'asc';
      render();
    });
  });

  tbody.addEventListener('click', (e) => {
    const del = e.target.closest('.row-btn--del');
    if (!del) return;
    const id = del.closest('tr').dataset.id;
    const lead = leer().find((l) => l.id === id);
    if (lead && confirm(`¿Borrar la solicitud de ${lead.nombre}?`)) {
      guardar(leer().filter((l) => l.id !== id));
      render();
    }
  });

  $('[data-seed]').addEventListener('click', () => { sembrarEjemplos(true); render(); });
  $('[data-seed-more]').addEventListener('click', () => { sembrarEjemplos(true); render(); });
  $('[data-clear]').addEventListener('click', () => {
    if (!leer().length) return;
    if (confirm('¿Vaciar TODAS las solicitudes? Esta acción no se puede deshacer.')) {
      guardar([]); render();
    }
  });

  /* ---------- Inicio ---------- */
  // La primera vez que se abre el panel sin datos, sembramos ejemplos para la demo.
  if (!leer().length && !localStorage.getItem(SEED_FLAG)) sembrarEjemplos(false);
  render();
})();

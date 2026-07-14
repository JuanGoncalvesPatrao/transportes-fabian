/* ==========================================================================
   Panel de solicitudes — Mudanzas Centenera
   Pide las solicitudes al backend (/api/leads) y las muestra en una tabla
   con WhatsApp por fila y exportación a CSV. Requiere haber iniciado sesión.
   ========================================================================== */
(() => {
  'use strict';

  const WA_CONFIG_MSG = 'Hola! Te escribo por tu pedido de presupuesto de mudanza en Mudanzas Centenera.';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const loginView = $('[data-login-view]');
  const welcomeView = $('[data-welcome-view]');
  const adminView = $('[data-admin-view]');
  const loginForm = $('[data-login-form]');
  const loginError = $('[data-login-error]');

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const tbody = $('[data-tbody]');
  const template = $('[data-row-template]');
  const emptyState = $('[data-empty]');
  const filtroVehiculo = $('#filtro-vehiculo');
  const search = $('#search');

  let orden = { campo: 'ts', dir: 'desc' };
  let solicitudes = [];

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

  /* ---------- Sesión ---------- */
  async function cargarSolicitudes({ bienvenida = false } = {}) {
    const resp = await fetch('/api/leads', { credentials: 'same-origin' });
    if (resp.status === 401) {
      mostrarLogin();
      return;
    }
    if (!resp.ok) {
      alert('No se pudieron cargar las solicitudes. Probá recargar la página.');
      return;
    }
    solicitudes = await resp.json();
    await mostrarAdmin({ bienvenida });
    render();
  }

  function mostrarLogin() {
    loginView.hidden = false;
    welcomeView.hidden = true;
    adminView.hidden = true;
  }

  async function mostrarAdmin({ bienvenida = false } = {}) {
    if (bienvenida) {
      loginView.hidden = true;
      welcomeView.hidden = false;
      await esperar(1400);
      welcomeView.classList.add('is-leaving');
      await esperar(350);
      welcomeView.hidden = true;
      welcomeView.classList.remove('is-leaving');
    } else {
      loginView.hidden = true;
      welcomeView.hidden = true;
    }
    adminView.classList.add('is-entering');
    adminView.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => adminView.classList.remove('is-entering')));
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const usuario = $('#login-usuario').value.trim();
    const password = $('#login-password').value;
    const boton = loginForm.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      if (!resp.ok) {
        loginError.hidden = false;
        return;
      }
      loginForm.reset();
      await cargarSolicitudes({ bienvenida: true });
    } catch {
      loginError.hidden = false;
    } finally {
      boton.disabled = false;
    }
  });

  const logoutBtn = $('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      solicitudes = [];
      mostrarLogin();
    });
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
    poblarFiltro(solicitudes);
    actualizarMetricas(solicitudes);

    const visibles = ordenar(filtrar(solicitudes));
    tbody.innerHTML = '';

    emptyState.hidden = solicitudes.length > 0;

    visibles.forEach((lead) => tbody.appendChild(fila(lead)));

    const total = solicitudes.length;
    const mostradas = visibles.length;
    $('[data-count]').textContent = (mostradas === total)
      ? `${total} ${total === 1 ? 'solicitud' : 'solicitudes'}`
      : `${mostradas} de ${total} solicitudes`;

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

    $('[data-metric-total]').textContent = lista.length;
    $('[data-metric-week]').textContent = enSemana;
    $('[data-metric-emails]').textContent = conEmail;
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
    const lista = ordenar(filtrar(solicitudes));
    if (!lista.length) return alert('No hay solicitudes para exportar.');
    const cab = ['Fecha', 'Hora', 'Nombre', 'Teléfono', 'Email', 'Zona', 'Mudanza', 'Ambientes', 'Cuándo'];
    const filas = lista.map((l) => [
      fmtFecha(l.ts), fmtHora(l.ts), l.nombre, l.telefono, l.email, l.zona, l.vehiculo, l.ambientes, l.cuando
    ].map(csvCampo).join(';'));
    descargar(`solicitudes-mudanzas-centenera-${hoy()}.csv`, [cab.join(';'), ...filas].join('\r\n'));
  }

  function exportarEmails() {
    const lista = solicitudes.filter((l) => l.email && l.email.trim());
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

  tbody.addEventListener('click', async (e) => {
    const del = e.target.closest('.row-btn--del');
    if (!del) return;
    const id = del.closest('tr').dataset.id;
    const lead = solicitudes.find((l) => l.id === id);
    if (!lead || !confirm(`¿Borrar la solicitud de ${lead.nombre}?`)) return;

    const resp = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!resp.ok) {
      alert('No se pudo borrar la solicitud.');
      return;
    }
    solicitudes = solicitudes.filter((l) => l.id !== id);
    render();
  });

  /* ---------- Inicio ---------- */
  cargarSolicitudes();
})();

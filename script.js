/* ==========================================================================
   Transportes Fabián — lógica del prototipo
   ========================================================================== */
(() => {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIG — cuando tengas el WhatsApp de Fabián, poné el número acá
     en formato internacional sin "+", espacios ni guiones.
     Ej: 5491123456789  (54 = Arg, 9 = celular, 11 = CABA, resto el número)
     Dejalo en '' para que el sitio funcione sin WhatsApp.
     ---------------------------------------------------------------------- */
  const CONFIG = {
    whatsapp: '' // <-- pegá el número acá cuando lo tengas
  };

  // Clave compartida con el panel de administración (admin.js)
  const STORAGE_KEY = 'tf_solicitudes';

  /* ---------------------------------------------------------------------- */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ----- Datos de los vehículos ----- */
  const VEHICULOS = [
    { id: 'pickup-100', amb: '1 ambiente',  ideal: 'Monoambiente o pocas cosas', nombre: 'Pickup 100', medidas: '2 × 2 × 2 m',       carga: '1.000 kg',  svg: 'truck-pickup-100' },
    { id: 'pickup-250', amb: '2 ambientes', ideal: 'Departamento chico',         nombre: 'Pickup 250', medidas: '2 × 3 × 2 m',       carga: '1.000 kg',  svg: 'truck-pickup-250' },
    { id: 'pickup-350', amb: '3 ambientes', ideal: 'Departamento o casa media',  nombre: 'Pickup 350', medidas: '2,2 × 4 × 2,2 m',   carga: '3.000 kg',  svg: 'truck-pickup-350' },
    { id: 'camion',     amb: '4 ambientes', ideal: 'Casa familiar',              nombre: 'Camión',     medidas: '2 × 4,9 × 2 m',     carga: '3.500 kg',  svg: 'truck-camion' },
    { id: 'camion-xl',  amb: '5 ambientes', ideal: 'Casa grande u oficina',      nombre: 'Camión XL',  medidas: '2,5 × 7 × 2,5 m',   carga: '11.500 kg', svg: 'truck-camion-xl' }
  ];

  /* ----- Año dinámico en el footer ----- */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================================================================
     HEADER: fondo sólido al scrollear
     ====================================================================== */
  const header = $('[data-header]');
  const onScroll = () => {
    header.toggleAttribute('data-scrolled', window.scrollY > 40);
    const fab = $('[data-fab]');
    if (fab) fab.toggleAttribute('data-visible', window.scrollY > 500);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ======================================================================
     NAV MÓVIL
     ====================================================================== */
  const navToggle = $('[data-nav-toggle]');
  const navMenu = $('[data-nav-menu]');
  const setNav = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    navMenu.toggleAttribute('data-open', open);
    document.body.toggleAttribute('data-nav-open', open);
  };
  navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
  navMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* ======================================================================
     SELECTOR DE VEHÍCULOS
     ====================================================================== */
  const grid = $('.vehicle-grid');
  grid.innerHTML = VEHICULOS.map((v, i) => `
    <div class="vehicle">
      <input type="radio" name="vehiculo" id="veh-${v.id}" value="${v.id}"/>
      <label for="veh-${v.id}">
        <span class="v-check"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check"/></svg></span>
        <span class="v-ambientes">${v.amb}</span>
        <svg class="v-illus" viewBox="0 0 200 110" role="img" aria-label="${v.nombre}"><use href="#${v.svg}"/></svg>
        <span class="v-name">${v.nombre}</span>
        <span class="v-meta">Carga hasta <strong>${v.carga}</strong></span>
      </label>
    </div>
  `).join('');

  const form = $('[data-quote]');
  const panel = $('[data-quote-panel]');
  const success = $('[data-quote-success]');
  let seleccion = null;

  const fillSummary = (v) => {
    $('[data-summary-vehicle]').textContent = `${v.nombre} · ${v.amb}`;
    $('[data-summary-ambientes]').textContent = v.ideal;
    $('[data-summary-medidas]').textContent = v.medidas;
    $('[data-summary-carga]').textContent = v.carga;
  };

  grid.addEventListener('change', (e) => {
    const v = VEHICULOS.find((x) => x.id === e.target.value);
    if (!v) return;
    seleccion = v;
    fillSummary(v);
    if (panel.hidden) {
      panel.hidden = false;
      // llevar el foco al primer campo, sin saltar bruscamente
      requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
      });
    }
  });

  /* ======================================================================
     MAPA DE LA ZONA (Google Maps embebido, sin API key)
     ====================================================================== */
  const mapFrame = $('[data-map-frame]');
  const zonaMapBtn = $('[data-zona-map]');
  const zonaInput = $('#q-zona');

  const actualizarMapa = () => {
    const q = zonaInput.value.trim();
    if (!q || !mapFrame) return;
    // Sesgamos la búsqueda a Buenos Aires para acertar el barrio correcto
    const query = encodeURIComponent(`${q}, Buenos Aires, Argentina`);
    mapFrame.src = `https://maps.google.com/maps?q=${query}&z=14&output=embed`;
  };

  if (mapFrame && zonaMapBtn) {
    zonaMapBtn.addEventListener('click', actualizarMapa);
    zonaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); actualizarMapa(); } // evita enviar el form
    });
    zonaInput.addEventListener('blur', () => { if (zonaInput.value.trim()) actualizarMapa(); });
  }

  /* ======================================================================
     VALIDACIÓN + ENVÍO
     ====================================================================== */
  const nombre = $('#q-nombre');
  const telefono = $('#q-telefono');
  const email = $('#q-email');
  const zona = $('#q-zona');

  const showError = (input, show) => {
    const err = $(`[data-error-for="${input.id}"]`);
    input.setAttribute('aria-invalid', String(show));
    if (err) err.hidden = !show;
  };

  const validarTel = (val) => (val.replace(/\D/g, '').length >= 8);
  const validarNombre = (val) => val.trim().length >= 2;
  const validarEmail = (val) => val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const validador = { [nombre.id]: validarNombre, [telefono.id]: validarTel, [email.id]: validarEmail };
  [nombre, telefono, email].forEach((input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true' && validador[input.id](input.value)) {
        showError(input, false);
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!seleccion) return;

    const okNombre = validarNombre(nombre.value);
    const okTel = validarTel(telefono.value);
    const okEmail = validarEmail(email.value);
    showError(nombre, !okNombre);
    showError(telefono, !okTel);
    showError(email, !okEmail);
    if (!okNombre || !okTel || !okEmail) {
      (!okNombre ? nombre : !okTel ? telefono : email).focus();
      return;
    }

    guardarSolicitud();
    mostrarExito();
  });

  /* ----- Guardar la solicitud (localStorage, compartido con el panel) ----- */
  function guardarSolicitud() {
    const solicitud = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
      ts: new Date().toISOString(),
      nombre: nombre.value.trim(),
      telefono: telefono.value.trim(),
      email: email.value.trim(),
      zona: zona.value.trim(),
      vehiculoId: seleccion.id,
      vehiculo: seleccion.nombre,
      ambientes: seleccion.amb
    };
    try {
      const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      lista.push(solicitud);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (err) {
      console.warn('No se pudo guardar la solicitud:', err);
    }
  }

  const mensajeResumen = () => {
    const partes = [
      `Hola Fabián, quiero un presupuesto para una mudanza.`,
      ``,
      `• Tamaño: ${seleccion.amb} (${seleccion.nombre})`,
      `• Nombre: ${nombre.value.trim()}`,
      `• Teléfono: ${telefono.value.trim()}`
    ];
    if (email.value.trim()) partes.push(`• Email: ${email.value.trim()}`);
    if (zona.value.trim()) partes.push(`• Zona: ${zona.value.trim()}`);
    return partes.join('\n');
  };

  const mostrarExito = () => {
    // Resumen visible
    $('[data-success-summary]').innerHTML = `
      <strong>Resumen de tu pedido</strong><br>
      Tamaño: ${seleccion.nombre} (${seleccion.amb})<br>
      Nombre: ${escapeHtml(nombre.value.trim())}<br>
      Teléfono: ${escapeHtml(telefono.value.trim())}
      ${email.value.trim() ? `<br>Email: ${escapeHtml(email.value.trim())}` : ''}
      ${zona.value.trim() ? `<br>Zona: ${escapeHtml(zona.value.trim())}` : ''}
    `;

    // Botón de WhatsApp (solo si hay número configurado)
    const waLink = $('[data-whatsapp-link]');
    if (CONFIG.whatsapp) {
      waLink.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensajeResumen())}`;
      waLink.hidden = false;
      $('[data-success-text]').textContent = 'Podés enviarnos también el resumen por WhatsApp para agilizar la respuesta.';
    } else {
      waLink.hidden = true;
      $('[data-success-text]').textContent = 'Nos contactamos con vos a la brevedad para pasarte el presupuesto.';
    }

    panel.hidden = true;
    success.hidden = false;
    requestAnimationFrame(() => success.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' }));
  };

  $('[data-quote-reset]').addEventListener('click', () => {
    success.hidden = true;
    panel.hidden = true;
    seleccion = null;
    form.reset();
    showError(nombre, false);
    showError(telefono, false);
    $$('input[name="vehiculo"]').forEach((r) => (r.checked = false));
    $('#servicios').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  });

  /* ----- Link de WhatsApp del footer (si hay número) ----- */
  const waFooter = $('[data-whatsapp-footer]');
  if (waFooter && CONFIG.whatsapp) {
    waFooter.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('Hola Fabián, quiero consultar por una mudanza.')}`;
  }

  /* ======================================================================
     REVEAL ON SCROLL
     ====================================================================== */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced()) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------------------- */
  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();

# Transportes Fabián — Prototipo funcional

Landing de mudanzas y fletes (CABA y GBA). HTML + CSS + JS puro, sin build ni dependencias.

## Cómo verlo
Doble clic en `index.html` (abre en el navegador). No necesita servidor ni instalar nada.

## Qué hace
- **Selector de presupuesto por ambientes**: el cliente elige 1–5 ambientes → se abre un panel con el vehículo justo (medidas, carga) + formulario de contacto.
- **Formulario con validación real**: nombre y teléfono validados, mensajes de error claros y pantalla de éxito con el resumen del pedido.
- **Responsive** con menú hamburguesa en celular.
- **Botón flotante** para ir directo al presupuesto.

## Pendientes para dejarlo 100% (cuando tengas los datos)
1. **WhatsApp**: en `script.js`, arriba de todo, poné el número en `CONFIG.whatsapp` (formato `5491123456789`). Al hacerlo se activa solo el botón de WhatsApp en la pantalla de éxito y en el footer.
2. **Fotos reales**: los vehículos son ilustraciones SVG (sin marcas ajenas). Cuando tengas fotos de los camiones de Fabián, se reemplazan fácil.
3. **Testimonios**: reemplazá los textos de ejemplo en la sección "25 años haciendo mudanzas" por reseñas reales.
4. **Datos de contacto**: teléfono, email y horarios en el footer son de ejemplo.
5. **Backend del formulario**: hoy el envío muestra la pantalla de éxito (no manda mail). Para recibir los datos podés conectarlo a un servicio como Formspree, o al WhatsApp con el paso 1.

## Panel de solicitudes (`admin.html`)
Acceso desde el link "Panel de solicitudes" en el footer, o abriendo `admin.html`.
- Cada pedido enviado desde el formulario se guarda y aparece en una **tabla ordenada por fecha y hora**.
- **WhatsApp por fila**: botón verde que abre el chat con el teléfono del cliente y un mensaje ya escrito.
- **Buscador** (nombre, teléfono, email, zona) y **filtro por vehículo**.
- **Exportar todo (CSV)**: descarga la lista completa (se abre en Excel).
- **Exportar emails**: descarga solo Nombre + Email de quienes lo dejaron, listo para email marketing.
- **Métricas**: totales, últimos 7 días, con email, vehículo más pedido.
- La primera vez trae **datos de ejemplo** para ver la tabla poblada (botón "Vaciar todo" para limpiarlos).

> Nota: es una demo, los datos viven en el navegador (`localStorage`). En producción irían a una base de datos o a tu email/WhatsApp.

## Estructura
```
index.html   → web pública: estructura + sprite SVG (iconos y camiones)
styles.css   → sistema de diseño (colores, tipografía, componentes)
script.js    → selector, validación, guardado de solicitudes, animaciones
admin.html   → panel de solicitudes (tabla)
admin.css    → estilos del panel
admin.js     → tabla, búsqueda, WhatsApp por fila, exportar CSV
```

# Mudanzas Centenera

Landing de mudanzas y fletes (CABA y GBA). Frontend en HTML + CSS + JS puro (sin build), con un backend serverless (Vercel + Supabase) para guardar las solicitudes de forma segura y proteger el panel admin con usuario y contraseña.

## Cómo verlo en local
Doble clic en `index.html` (abre en el navegador). El formulario y el panel admin necesitan el backend corriendo (ver más abajo) — sin backend, el formulario no va a poder guardar solicitudes.

## Backend (Vercel + Supabase)

### 1. Crear el proyecto en Supabase
1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto gratuito.
2. Andá a **SQL Editor**, pegá el contenido de `supabase-setup.sql` y ejecutalo. Esto crea la tabla `solicitudes`.
3. Andá a **Project Settings > API** y copiá:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (no la `anon`) → `SUPABASE_SERVICE_ROLE_KEY`. Esta clave es secreta: nunca va en el código ni en el navegador, solo en variables de entorno del servidor.

### 2. Generar la contraseña del panel admin
No se guarda la contraseña en texto plano, se guarda un hash. Con Node instalado, corré:
```
npm install
node scripts/hash-password.js "tuContraseñaSegura"
```
Esto imprime un valor tipo `salt:hash` — ese es tu `ADMIN_PASSWORD_HASH`.

También generá una clave aleatoria para firmar las sesiones:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Ese valor es tu `SESSION_SECRET`.

### 3. Configurar variables de entorno en Vercel
Al importar el repo en [vercel.com](https://vercel.com), en **Project Settings > Environment Variables** cargá:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USER` (el usuario para entrar al panel, ej. `admin`)
- `ADMIN_PASSWORD_HASH` (el generado en el paso 2)
- `SESSION_SECRET` (el generado en el paso 2)

Vercel detecta automáticamente los archivos en `api/` como funciones serverless — no hace falta configurar nada más. Cada deploy nuevo (por ejemplo al hacer `git push`) las vuelve a desplegar.

### 4. Probar en local (opcional)
```
npm install -g vercel
vercel dev
```
Esto levanta el sitio y las funciones de `api/` juntos en `localhost`, usando las variables del archivo `.env` (copiá `.env.example` a `.env` y completalo).

## Qué hace
- **Selector de presupuesto por ambientes**: el cliente elige 1–5 ambientes → se abre un panel con el vehículo justo (medidas, carga) + formulario de contacto.
- **Formulario con validación real**: nombre y teléfono validados, mensajes de error claros y pantalla de éxito con el resumen del pedido.
- **Responsive** con menú hamburguesa en celular.
- **Botón flotante** para ir directo al presupuesto.

## Pendientes para dejarlo 100% (cuando tengas los datos)
1. **WhatsApp**: en `script.js`, arriba de todo, poné el número en `CONFIG.whatsapp` (formato `5491123456789`). Al hacerlo se activa solo el botón de WhatsApp en la pantalla de éxito y en el footer.
2. **Fotos reales**: los vehículos son ilustraciones SVG (sin marcas ajenas). Cuando tengas fotos de los camiones, se reemplazan fácil.
3. **Testimonios**: reemplazá los textos de ejemplo en la sección "27 años haciendo mudanzas" por reseñas reales.
4. **Datos de contacto**: teléfono, email y horarios en el footer son de ejemplo.

## Panel de solicitudes (`admin.html`)
Protegido con usuario y contraseña (ver sección Backend). Acceso desde el link "Panel de solicitudes" en el footer, o abriendo `admin.html`.
- Cada pedido enviado desde el formulario se guarda en la base de datos y aparece en una **tabla ordenada por fecha y hora**.
- **WhatsApp por fila**: botón verde que abre el chat con el teléfono del cliente y un mensaje ya escrito.
- **Buscador** (nombre, teléfono, email, zona) y **filtro por vehículo**.
- **Exportar todo (CSV)**: descarga la lista completa (se abre en Excel).
- **Exportar emails**: descarga solo Nombre + Email de quienes lo dejaron, listo para email marketing.
- **Métricas**: totales, últimos 7 días, con email, vehículo más pedido.

## Estructura
```
index.html       → web pública: estructura + sprite SVG (iconos y camiones)
styles.css       → sistema de diseño (colores, tipografía, componentes)
script.js        → selector, validación, envío del formulario al backend, animaciones
admin.html       → panel de solicitudes (login + tabla)
admin.css        → estilos del panel
admin.js         → login, tabla, búsqueda, WhatsApp por fila, exportar CSV
api/leads.js     → backend: crear (público), listar y borrar (protegido) solicitudes
api/login.js     → backend: valida usuario/contraseña y crea la sesión
api/logout.js    → backend: cierra la sesión
lib/auth.js      → hash de contraseña y firma de la cookie de sesión
lib/supabase.js  → cliente de Supabase (service_role, solo server-side)
supabase-setup.sql → SQL para crear la tabla de solicitudes en Supabase
scripts/hash-password.js → genera el hash de la contraseña del panel admin
```

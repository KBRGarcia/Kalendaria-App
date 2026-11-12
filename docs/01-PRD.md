# Product Requirements Document (PRD)
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.1
**Fecha:** Octubre 2026 · actualizado en noviembre 2026
**Estado:** MVP implementado y publicado (v1.1.0, Android: categoría personalizada y vista anual)

---

## 1. Visión y Objetivos

### 1.1. Resumen ejecutivo

Kalendaria es una aplicación móvil de agenda personal que permite al usuario anotar actividades y eventos en un calendario, tanto pasados (registro de lo que se hizo) como futuros (planificación de reuniones y pendientes). El objetivo es ofrecer una herramienta **sumamente sencilla**, sin alarmas, sin notificaciones y sin dependencia de servicios de Google, que permita al usuario tener su agenda de trabajo organizada y consultable desde cualquier teléfono mediante una cuenta propia.

### 1.2. Problema que resuelve

El usuario necesita recordar fechas importantes (reuniones, pendientes) y registrar actividades ya realizadas, pero las apps de calendario tradicionales son demasiado complejas, están atadas a ecosistemas externos (Google) o incluyen funcionalidades que no necesita (alarmas, notificaciones, sincronización con múltiples servicios). Con tantas actividades, olvida fechas clave.

### 1.3. Objetivos del producto

- **OBJ-01:** Ofrecer un calendario visual mensual donde se vean las actividades de cada día de un vistazo.
- **OBJ-02:** Permitir crear, editar y eliminar actividades tanto en fechas pasadas como futuras.
- **OBJ-03:** Permitir etiquetar actividades por categoría con colores para identificación rápida.
- **OBJ-04:** Garantizar que los datos persistan en la nube y sean accesibles desde cualquier dispositivo mediante autenticación con correo y contraseña.
- **OBJ-05:** Mantener la interfaz minimalista: sin alarmas, sin notificaciones, sin integraciones externas.

### 1.4. Usuario objetivo

**Persona principal:** Profesional que necesita organizar sus actividades laborales diarias. Usa el teléfono como herramienta principal. No es técnico. Valora la simplicidad por encima de la potencia. Quiere ver rápidamente qué tiene un día concreto, sin distracciones.

**Características del usuario:**
- Necesita registrar tanto lo que ya hizo como lo que tiene pendiente.
- Cambia de teléfono ocasionalmente y no quiere perder sus datos.
- No quiere vincular su cuenta a Google ni a otros servicios de terceros.
- Prefiere una app ligera y directa.

---

## 2. Alcance

### 2.1. Dentro del alcance (MVP)

- Autenticación con correo y contraseña. La verificación por código de 6 dígitos queda fuera del MVP: el plan gratuito de Supabase no permite editar las plantillas de correo. Volverá cuando haya plan de pago.
- Vista de calendario mensual.
- Detalle del día integrado en el calendario: al tocar un día, sus actividades aparecen en un panel bajo la cuadrícula, sin cambiar de pantalla.
- Creación, edición y eliminación de actividades.
- Categorías con colores.
- Tema claro y oscuro con toggle.
- Persistencia en la nube (Supabase).
- Caché local de lectura para consulta offline.
- Distribución del APK mediante una landing page pública (GitHub Releases + Vercel) y política de privacidad.

### 2.2. Fuera del alcance (explícitamente)

- Notificaciones de cualquier tipo (push, locales, alarmas).
- Actividades semanales o recurrentes.
- Integración con Google Calendar, Outlook, iCloud u otros.
- Sincronización offline completa (solo caché de lectura).
- Compartición de calendarios entre usuarios.
- Widgets, Apple Watch, wearables.
- Exportación de datos (por ahora).
- Publicación en tiendas de aplicaciones en la v1.0.0: la distribución inicial es por APK directo (Google Play queda pendiente del acceso a Play Console).
- Versión iOS publicada.

---

## 3. Requisitos Funcionales

### RF-01: Autenticación — Registro

**Descripción:** El usuario puede crear una cuenta nueva introduciendo correo electrónico y contraseña.

**Detalle:**
- RF-01.1: El formulario de registro solicita: correo electrónico, contraseña y confirmación de contraseña.
- RF-01.2: La contraseña debe tener mínimo 8 caracteres, al menos una letra y un número.
- RF-01.3: Al enviar el formulario, se crea la cuenta en Supabase Auth y el usuario entra en la app.
- RF-01.4: Si el correo ya tiene cuenta, se muestra ese error.
- RF-01.5: Confirm email debe estar desactivado en Supabase. Si sigue activo, la app avisa y no deja la cuenta a medias en una pantalla de código.

**Criterios de aceptación:**
- [ ] Un usuario nuevo puede registrarse con email y contraseña.
- [ ] Tras registrarse, entra en la app sin código de correo.
- [ ] Con un correo ya registrado, ve un mensaje de error.

---

### RF-02: Autenticación — Inicio de sesión

**Descripción:** El usuario puede iniciar sesión con su correo y contraseña.

**Detalle:**
- RF-02.1: El formulario de login solicita: correo electrónico y contraseña.
- RF-02.2: Si las credenciales son correctas, el usuario entra en la app.
- RF-02.3: Si las credenciales son incorrectas, se muestra un error genérico ("Correo o contraseña incorrectos") sin revelar cuál de los dos falló.
- RF-02.4: La sesión persistente se guarda de forma segura en el dispositivo.

**Criterios de aceptación:**
- [ ] Login con credenciales válidas → acceso directo.
- [ ] Login con credenciales inválidas → error genérico.

---

### RF-03: Cierre de sesión

**Descripción:** El usuario puede cerrar sesión desde cualquier pantalla.

**Detalle:**
- RF-03.1: El botón de cerrar sesión está disponible en la pantalla de ajustes o en el menú de perfil.
- RF-03.2: Al cerrar sesión, se elimina la sesión local y se redirige a la pantalla de login.

---

### RF-04: Vista de Calendario Mensual (pantalla principal)

**Descripción:** Pantalla principal de la app. Muestra un calendario del mes actual con las actividades representadas visualmente.

**Detalle:**
- RF-04.1: Se muestra el mes actual por defecto.
- RF-04.2: Cada día del mes es una celda táctil.
- RF-04.3: Los días que tienen actividades muestran un indicador visual (punto de color o barra coloreada según la categoría de la actividad).
- RF-04.4: Si un día tiene varias actividades de distintas categorías, se muestran múltiples indicadores de color.
- RF-04.5: Al tocar un día, ese día queda **seleccionado** y sus actividades se muestran en un **panel bajo el calendario**, sin cambiar de pantalla. Al abrir la app queda seleccionado hoy; al cambiar de mes, hoy (si es ese mes) o el día 1. Tocar un día de relleno de otro mes salta a ese mes.
- RF-04.6: El usuario puede navegar entre meses (anterior/siguiente) mediante botones de flecha o gestos de swipe.
- RF-04.7: El mes y año actuales se muestran en la parte superior.
- RF-04.8: El día de hoy se resalta visualmente (borde o fondo diferente).

**Criterios de aceptación:**
- [ ] Se ve el mes actual al abrir la app.
- [ ] Los días con actividades muestran indicadores de color.
- [x] Tocar un día muestra sus actividades bajo el calendario.
- [ ] Se puede navegar entre meses.

---

### RF-05: Detalle del día (panel bajo el calendario)

**Descripción:** Muestra todas las actividades de un día concreto y permite crear una nueva.

**Detalle:**
- RF-05.1: Se muestra la fecha completa del día seleccionado (ej: "Martes, 14 de octubre de 2026").
- RF-05.2: Se listan todas las actividades de ese día, ordenadas por hora de creación o alfabéticamente.
- RF-05.3: Cada actividad muestra: título, categoría (con color) y una nota opcional.
- RF-05.4: Si no hay actividades, se muestra un estado vacío con un mensaje ("No hay actividades para este día").
- RF-05.5: Un botón flotante (+) permite **crear una nueva actividad** en el día seleccionado.
- RF-05.6: Al tocar una actividad existente, se abre la hoja de edición (modal).
- RF-05.7: No hay pantalla intermedia que cerrar: el panel forma parte del propio calendario.

**Criterios de aceptación:**
- [ ] Se ven todas las actividades del día seleccionado.
- [ ] Cada actividad muestra título y color de categoría.
- [x] Se puede crear una actividad desde el panel.
- [ ] Se puede tocar una actividad para editarla.

---

### RF-06: Creación de Actividad

**Descripción:** Formulario para crear una nueva actividad en un día concreto.

**Detalle:**
- RF-06.1: El formulario se abre desde el botón (+) del calendario, como hoja modal con la fecha del día seleccionado.
- RF-06.2: Campos del formulario:
  - **Título** (obligatorio, texto libre, máximo 100 caracteres).
  - **Categoría** (obligatorio, selección entre las categorías predefinidas).
  - **Nota** (opcional, texto libre, máximo 500 caracteres).
- RF-06.3: La fecha se toma automáticamente del día seleccionado (no editable desde aquí, pero se muestra).
- RF-06.4: Al guardar, la actividad se inserta en Supabase y aparece en la lista del día.
- RF-06.5: Si el título está vacío, no se permite guardar.
- RF-06.6: Tras guardar, se cierra la hoja y la actividad aparece en el panel del día.

**Criterios de aceptación:**
- [ ] Se puede crear una actividad con título y categoría.
- [ ] La actividad aparece inmediatamente en el día.
- [ ] No se puede guardar sin título.

---

### RF-07: Edición de Actividad

**Descripción:** Permite modificar una actividad existente.

**Detalle:**
- RF-07.1: Se accede tocando una actividad en el panel del día.
- RF-07.2: El formulario se precarga con los datos actuales (título, categoría, nota).
- RF-07.3: Se pueden modificar todos los campos editables (título, categoría, nota).
- RF-07.4: Al guardar, los cambios se persisten en Supabase.
- RF-07.5: Se cierra la hoja y el panel y los puntos del calendario se actualizan.

**Criterios de aceptación:**
- [ ] Se pueden modificar los datos de una actividad existente.
- [ ] Los cambios se reflejan inmediatamente.

---

### RF-08: Eliminación de Actividad

**Descripción:** Permite borrar una actividad existente.

**Detalle:**
- RF-08.1: El botón de eliminar está disponible en la pantalla de edición de la actividad.
- RF-08.2: Al pulsar eliminar, se muestra un diálogo de confirmación ("¿Eliminar esta actividad? Esta acción no se puede deshacer").
- RF-08.3: Si el usuario confirma, la actividad se elimina de Supabase y desaparece de la lista.
- RF-08.4: Si cancela, no ocurre nada.

**Criterios de aceptación:**
- [ ] Se puede eliminar una actividad con confirmación previa.
- [ ] La actividad desaparece del día tras confirmar.

---

### RF-09: Categorías con colores

**Descripción:** Las actividades se clasifican en categorías predefinidas, cada una con un color asignado.

**Detalle:**
- RF-09.1: Categorías iniciales del MVP:
  - **Reunión** — Color: Turquesa (`#00A4CC`)
  - **Pendiente** — Color: Coral (`#E8723E`)
  - **Personal** — Color: Verde salvia (`#6EAF8C`)
  - **Trabajo** — Color: Durazno (`#F7A769`)
  - **Otro** — Color: Gris cálido (`#8C8279`)
- RF-09.2: El color de la categoría se refleja en:
  - El indicador del día en el calendario mensual.
  - La etiqueta de la actividad en la lista del día.
- RF-09.3: En el MVP, las categorías son **fijas** (no editables por el usuario). En una versión futura se podría permitir personalización.
- RF-09.4: Los colores definitivos son los del `04-UIUX-Brief.md` §2.5 (paleta del cliente). La versión 1.0 de este documento nombraba azul/naranja/verde/púrpura/gris de forma genérica.

**Criterios de aceptación:**
- [ ] Se puede asignar una categoría al crear/editar una actividad.
- [ ] El color de la categoría se ve en el calendario y en la lista del día.

---

### RF-10: Tema claro y oscuro

**Descripción:** La app soporta ambos temas con un toggle manual.

**Detalle:**
- RF-10.1: Por defecto, la app respeta el tema del sistema operativo.
- RF-10.2: El usuario puede forzar tema claro u oscuro desde ajustes.
- RF-10.3: La preferencia se guarda localmente (AsyncStorage) para persistir entre sesiones.
- RF-10.4: Todos los componentes visuales se adaptan al tema activo.

**Criterios de aceptación:**
- [ ] La app se ve correctamente en tema claro y oscuro.
- [ ] El toggle cambia el tema inmediatamente.
- [ ] La preferencia persiste al cerrar y abrir la app.

---

### RF-11: Caché local de lectura (modo offline parcial)

**Descripción:** Cuando no hay conexión a internet, el usuario puede consultar los datos ya cargados previamente.

**Detalle:**
- RF-11.1: Al iniciar sesión, los datos del calendario se cargan desde Supabase y se almacenan en caché local.
- RF-11.2: Si no hay conexión, la app muestra los datos de la caché.
- RF-11.3: Las operaciones de escritura (crear, editar, eliminar) **requieren conexión** y muestran un error si no hay red.
- RF-11.4: Al recuperar la conexión, la caché se actualiza automáticamente con los datos más recientes de Supabase.

**Criterios de aceptación:**
- [ ] Sin conexión, se pueden ver las actividades ya cargadas.
- [ ] Sin conexión, no se pueden guardar cambios.
- [ ] Al volver la conexión, los datos se refrescan.

---

### RF-12: Distribución e información pública

**Descripción:** La app se distribuye como APK a través de una página web pública, mientras se resuelve la publicación en Google Play.

**Detalle:**
- RF-12.1: Existe una landing page con descripción, demostración, instrucciones de instalación, preguntas frecuentes y botón de descarga del APK.
- RF-12.2: La página muestra versión, tamaño y huella SHA-256 del APK para que el usuario pueda verificarlo.
- RF-12.3: Existe una política de privacidad pública (qué datos se guardan, para qué y cómo pedir su eliminación).
- RF-12.4: Cuando exista la ficha de Google Play, la landing muestra su botón y el APK queda como alternativa.
- RF-12.5: La landing funciona en claro y oscuro, en móvil y escritorio, y cumple criterios de accesibilidad básicos.

**Criterios de aceptación:**
- [x] El botón de la landing descarga el APK de la última release.
- [x] La política de privacidad es accesible desde la landing.
- [ ] Ficha de Google Play enlazada (pendiente).

---

## 4. Requisitos No Funcionales

### RNF-01: Rendimiento
- La app debe cargar la vista de calendario en menos de 2 segundos en condiciones normales de red.
- Las transiciones entre pantallas deben ser fluidas (60 fps).

### RNF-02: Seguridad
- Las contraseñas se almacenan hasheadas en Supabase Auth.
- Las comunicaciones con Supabase usan HTTPS/TLS.
- La sesión se almacena de forma segura en el dispositivo.
- Row Level Security (RLS) en Supabase: cada usuario solo puede ver y modificar sus propias actividades.

### RNF-03: Usabilidad
- La interfaz debe ser intuitiva para un usuario no técnico.
- Máximo 2 toques para llegar a cualquier funcionalidad principal (ver día, crear actividad).
- Textos en español.

### RNF-04: Compatibilidad
- Android 8.0+ (API 26+).
- iOS 15+.
- Optimizado para teléfonos (no tablets en MVP).

### RNF-07: Operación y mantenibilidad
- Pruebas automáticas de la lógica (`npm test`, 48 pruebas) y TypeScript estricto antes de cada release.
- Cada APK se verifica antes de publicarse (`npm run release:verify`): debe llevar incrustada la configuración de Supabase.
- Respaldo manual de la base de datos (`npm run db:backup`) antes de cambios de esquema.
- El *keystore* de firma de Android se respalda fuera del repositorio.

### RNF-05: Disponibilidad
- La app depende de Supabase para operaciones de escritura.
- Sin conexión, funciona en modo lectura con caché.
- En el plan gratuito de Supabase el proyecto se pausa tras ~1 semana sin actividad; se mitiga con una consulta programada cada 3 días (GitHub Actions).

### RNF-06: Accesibilidad
- Contraste de colores adecuado en ambos temas.
- Tamaños de toque mínimos de 44x44 puntos.
- Soporte para tamaño de fuente del sistema.

---

## 5. User Stories

| ID | Historia | Prioridad |
|---|---|---|
| US-01 | Como usuario nuevo, quiero registrarme con mi correo y contraseña para tener mi propia agenda. | Alta |
| US-02 | Como usuario, quiero entrar con mi correo y contraseña, sin un código extra. | Alta |
| US-03 | Como usuario, quiero que la sesión se mantenga al cerrar y abrir la app. | Alta |
| US-04 | Como usuario, quiero ver un calendario mensual con indicadores de colores para ubicar mis actividades de un vistazo. | Alta |
| US-05 | Como usuario, quiero tocar un día y ver, bajo el calendario, todas las actividades de ese día. | Alta |
| US-06 | Como usuario, quiero crear una actividad con título, categoría y nota. | Alta |
| US-07 | Como usuario, quiero editar una actividad existente si me equivoqué o cambió algo. | Alta |
| US-08 | Como usuario, quiero eliminar una actividad que ya no es relevante. | Alta |
| US-09 | Como usuario, quiero que mis actividades tengan colores según su categoría para identificarlas rápido. | Media |
| US-10 | Como usuario, quiero poder cambiar entre tema claro y oscuro según mi preferencia. | Media |
| US-11 | Como usuario, quiero poder consultar mi agenda incluso sin internet. | Media |
| US-12 | Como usuario, quiero que mis datos se guarden en la nube para no perderlos al cambiar de teléfono. | Alta |

---

## 6. Fuera de Alcance (Backlog futuro)

- Verificación por código de 6 dígitos. Queda para cuando el plan de Supabase permita editar las plantillas de correo.
- Actividades recurrentes o semanales.
- Notificaciones y recordatorios.
- Categorías personalizables por el usuario.
- Búsqueda de actividades.
- Exportación de datos (PDF, CSV).
- Compartición de calendarios.
- Vista semanal o anual.
- Integración con otros calendarios.
- Widgets de pantalla de inicio.
- **Eliminación de cuenta desde la app** (requisito de Google Play; requiere una Edge Function con `service_role` solo en servidor).
- Publicación en Google Play y versión iOS.
- Sincronización offline de escrituras.

---

## 7. Criterios de Éxito del Producto

- El usuario puede registrar y consultar sus actividades diarias sin fricción.
- La app no presenta errores críticos en las operaciones básicas (crear, leer, editar, eliminar).
- El usuario reporta que la app es "sencilla" y "fácil de usar".
- Los datos persisten correctamente entre dispositivos.

---

## 8. Supuestos y Dependencias

- **Supuesto:** El usuario tiene conexión a internet la mayor parte del tiempo para las operaciones de escritura.
- **Supuesto:** El usuario tiene un correo para crear la cuenta. No se le pide un código de verificación.
- **Dependencia:** Supabase (Auth + PostgreSQL + API REST).
- **Dependencia:** Expo SDK 58 + React Native 0.88. Node.js 22.x (mínimo 22.13).
- **Dependencia:** EAS Build (compilación del APK), GitHub (código y Releases) y Vercel (landing).

---

## 9. Glosario

| Término | Definición |
|---|---|
| **Actividad** | Evento o tarea que el usuario anota en un día concreto. |
| **Categoría** | Clasificación de una actividad (Reunión, Pendiente, etc.) con un color asociado. |
| **Caché local** | Almacenamiento temporal en el dispositivo para consulta offline. |
| **RLS** | Row Level Security: política de Supabase que restringe el acceso a datos por usuario. |
| **OTP** | Código de 6 dígitos por correo. Fuera del MVP hasta el plan de pago de Supabase. |
| **APK / AAB** | Formatos de instalación de Android: el APK se instala directamente; el AAB es el que exige Google Play. |
| **EAS** | *Expo Application Services*: compila el APK en la nube. |
| **Landing page** | Sitio web público desde el que se descarga la app. |
| **Release** | Versión publicada en GitHub con el archivo `kalendaria.apk` adjunto. |

---

## 10. Estado de implementación (noviembre 2026)

| Requisito | Estado |
|---|---|
| RF-01 a RF-03 (registro, login, cierre de sesión) | ✅ Implementado y probado en dispositivo |
| RF-04, RF-05 (calendario y detalle del día) | ✅ Implementado. El detalle del día es un panel bajo el calendario (cambio de UX de nov 2026) |
| RF-06 a RF-08 (crear, editar, eliminar) | ✅ Implementado |
| RF-09 (categorías con colores) | ✅ Implementado con la paleta del brief |
| RF-10 (tema claro/oscuro) | ✅ Implementado; la preferencia también se guarda en el perfil |
| RF-11 (caché de lectura) | ✅ Implementado |
| RF-12 (distribución por landing) | ✅ Landing publicada; APK 1.1.0 en GitHub Releases |
| RNF-04 iOS | ⏳ No publicado |
| Eliminación de cuenta | ⏳ Pendiente (requisito de Google Play) |

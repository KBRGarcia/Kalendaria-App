# Product Requirements Document (PRD)
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.0
**Fecha:** Octubre 2026
**Estado:** Aprobado

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

- Autenticación con correo y contraseña + verificación por código de 6 dígitos.
- Vista de calendario mensual.
- Vista de detalle de día.
- Creación, edición y eliminación de actividades.
- Categorías con colores.
- Tema claro y oscuro con toggle.
- Persistencia en la nube (Supabase).
- Caché local de lectura para consulta offline.

### 2.2. Fuera del alcance (explícitamente)

- Notificaciones de cualquier tipo (push, locales, alarmas).
- Actividades semanales o recurrentes.
- Integración con Google Calendar, Outlook, iCloud u otros.
- Sincronización offline completa (solo caché de lectura).
- Compartición de calendarios entre usuarios.
- Widgets, Apple Watch, wearables.
- Exportación de datos (por ahora).

---

## 3. Requisitos Funcionales

### RF-01: Autenticación — Registro

**Descripción:** El usuario puede crear una cuenta nueva introduciendo correo electrónico y contraseña.

**Detalle:**
- RF-01.1: El formulario de registro solicita: correo electrónico, contraseña y confirmación de contraseña.
- RF-01.2: La contraseña debe tener mínimo 8 caracteres, al menos una letra y un número.
- RF-01.3: Al enviar el formulario, se crea la cuenta en Supabase Auth y se envía automáticamente un **código de verificación de 6 dígitos** al correo indicado.
- RF-01.4: El usuario debe introducir el código en una pantalla de verificación para activar la cuenta.
- RF-01.5: Si el código es correcto, la cuenta queda verificada y el usuario accede a la app.
- RF-01.6: Si el código es incorrecto, se muestra un error y se permite reintentar.
- RF-01.7: El código de verificación tiene una vigencia de 10 minutos.

**Criterios de aceptación:**
- [ ] Un usuario nuevo puede registrarse con email y contraseña.
- [ ] Recibe el código de verificación en su correo.
- [ ] Al introducir el código correcto, accede a la app.
- [ ] Con un código incorrecto, ve un mensaje de error y puede reintentar.

---

### RF-02: Autenticación — Inicio de sesión

**Descripción:** El usuario puede iniciar sesión con su correo y contraseña. El sistema aplica una política de "confianza por tiempo" para decidir si requiere verificación adicional por código.

**Detalle:**
- RF-02.1: El formulario de login solicita: correo electrónico y contraseña.
- RF-02.2: Si las credenciales son correctas **y** el último inicio de sesión fue hace **menos de 30 días**, el usuario entra directamente a la app.
- RF-02.3: Si las credenciales son correctas **pero** el último inicio de sesión fue hace **30 días o más**, se envía un **código de verificación** al correo y se muestra la pantalla de verificación antes de permitir el acceso.
- RF-02.4: Si las credenciales son incorrectas, se muestra un error genérico ("Correo o contraseña incorrectos") sin revelar cuál de los dos falló.
- RF-02.5: La sesión persistente se guarda de forma segura en el dispositivo.

**Criterios de aceptación:**
- [ ] Login con credenciales válidas y última conexión reciente → acceso directo.
- [ ] Login con credenciales válidas y última conexión antigua → se solicita código de verificación.
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
- RF-04.5: Al tocar un día, se navega a la **vista de detalle del día**.
- RF-04.6: El usuario puede navegar entre meses (anterior/siguiente) mediante botones de flecha o gestos de swipe.
- RF-04.7: El mes y año actuales se muestran en la parte superior.
- RF-04.8: El día de hoy se resalta visualmente (borde o fondo diferente).

**Criterios de aceptación:**
- [ ] Se ve el mes actual al abrir la app.
- [ ] Los días con actividades muestran indicadores de color.
- [ ] Tocar un día abre el detalle de ese día.
- [ ] Se puede navegar entre meses.

---

### RF-05: Vista de Detalle del Día

**Descripción:** Muestra todas las actividades de un día concreto y permite crear una nueva.

**Detalle:**
- RF-05.1: Se muestra la fecha completa del día seleccionado (ej: "Martes, 14 de octubre de 2026").
- RF-05.2: Se listan todas las actividades de ese día, ordenadas por hora de creación o alfabéticamente.
- RF-05.3: Cada actividad muestra: título, categoría (con color) y una nota opcional.
- RF-05.4: Si no hay actividades, se muestra un estado vacío con un mensaje ("No hay actividades para este día").
- RF-05.5: Hay un botón flotante o en la parte inferior para **crear una nueva actividad** en ese día.
- RF-05.6: Al tocar una actividad existente, se abre la pantalla de edición.
- RF-05.7: El usuario puede volver al calendario mensual con un botón de retroceso.

**Criterios de aceptación:**
- [ ] Se ven todas las actividades del día seleccionado.
- [ ] Cada actividad muestra título y color de categoría.
- [ ] Se puede crear una actividad desde esta pantalla.
- [ ] Se puede tocar una actividad para editarla.

---

### RF-06: Creación de Actividad

**Descripción:** Formulario para crear una nueva actividad en un día concreto.

**Detalle:**
- RF-06.1: El formulario se abre desde la vista de detalle del día.
- RF-06.2: Campos del formulario:
  - **Título** (obligatorio, texto libre, máximo 100 caracteres).
  - **Categoría** (obligatorio, selección entre las categorías predefinidas).
  - **Nota** (opcional, texto libre, máximo 500 caracteres).
- RF-06.3: La fecha se toma automáticamente del día seleccionado (no editable desde aquí, pero se muestra).
- RF-06.4: Al guardar, la actividad se inserta en Supabase y aparece en la lista del día.
- RF-06.5: Si el título está vacío, no se permite guardar.
- RF-06.6: Tras guardar, se vuelve a la vista de detalle del día.

**Criterios de aceptación:**
- [ ] Se puede crear una actividad con título y categoría.
- [ ] La actividad aparece inmediatamente en el día.
- [ ] No se puede guardar sin título.

---

### RF-07: Edición de Actividad

**Descripción:** Permite modificar una actividad existente.

**Detalle:**
- RF-07.1: Se accede tocando una actividad en la vista de detalle del día.
- RF-07.2: El formulario se precarga con los datos actuales (título, categoría, nota).
- RF-07.3: Se pueden modificar todos los campos editables (título, categoría, nota).
- RF-07.4: Al guardar, los cambios se persisten en Supabase.
- RF-07.5: Se vuelve a la vista de detalle del día.

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
  - **Reunión** — Color: Azul
  - **Pendiente** — Color: Naranja
  - **Personal** — Color: Verde
  - **Trabajo** — Color: Púrpura
  - **Otro** — Color: Gris
- RF-09.2: El color de la categoría se refleja en:
  - El indicador del día en el calendario mensual.
  - La etiqueta de la actividad en la lista del día.
- RF-09.3: En el MVP, las categorías son **fijas** (no editables por el usuario). En una versión futura se podría permitir personalización.

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

### RNF-05: Disponibilidad
- La app depende de Supabase para operaciones de escritura.
- Sin conexión, funciona en modo lectura con caché.

### RNF-06: Accesibilidad
- Contraste de colores adecuado en ambos temas.
- Tamaños de toque mínimos de 44x44 puntos.
- Soporte para tamaño de fuente del sistema.

---

## 5. User Stories

| ID | Historia | Prioridad |
|---|---|---|
| US-01 | Como usuario nuevo, quiero registrarme con mi correo y contraseña para tener mi propia agenda. | Alta |
| US-02 | Como usuario, quiero verificar mi cuenta con un código enviado a mi correo para mayor seguridad. | Alta |
| US-03 | Como usuario, quiero iniciar sesión rápidamente si me he conectado recientemente. | Alta |
| US-04 | Como usuario, quiero ver un calendario mensual con indicadores de colores para ubicar mis actividades de un vistazo. | Alta |
| US-05 | Como usuario, quiero tocar un día y ver todas las actividades de ese día. | Alta |
| US-06 | Como usuario, quiero crear una actividad con título, categoría y nota. | Alta |
| US-07 | Como usuario, quiero editar una actividad existente si me equivoqué o cambió algo. | Alta |
| US-08 | Como usuario, quiero eliminar una actividad que ya no es relevante. | Alta |
| US-09 | Como usuario, quiero que mis actividades tengan colores según su categoría para identificarlas rápido. | Media |
| US-10 | Como usuario, quiero poder cambiar entre tema claro y oscuro según mi preferencia. | Media |
| US-11 | Como usuario, quiero poder consultar mi agenda incluso sin internet. | Media |
| US-12 | Como usuario, quiero que mis datos se guarden en la nube para no perderlos al cambiar de teléfono. | Alta |

---

## 6. Fuera de Alcance (Backlog futuro)

- Actividades recurrentes o semanales.
- Notificaciones y recordatorios.
- Categorías personalizables por el usuario.
- Búsqueda de actividades.
- Exportación de datos (PDF, CSV).
- Compartición de calendarios.
- Vista semanal o anual.
- Integración con otros calendarios.
- Widgets de pantalla de inicio.

---

## 7. Criterios de Éxito del Producto

- El usuario puede registrar y consultar sus actividades diarias sin fricción.
- La app no presenta errores críticos en las operaciones básicas (crear, leer, editar, eliminar).
- El usuario reporta que la app es "sencilla" y "fácil de usar".
- Los datos persisten correctamente entre dispositivos.

---

## 8. Supuestos y Dependencias

- **Supuesto:** El usuario tiene conexión a internet la mayor parte del tiempo para las operaciones de escritura.
- **Supuesto:** El usuario tiene un correo electrónico activo para la verificación.
- **Dependencia:** Supabase (Auth + PostgreSQL + API REST).
- **Dependencia:** Expo SDK 58 + React Native 0.88. Node.js 22.x (mínimo 22.13).

---

## 9. Glosario

| Término | Definición |
|---|---|
| **Actividad** | Evento o tarea que el usuario anota en un día concreto. |
| **Categoría** | Clasificación de una actividad (Reunión, Pendiente, etc.) con un color asociado. |
| **Caché local** | Almacenamiento temporal en el dispositivo para consulta offline. |
| **RLS** | Row Level Security: política de Supabase que restringe el acceso a datos por usuario. |
| **OTP** | One-Time Password: código de 6 dígitos enviado por correo para verificación. |
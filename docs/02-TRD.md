# Technical Requirements Document (TRD)
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.1
**Fecha:** Octubre 2026 · actualizado en noviembre 2026
**Estado:** Implementado (v1.0.0)
**Documento base:** `01-PRD.md`
**Documentos relacionados:** `09-Supabase.md`, `11-Expo.md`, `12-Herramientas-Dependencias.md`, `13-Backend-Flujo.md`

---

## 1. Resumen Técnico

Kalendaria es una aplicación móvil construida con **Expo** y **React Native** (Android publicado; iOS preparado), con **Expo Router** para navegación basada en archivos, **Zustand** para estado global, **Supabase** como backend (autenticación + PostgreSQL + API REST con RLS), **expo-secure-store** para la sesión y **AsyncStorage** para la caché de lectura y las preferencias. No hay servidor propio: la app habla directamente con Supabase. El objetivo técnico es una app ligera, mantenible y sin dependencias innecesarias.

Piezas fuera de la app: **EAS Build** compila el APK, **GitHub Releases** lo aloja y **Vercel** sirve la landing de descarga (`10-Vercel.md`).

---

## 2. Stack Tecnológico

### 2.1. Entorno de desarrollo

| Herramienta | Versión | Uso |
|---|---|---|
| **Node.js** | 22.x LTS (mínimo 22.13, vía nvm) | Runtime para npm, Metro, pruebas y CLI de Expo. No usar 20.x ni 25.x para compilar. |
| **npm** | Incluido con Node | Gestión de dependencias y scripts |
| **Development build** | SDK 58 | Ejecución en dispositivo o emulador. Expo Go de la tienda no abre este proyecto. |
| **EAS CLI** | vía `npx eas-cli` | Compilación de APK/AAB, variables y credenciales |
| **TypeScript** | ~6.0.3 | Tipado estático (`strict: true`) en todo el código |
| **node:test** | Incluido en Node 22 | Pruebas de lógica (TypeScript ejecutado directamente) |

> **Nota:** No usar `expo-cli` global (obsoleto). Siempre `npx expo` dentro del proyecto.

### 2.2. Framework y plataforma

| Paquete | Versión | Rol |
|---|---|---|
| `expo` | SDK 58 (`~58.0.24`) | Plataforma, bundler, plugins nativos |
| `react` | 19.3.0 | Motor de UI. El SDK lo fija en esta versión; no subirlo a 19.3.1. |
| `react-native` | 0.88.1 | Componentes nativos |
| `react-dom` | 19.3.0 (`overrides`) | Solo para resolver un peer de `expo-router`. No es un objetivo web. |

> **Nota:** `experiments.typedRoutes` y `experiments.reactCompiler` están activos. El punto de entrada es `expo-router/entry` y las rutas viven en `src/app`, no en `app/` en la raíz. En Android el modo *edge-to-edge* está activo (SDK 58): ver §3.5.

### 2.3. Navegación

| Paquete | Rol |
|---|---|
| `expo-router` | Navegación basada en archivos (file-based routing) |
| `react-native-screens` | Pantallas nativas (dependencia de expo-router) |
| `react-native-safe-area-context` | Áreas seguras (notch, barras del sistema) |
| `react-native-gesture-handler` | Gestos nativos (dependencia de la navegación) |
| `react-native-reanimated` | Motor de animaciones (requisito del ecosistema de navegación; las animaciones propias usan la API `Animated` de RN) |
| `react-native-worklets` | Peer obligatorio de Reanimated en SDK 58 |

**Estructura de rutas (Expo Router).** Los grupos `(auth)` y `(app)` no aparecen en la ruta.

```
src/app/
├── _layout.tsx          # Layout raíz: splash, fuentes, tema, sesión, ErrorBoundary
├── index.tsx            # Redirect: con sesión → /calendar; sin sesión → /login
├── (auth)/              # Autenticación
│   ├── _layout.tsx      # Si ya hay sesión → /calendar
│   ├── login.tsx
│   └── register.tsx
└── (app)/               # Rutas protegidas
    ├── _layout.tsx      # Guard de autenticación; presenta activity/* como modal transparente
    ├── calendar.tsx     # Calendario mensual (home) con el panel de actividades del día seleccionado
    ├── activity/new.tsx # Hoja modal: crear actividad (?date=YYYY-MM-DD)
    ├── activity/[id].tsx# Hoja modal: ver/editar/eliminar
    └── settings.tsx     # Ajustes (tema, cuenta, cerrar sesión, versión)
```

> **Cambio respecto a la versión 1.0:** la ruta `day/[date]` se eliminó (nov 2026). Tocar un día lo selecciona y muestra sus actividades bajo el calendario (`DayActivities`); solo crear y abrir una actividad navegan, como hojas modales.

No añadas un `app/` en la raíz: si existen los dos, Expo Router usa solo `src/app`.

### 2.4. Estado y persistencia

| Paquete | Rol |
|---|---|
| `zustand` | Stores ligeros (`useAuthStore`, `useActivitiesStore`, `useThemeStore`) |
| `@react-native-async-storage/async-storage` | Persistencia clave-valor local (caché de lectura + preferencia de tema) |
| `@react-native-community/netinfo` | Detección de conexión |

**Decisión:** Zustand en lugar de Redux porque el estado es simple y no requiere middleware complejo. AsyncStorage basta para el volumen de datos (actividades del mes).

### 2.5. Backend y autenticación

| Paquete | Rol |
|---|---|
| `@supabase/supabase-js` | Cliente oficial de Supabase |
| `react-native-url-polyfill` | Polyfill de `URL` necesario para Supabase en RN |
| `expo-secure-store` | Almacenamiento seguro del token de sesión |

**Supabase** provee: Auth (correo y contraseña), PostgreSQL con RLS y API REST autogenerada (PostgREST). El código de 6 dígitos queda fuera hasta el plan de pago. Detalle en `09-Supabase.md`.

### 2.6. Utilidades e interfaz

| Paquete | Rol |
|---|---|
| `date-fns` | Fechas (formato, comparación, locale `es`) |
| `@react-native-vector-icons/ionicons` | Íconos. Expo lo recomienda desde SDK 56 y marca `@expo/vector-icons` como no recomendado. |
| `@expo-google-fonts/inter` + `expo-font` | Fuente Inter |
| `expo-status-bar` | Barra de estado según el tema |

### 2.7. Funcionalidades nativas (Expo modules)

| Paquete | Rol |
|---|---|
| `expo-splash-screen` | Splash nativo; se oculta al terminar fuentes, tema y sesión |
| `expo-haptics` | Feedback táctil ligero (guardar, eliminar, cambiar de mes) |
| `expo-constants`, `expo-linking` | Configuración en ejecución y enlaces (requeridos por Expo Router) |

> **Importante:** NO se incluye `expo-notifications` ni `expo-keep-awake`: la app no usa notificaciones ni mantiene la pantalla encendida.

### 2.8. Plugins de Expo (`app.json`)

```json
"plugins": [
  "expo-router",
  "expo-status-bar",
  "expo-secure-store",
  ["expo-splash-screen", {
    "backgroundColor": "#F2ECEA",
    "image": "./assets/logo-name-kalendaria.png",
    "imageWidth": 200,
    "resizeMode": "contain",
    "dark": { "backgroundColor": "#0E1C22", "image": "./assets/logo-name-kalendaria.png" }
  }],
  "expo-font",
  "@react-native-vector-icons/ionicons"
]
```

Identificador de la app: `android.package = com.kalendaria.app` (permanente una vez publicada).

---

## 3. Arquitectura de la Aplicación

### 3.1. Estructura de carpetas

```
Kalendaria/
├── src/
│   ├── app/                      # Rutas (Expo Router). No crear app/ en la raíz.
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── (auth)/               # login, register
│   │   └── (app)/                # calendar, activity/new, activity/[id], settings
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Button, Input, IconButton, Fab, ConfirmDialog, EmptyState,
│   │   │                         # SegmentedControl, Loading, AuthScaffold, AppErrorBoundary
│   │   ├── auth/                 # LoginScreen, RegisterScreen
│   │   ├── calendar/             # CalendarScreen, MonthGrid, MonthNavigator, WeekdayHeader,
│   │   │                         # DayCell, CategoryDots, DayActivities
│   │   ├── activity/             # ActivityCard, ActivityForm, ActivitySheet, CategoryPicker,
│   │   │                         # NewActivityScreen, EditActivityScreen
│   │   └── settings/             # SettingsScreen
│   ├── constants/
│   │   ├── categories.ts         # Categorías, etiquetas y type guards
│   │   ├── activities.ts         # Mensajes de actividades
│   │   └── auth.ts               # Mensajes de autenticación
│   ├── hooks/
│   │   ├── useAuth.ts            # useAuth, useAuthGate, useAuthLifecycle
│   │   ├── useMonthActivities.ts # Carga del mes y recarga al volver la conexión
│   │   ├── useNetworkStatus.ts
│   │   └── useThemePreference.ts # Sincroniza el tema con profiles.theme_preference
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase (SecureStore troceado, env estáticas)
│   │   ├── cache.ts              # Caché de AsyncStorage
│   │   ├── dates.ts              # Helpers de date-fns
│   │   └── sessionNotice.ts      # Aviso de sesión expirada para el login
│   ├── services/                 # Capa de servicios (API)
│   │   ├── authService.ts
│   │   ├── authErrors.ts
│   │   ├── authValidation.ts
│   │   ├── activitiesService.ts
│   │   └── activityValidation.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── activitiesStore.ts
│   │   └── themeStore.ts
│   ├── theme/
│   │   ├── colors.ts · typography.ts · spacing.ts · shadows.ts
│   │   └── ThemeProvider.tsx
│   └── types/
│       ├── activity.ts
│       └── database.ts           # Tipos generados por Supabase
├── landing/                      # Sitio web de descarga (Vercel)
├── supabase/                     # migrations/ (001–005) y templates/
├── tests/                        # Pruebas (node:test) y mocks
├── scripts/                      # verify-apk.sh · backup-db.sh
├── docs/                         # Documentación
├── assets/                       # icon.png, splash, logos, android-icon-*
├── .github/workflows/keepalive.yml
├── app.json · eas.json · package.json · tsconfig.json
└── .env.local                    # Variables de entorno (NO commitear)
```

### 3.2. Patrón de arquitectura
Arquitectura en capas:
1. UI (componentes + pantallas) → solo presentación, sin lógica de negocio.
2. Hooks → conectan UI con stores y red.
3. Stores (Zustand) → estado global y orquestación (caché, invalidación de peticiones, sesión expirada).
4. Servicios → acceso a Supabase, validación y traducción de errores.
5. Supabase / AsyncStorage / SecureStore → persistencia.

Flujo típico de una acción:

```
Usuario toca "Guardar" en ActivityForm
  → handleSubmit (NewActivityScreen)
    → useActivitiesStore.createActivity(data)            (store)
      → activitiesService.create(data)                   (servicio)
        → supabase.from('activities').insert(...)        (Supabase)
      ← actualiza activitiesByDate y la caché del mes
    ← la UI se re-renderiza; la hoja se cierra
```

El flujo completo (rutas, peticiones HTTP, SQL, errores) está en `13-Backend-Flujo.md`.

### 3.3. Configuración de TypeScript

`strict: true`. Alias en `tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"],
  "@/assets/*": ["./assets/*"],
  "@components/*": ["./src/components/*"],
  "@hooks/*": ["./src/hooks/*"],
  "@store/*": ["./src/store/*"],
  "@services/*": ["./src/services/*"],
  "@theme/*": ["./src/theme/*"],
  "@lib/*": ["./src/lib/*"],
  "@types/*": ["./src/types/*"],
  "@constants/*": ["./src/constants/*"]
}
```

Las pruebas tienen su propio `tests/tsconfig.json` (`npm run typecheck` revisa ambos).

### 3.4. Variables de entorno

Archivo `.env.local` (no commiteado):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

> **Regla crítica (aprendida en v1.0.0).** Expo **sustituye por su valor, al compilar**, las referencias estáticas `process.env.EXPO_PUBLIC_X`. Una lectura dinámica (`process.env[nombre]`) o una desestructuración **funciona en desarrollo pero devuelve `undefined` en el APK**, y la app se cierra al abrir. El cliente de Supabase lee las dos variables de forma estática; `tests/env.test.ts` impide regresiones y `npm run release:verify` comprueba el APK. En compilaciones de EAS las variables deben existir en el entorno correspondiente (`preview`, `production`).

### 3.5. Teclado en Android (edge-to-edge)

Con SDK 58 Android corre en modo *edge-to-edge* y **ya no redimensiona la ventana** cuando aparece el teclado (`adjustResize` no tiene efecto). Por eso `KeyboardAvoidingView` usa `behavior="padding"` en **ambas** plataformas (`AuthScaffold`, `ActivitySheet`), y la hoja de actividad limita su altura al espacio libre sobre el teclado.

---

## 4. Autenticación — Diseño Técnico

### 4.1. Flujo de registro
1. Usuario completa formulario (email + password + confirmación).
2. Cliente valida localmente (regex de email; contraseña ≥ 8 con letra y número).
3. Se llama `supabase.auth.signUp({ email, password })`.
4. Con *Confirm email* desactivado, Supabase devuelve sesión. Si el correo ya existe, `identities` viene vacío → error de correo duplicado.
5. Se registra `last_login_at` (RPC **no bloqueante**: si falla, el acceso continúa) y el guard redirige a `/calendar`.
6. Si *Confirm email* sigue activo y no hay sesión, la app muestra un error genérico y no abre una pantalla de código.

### 4.2. Flujo de login
1. Usuario ingresa email + password; validación local.
2. `supabase.auth.signInWithPassword({ email, password })`.
3. Si son válidas, se registra `last_login_at` (no bloqueante) y se redirige a `/calendar`.
4. Si no, se muestra "Correo o contraseña incorrectos." (sin revelar cuál falló).

El código de 6 dígitos y la regla de 30 días no forman parte del flujo actual. Vuelven cuando el plan de Supabase permita editar las plantillas.

### 4.3. Persistencia de sesión
- `src/lib/supabase.ts` guarda la sesión en `expo-secure-store` mediante un adaptador que **trocea** los valores en bloques de 1800 caracteres (Android limita cada valor a 2048 bytes).
- Decisión de Fase 0: no usar el quickstart de Supabase para Expo (persiste con `expo-sqlite/localStorage`). SecureStore guarda el token en el llavero del sistema. No cambies el adaptador sin una decisión explícita.
- El módulo **lanza** si faltan las variables; por eso deben estar disponibles al compilar (§3.4).
- Al abrir la app, `getSession()` restaura la sesión; `autoRefreshToken` la renueva.
- `src/app/(app)/_layout.tsx` verifica sesión; si no hay, redirige a `/login`.

### 4.4. Configuración Supabase
- Confirm email: **desactivado** (plan gratuito, sin plantillas editables).
- Longitud mínima de contraseña: 8.
- Rate limiting: valores por defecto.
- El código de 6 dígitos se recupera al pasar a un plan que permita editar *Confirm signup* y *Magic Link*.

### 4.5. Sesión expirada
Si una consulta devuelve JWT caducado/inválido (`PGRST301`, `bad_jwt`, `refresh_token_*`, 401), el store guarda el aviso "Tu sesión expiró. Vuelve a entrar.", cierra la sesión local y el guard lleva al login, que muestra el aviso una vez.

---

## 5. Backend — Supabase

El esquema SQL, las políticas RLS y las funciones están en `05-Backend-Schema.md` y en `supabase/migrations/001…005`. Resumen:

### 5.1. Tabla `activities`

| Columna | Tipo | Restricciones |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| user_id | uuid | NOT NULL, FK → `auth.users.id`, ON DELETE CASCADE |
| date | date | NOT NULL (YYYY-MM-DD) |
| title | text | NOT NULL, 1–100 caracteres |
| category | text | NOT NULL, CHECK en `reunion`, `pendiente`, `personal`, `trabajo`, `otro` |
| note | text | NULL, ≤ 500 caracteres |
| created_at / updated_at | timestamptz | NOT NULL, default `now()` (`updated_at` lo mantiene un *trigger*) |

Índices: `activities_user_date_idx (user_id, date)` y `activities_date_idx (date)`. RLS: `SELECT`, `INSERT`, `UPDATE` y `DELETE` solo de filas propias (`auth.uid() = user_id`).

### 5.2. Tabla `profiles` (extiende `auth.users`)

| Columna | Tipo | Restricciones |
|---|---|---|
| id | uuid | PK, FK → `auth.users.id`, ON DELETE CASCADE |
| email | text | NOT NULL |
| last_login_at | timestamptz | NULL |
| theme_preference | text | NOT NULL, CHECK en `light`, `dark`, `system`; default `system` |
| created_at / updated_at | timestamptz | NOT NULL, default `now()` |

Un *trigger* crea la fila al registrarse un usuario. `theme_preference` se guarda también localmente (arranque instantáneo y offline); la base es la fuente de verdad al cambiar de dispositivo.

### 5.3. Consultas principales (reales)

```ts
// Mes
supabase.from('activities').select('id, user_id, date, title, category, note, created_at, updated_at')
  .gte('date', start).lte('date', end).order('date').order('created_at');
// Crear
supabase.from('activities').insert({ user_id, date, title, category, note }).select(cols).single();
// Actualizar / eliminar
supabase.from('activities').update({ title, category, note }).eq('id', id).select(cols).single();
supabase.from('activities').delete().eq('id', id);
// Último acceso
supabase.rpc('update_last_login');
```

---

## 6. Gestión de Estado (Zustand)

### 6.1. authStore

```ts
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;        // operación de login/registro/logout en curso
  isInitialized: boolean;    // la sesión ya se intentó restaurar
  initialize: () => () => void;   // devuelve la función de limpieza de la suscripción
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### 6.2. activitiesStore

```ts
interface ActivitiesState {
  activitiesByDate: Record<string, Activity[]>;  // indexado por YYYY-MM-DD
  isLoading: boolean;
  error: string | null;
  fetchMonth: (year: number, month: number) => Promise<void>;
  createActivity: (input: ActivityCreateInput) => Promise<void>;
  updateActivity: (id: string, input: ActivityUpdateInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  clearLocalActivities: () => void;
  getActivitiesForDate: (date: string) => Activity[];
}
```

Detalles: cada `fetchMonth` incrementa un *token* y descarta respuestas obsoletas; los meses ya cargados se **revalidan en silencio** (sin spinner); las escrituras actualizan estado y caché solo si tienen éxito.

### 6.3. themeStore

```ts
interface ThemeState {
  preference: 'light' | 'dark' | 'system';
  setPreference: (pref: 'light' | 'dark' | 'system') => void;
}
```

Persistido con `zustand/middleware` + AsyncStorage (clave `@kalendaria:theme`); `useThemeHydrated()` retiene el splash hasta hidratar.

---

## 7. Caché Local y Modo Offline

### 7.1. Estrategia
- **Lectura:** al cargar un mes se guarda el resultado en AsyncStorage (`@kalendaria:cache:activities:YYYY-MM`) y la marca `@kalendaria:lastSync`.
- **Fallback:** si `fetchMonth` falla por falta de red, se lee la caché del mes y se marca el error "Sin conexión".
- **Escritura:** requiere conexión. `ActivityForm` deshabilita Guardar y Eliminar y muestra "Sin conexión. Revisa tu internet.".
- **Invalidación:** cada escritura actualiza la caché de su mes; iniciar sesión, registrarse y cerrar sesión borran **toda** la caché.
- **Recarga:** `useMonthActivities` vuelve a pedir el mes al recuperar la conexión.

### 7.2. Detección de conexión
`useNetworkStatus()` (basado en `useNetInfo().isConnected`). `null` (aún desconocido) se trata como en línea.

---

## 8. Sistema de Temas
- Paleta y tokens en `src/theme/` (definidos en `04-UIUX-Brief.md`).
- `useTheme()` devuelve el tema activo; `ThemeProvider` resuelve `system` con `useColorScheme()`.
- Persistencia: AsyncStorage + `profiles.theme_preference` (se aplica al iniciar sesión).

---

## 9. Manejo de Fechas
- Librería: `date-fns` (sin mutaciones), locale `es`.
- Formato interno: `YYYY-MM-DD` (string) para la columna `date`.
- Formato de pantalla: `"EEEE, d 'de' MMMM 'de' yyyy"` → "Miércoles, 14 de octubre de 2026".
- La semana empieza en **lunes**; la cuadrícula siempre tiene 42 celdas.
- `shiftMonth` ancla al día 1 para no saltarse meses cortos desde el día 31.

---

## 10. Seguridad
- Auth gestionada por Supabase Auth; contraseñas con bcrypt.
- RLS en todas las tablas; función RPC con `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` solo para `authenticated`.
- Tokens en `expo-secure-store`.
- HTTPS/TLS en todas las comunicaciones.
- `EXPO_PUBLIC_*` solo para URL y clave publicable (públicas por diseño). **Ninguna** `service_role` en el cliente.
- Mensajes de error genéricos en autenticación.
- Landing: CSP estricta sin `unsafe-inline`, HSTS y demás encabezados en `landing/vercel.json`.

---

## 11. Rendimiento
- `FlatList` para la lista de actividades del día (virtualización).
- `React.memo` en `DayCell`, `MonthGrid` y `ActivityCard`; React Compiler activo.
- Revalidación silenciosa de meses ya cargados (sin spinner ni parpadeo del estado vacío).
- Cada mes se consulta una sola vez por visita; se descartan respuestas obsoletas.
- Lazy loading de pantallas vía Expo Router.
- Lectura del llavero minimizada: el adaptador de SecureStore usa borrados idempotentes.
- Bundle de producción en Hermes (bytecode).

---

## 12. Manejo de Errores
- Errores de red: "Sin conexión. Revisa tu internet.".
- Errores de auth: genéricos ("Correo o contraseña incorrectos.").
- Errores de Supabase: traducidos a mensajes en español; detalle técnico solo en consola en desarrollo (`__DEV__`).
- `AppErrorBoundary` global captura errores de renderizado y ofrece "Reintentar".
- Sesión expirada: cierre de sesión con aviso (§4.5).
- Un fallo de arranque (p. ej. variables ausentes) **no** lo captura el *ErrorBoundary* porque ocurre al importar el cliente; por eso se verifica el APK antes de publicarlo.

---

## 13. Testing
- **Unitarias y de integración de lógica** con `node:test` (`npm test`, **48 pruebas**): fechas, validaciones, caché, traducción de errores, servicios y stores. Usan un cliente Supabase falso y AsyncStorage en memoria (`tests/mocks`); no tocan la base real.
- **Prueba de regresión de entorno** (`tests/env.test.ts`): prohíbe `process.env[...]` en `src/`.
- **Verificación de APK** (`npm run release:verify`): comprueba la configuración incrustada, tamaño y SHA-256.
- **Manual:** prueba del APK en un teléfono real antes de cada release (lista en `08-Guia-Produccion.md` §4.2).
- **No implementado:** pruebas de componentes (Testing Library) ni E2E (Maestro opcional).

---

## 14. Build y Deployment

### 14.1. Desarrollo
- `npm start` levanta Metro. El proyecto es SDK 58: en dispositivo hace falta un *development build* (`npm run android`).

### 14.2. Build de producción (EAS)
Perfiles en `eas.json` (todos con `node: 22.13.0`):
- `development`: cliente de desarrollo.
- `preview`: APK interno (entorno `preview`).
- `production-apk`: APK para la web, `versionCode` autoincrementado (entorno `production`).
- `production`: AAB para Google Play, `versionCode` autoincrementado.

### 14.3. Distribución
- **Actual:** APK en **GitHub Releases** (`kalendaria.apk`) enlazado desde la landing en **Vercel** (`07-Distribucion.md`).
- **Futuro:** Google Play (AAB; requiere eliminar cuenta desde la app) y App Store (requiere cuenta de Apple Developer).

### 14.4. Operación
- `.github/workflows/keepalive.yml`: consulta de solo lectura cada 3 días para evitar la pausa del plan gratuito de Supabase.
- `scripts/backup-db.sh`: respaldo con `pg_dump`.
- `scripts/verify-apk.sh`: verificación previa a la publicación.

---

## 15. Convenciones de Código
- Nombrado: camelCase para variables/funciones, PascalCase para componentes y tipos.
- Archivos: componentes en PascalCase.tsx, utilidades en camelCase.ts.
- Imports: alias `@/*` en lugar de rutas relativas largas.
- Estilos: `StyleSheet.create` en el mismo archivo del componente; temas vía hook.
- Componentes funcionales con hooks (la única clase es `AppErrorBoundary`, porque React solo permite *error boundaries* como clase).
- TypeScript: `strict: true`; evitar `any`; usar tipos generados por Supabase.
- Sin `console.log` en código final: los registros van dentro de `if (__DEV__)`.
- Commits: Conventional Commits.
- ESLint + Prettier: previstos con `eslint-config-expo`, **aún sin instalar**.

---

## 16. Riesgos Técnicos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| *Confirm email* activo bloquea el registro | Alto | Mantenerlo desactivado; la app muestra un error genérico si la sesión no llega |
| Variables `EXPO_PUBLIC_*` no incrustadas en el APK (lectura dinámica o sin cargar en EAS) | Alto | Lectura estática + `tests/env.test.ts` + `npm run release:verify` antes de publicar |
| Pausa del proyecto de Supabase por inactividad (plan gratuito) | Alto | Workflow `keepalive.yml`; respaldo manual |
| Pérdida del *keystore* de Android | Alto | Respaldo fuera del repositorio (`npx eas-cli credentials`) |
| Desarrollo y producción comparten el mismo proyecto de Supabase | Medio | Cuenta de prueba aparte, respaldo antes de cambiar el esquema, migraciones solo aditivas |
| Conflictos de caché local vs servidor | Bajo | Actualizar caché tras cada escritura y vaciarla en cada cambio de sesión |
| Expo Router en fase de cambios | Bajo | Versiones fijadas en `package.json` y `npx expo install --fix` |
| Dependencia total de Supabase | Medio | Backend abstraído en `services/`; migrar sería factible |
| El teclado cubre campos en Android (edge-to-edge) | Medio | `KeyboardAvoidingView` con `padding` en ambas plataformas |

---

## 17. Roadmap Técnico Post-MVP (Backlog)
- Eliminación de cuenta (Edge Function de Supabase con `service_role` solo en servidor): requisito de Google Play.
- Publicación en Google Play y App Store.
- Sync offline completo (cola de operaciones pendientes).
- Realtime con Supabase (cambios entre dispositivos).
- Verificación por código de 6 dígitos (con plan de pago).
- Personalización de categorías por usuario.
- Exportación a PDF/CSV, widgets nativos.
- Pruebas de componentes y E2E.
- ESLint + Prettier.
- Actualizaciones por aire (EAS Update).

---

## 18. Dependencias instaladas

Resueltas con `npx expo install` para SDK 58. Fuente de verdad: `package.json`. Papel de cada una en `12-Herramientas-Dependencias.md`.

```json
{
  "dependencies": {
    "expo": "~58.0.24",
    "expo-router": "~58.0.31",
    "expo-constants": "~58.0.13",
    "expo-font": "~58.0.10",
    "expo-linking": "~58.0.17",
    "expo-secure-store": "~58.0.3",
    "expo-splash-screen": "~58.0.13",
    "expo-status-bar": "~58.0.5",
    "expo-haptics": "~58.0.8",
    "react": "19.3.0",
    "react-native": "0.88.1",
    "react-native-safe-area-context": "~5.11.1",
    "react-native-screens": "~4.30.1",
    "react-native-gesture-handler": "~3.3.0",
    "react-native-reanimated": "4.7.1",
    "react-native-worklets": "0.13.0",
    "react-native-url-polyfill": "^4.0.0",
    "@supabase/supabase-js": "^2.118.0",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-native-community/netinfo": "12.0.1",
    "@react-native-vector-icons/ionicons": "^14.0.0",
    "@expo-google-fonts/inter": "^0.4.2",
    "zustand": "^5.0.16",
    "date-fns": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "~6.0.3",
    "@types/react": "~19.3.0",
    "@types/node": "^22.20.5"
  },
  "overrides": { "react-dom": "19.3.0" }
}
```

ESLint y Prettier todavía no están instalados. Los íconos van en `@react-native-vector-icons/ionicons`; no añadas `@expo/vector-icons`.

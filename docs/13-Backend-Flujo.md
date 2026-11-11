# Backend de Kalendaria: arquitectura y flujo actual

**Versión:** 1.0 · **Fecha:** noviembre 2026 · **Documentos relacionados:** `09-Supabase.md` (el servicio), `05-Backend-Schema.md` (SQL), `02-TRD.md` (arquitectura general)

Este documento describe **cómo viaja un dato** desde que el usuario toca la pantalla hasta que llega a la base de datos y vuelve: rutas de la app, llamadas a la API, consultas SQL, seguridad, caché y manejo de errores.

---

## 1. Visión general

Kalendaria **no tiene servidor propio**. El "backend" es Supabase y el teléfono habla directamente con él:

```
┌───────────────────────── Teléfono (app) ─────────────────────────┐
│  Pantallas (src/app, src/components)                              │
│      │ solo presentación                                          │
│  Hooks (src/hooks) ──► Stores Zustand (src/store)                 │
│                            │ estado + reglas de flujo             │
│                        Servicios (src/services)                   │
│                            │ validan, llaman, traducen errores    │
│                     Cliente supabase-js (src/lib/supabase.ts)     │
│        ┌───────────────────┼─────────────────────┐                │
│  SecureStore (tokens)  AsyncStorage (caché, tema)  NetInfo (red)  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS (TLS)
┌───────────────────────────▼──────────────────────────────────────┐
│ Supabase                                                          │
│  /auth/v1/*  → Auth (GoTrue): usuarios, contraseñas, JWT          │
│  /rest/v1/*  → PostgREST: API REST generada desde las tablas      │
│        │ ejecuta SQL con el rol y el JWT del usuario              │
│  PostgreSQL + RLS: public.profiles · public.activities · RPC      │
└──────────────────────────────────────────────────────────────────┘
```

**Capas y responsabilidades** (la UI nunca llama a Supabase directamente):

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| UI | `src/components`, `src/app` | Mostrar y recoger entradas |
| Hooks | `src/hooks` | Conectar la UI con stores y red |
| Stores | `src/store` | Estado global y orquestación (caché, tokens de petición, sesión expirada) |
| Servicios | `src/services` | Consultas a Supabase, validación, traducción de errores a mensajes en español |
| Lib | `src/lib` | Cliente, caché, fechas |

---

## 2. Rutas de la app (Expo Router)

| Ruta | Archivo | Descripción | Protección |
|---|---|---|---|
| `/` | `src/app/index.tsx` | Redirige: con sesión → `/calendar`; sin sesión → `/login` | — |
| `/login` | `src/app/(auth)/login.tsx` | Inicio de sesión | Si ya hay sesión, redirige a `/calendar` |
| `/register` | `src/app/(auth)/register.tsx` | Registro | Igual |
| `/calendar` | `src/app/(app)/calendar.tsx` | Calendario + panel del día seleccionado (pantalla principal) | **Guard** |
| `/activity/new?date=YYYY-MM-DD` | `src/app/(app)/activity/new.tsx` | Hoja modal: crear actividad | Guard |
| `/activity/[id]` | `src/app/(app)/activity/[id].tsx` | Hoja modal: ver/editar/eliminar | Guard |
| `/settings` | `src/app/(app)/settings.tsx` | Tema, cuenta, cerrar sesión, versión | Guard |

- Los grupos `(auth)` y `(app)` no aparecen en la ruta.
- **Guard:** `src/app/(app)/_layout.tsx` usa `useAuthGate()`: mientras no se haya inicializado la sesión o haya una operación de auth en curso muestra un indicador de carga; si no hay sesión, `<Redirect href="/login" />`. `(auth)/_layout.tsx` hace lo inverso.
- Las rutas `activity/*` se presentan como `transparentModal` (hojas que suben sobre el calendario). Ya **no existe** una pantalla de detalle de día: tocar un día lo selecciona y muestra sus actividades bajo el calendario (nov 2026).
- **Arranque** (`src/app/_layout.tsx`): mantiene el *splash* hasta que cargan las fuentes Inter, se hidrata el tema persistido y se restaura la sesión (`getSession`).

---

## 3. Autenticación

### 3.1 Registro

```
RegisterScreen ─► valida (correo, contraseña ≥8 con letra y número, confirmación)
   └► authStore.signUp ─► authService.signUp
        ├ POST /auth/v1/signup  { email, password }
        │     ← { user, session }   (con Confirm email desactivado)
        │     · si user.identities está vacío → "Ese correo ya tiene una cuenta"
        │     · si no hay session → "No se pudo completar el registro…" (Confirm email activo)
        ├ Trigger en BD: INSERT en public.profiles (id, email)
        └ POST /rest/v1/rpc/update_last_login   (no bloqueante: si falla, el acceso sigue)
   └► authStore: forgetActivities() (limpia estado y caché) → getSession → set({ user, session })
   └► el guard detecta la sesión → /calendar
```

### 3.2 Login

```
LoginScreen ─► authStore.signIn ─► authService.signIn
   ├ valida (campos no vacíos, correo válido)
   ├ POST /auth/v1/token?grant_type=password  { email, password }
   │     ← { access_token (JWT), refresh_token, user }
   │     · credenciales malas → código invalid_credentials → "Correo o contraseña incorrectos."
   ├ POST /rest/v1/rpc/update_last_login   (no bloqueante)
   └ authStore: limpia caché de otro usuario, guarda sesión → /calendar
```

Si algo falla tras haberse creado una sesión, `authStore` la cierra (`clearLeakedSession`) para no dejar al usuario a medias.

### 3.3 Sesión persistente y renovación

- El cliente guarda `access_token` + `refresh_token` en **SecureStore** (troceados en bloques de 1800 caracteres).
- Al abrir la app, `authService.getSession()` restaura la sesión desde el almacén. Con `autoRefreshToken`, supabase-js renueva el token con `POST /auth/v1/token?grant_type=refresh_token` cuando caduca.
- `onAuthStateChange` mantiene el `authStore` sincronizado (el evento se ignora mientras hay un login/registro en curso para no pisar el estado).

### 3.4 Cierre de sesión

`authService.signOut()` → `POST /auth/v1/logout?scope=local` (revoca la sesión de **este** dispositivo; `session_not_found` se trata como éxito) → borra tokens locales → `authStore` limpia `activitiesByDate` y **toda la caché**. El guard redirige a `/login`.

### 3.5 Sesión expirada

Si cualquier consulta recibe un error de JWT caducado/inválido (`PGRST301`, `bad_jwt`, `refresh_token_*`, HTTP 401, mensajes `JWT expired`), `activitiesStore.leaveIfSessionExpired`: invalida peticiones en vuelo → guarda el aviso "Tu sesión expiró. Vuelve a entrar." (`sessionNotice`) → `signOut()`. El login muestra ese aviso una vez.

---

## 4. Actividades: consultas a la API y a la base

El cliente `supabase-js` traduce cada llamada a una petición HTTP a **PostgREST**, que ejecuta SQL con el rol `authenticated` y el JWT del usuario (así `auth.uid()` funciona dentro de las políticas RLS).

| Operación de la app | Llamada `supabase-js` (en `activitiesService`) | Petición HTTP | SQL resultante (simplificado) |
|---|---|---|---|
| Cargar un mes | `.from('activities').select(cols).gte('date',ini).lte('date',fin).order('date').order('created_at')` | `GET /rest/v1/activities?select=…&date=gte.2026-11-01&date=lte.2026-11-30&order=date.asc,created_at.asc` | `SELECT … FROM activities WHERE date BETWEEN … ORDER BY date, created_at` + **RLS** `user_id = auth.uid()` |
| Crear | `getUser()` → `.insert({user_id,date,title,category,note}).select(cols).single()` | `GET /auth/v1/user` y `POST /rest/v1/activities` (`Prefer: return=representation`) | `INSERT … RETURNING …` con `WITH CHECK (auth.uid() = user_id)` |
| Editar | `.update({title,category,note}).eq('id',id).select(cols).single()` | `PATCH /rest/v1/activities?id=eq.<id>` | `UPDATE … WHERE id = … AND user_id = auth.uid()`; el *trigger* actualiza `updated_at` |
| Eliminar | `.delete().eq('id',id)` | `DELETE /rest/v1/activities?id=eq.<id>` | `DELETE … WHERE id = … AND user_id = auth.uid()` |
| Último acceso | `.rpc('update_last_login')` | `POST /rest/v1/rpc/update_last_login` | función `SECURITY DEFINER`: `UPDATE profiles SET last_login_at = now() WHERE id = auth.uid()` |
| Guardar tema | `.from('profiles').update({theme_preference}).eq('id', uid)` | `PATCH /rest/v1/profiles?id=eq.<uid>` | `UPDATE profiles …` (RLS: solo la fila propia) |
| Leer tema | `.from('profiles').select('theme_preference').eq('id', uid).maybeSingle()` | `GET /rest/v1/profiles?select=theme_preference&id=eq.<uid>` | `SELECT …` (RLS) |

**Cabeceras de cada petición:** `apikey: <clave publicable>` y `Authorization: Bearer <access_token del usuario>` (sin sesión, el propio `apikey`; entonces RLS devuelve `[]`).

**Por qué importa el índice:** `activities_user_date_idx (user_id, date)` sirve la consulta mensual sin recorrer toda la tabla.

**Validación en dos niveles:** la app (`activityValidation.ts`: título 1–100, nota ≤ 500, nota vacía → `null`) y la base (`CHECK` de título, categoría y nota). Las categorías inválidas se rechazan en SQL aunque alguien sortee la app.

---

## 5. El store de actividades

`src/store/activitiesStore.ts` guarda `activitiesByDate: Record<'YYYY-MM-DD', Activity[]>`, `isLoading` y `error`.

### 5.1 `fetchMonth(year, month)`

```
fetchMonth ─ token = ++fetchToken            (invalida respuestas anteriores)
   ├ ¿el mes ya se cargó en esta sesión? → NO muestra spinner (revalidación en silencio)
   ├ activitiesService.fetchByMonth
   │    ├ OK  → reemplaza solo ese mes en el estado → guarda en caché (AsyncStorage)
   │    └ error
   │        ├ sesión expirada → leaveIfSessionExpired
   │        ├ sin red        → carga la caché del mes (si existe) y marca error "Sin conexión…"
   │        └ otro           → error "No se pudieron cargar las actividades."
   └ si token ≠ fetchToken al volver → descarta la respuesta (evita carreras)
```

### 5.2 Escrituras

`createActivity`, `updateActivity` y `deleteActivity` llaman al servicio y, **solo si tienen éxito**, actualizan el estado (mover de día si cambió la fecha), **reescriben la caché del mes afectado** y suben `fetchToken` (cancelan cargas en vuelo). Un fallo se propaga a la pantalla, que muestra el error sin alterar el estado. No hay actualización optimista: la UI refleja el servidor.

### 5.3 Quién dispara las cargas

`useMonthActivities(mes)` (usado por el calendario): carga al montar y al cambiar de mes, y **recarga al recuperar la conexión** tras un periodo sin red.

---

## 6. Caché local y modo sin conexión

| Clave en AsyncStorage | Contenido |
|---|---|
| `@kalendaria:cache:activities:YYYY-MM` | `{ year, month, activities[], cachedAt }` |
| `@kalendaria:lastSync` | Marca de tiempo de la última escritura en caché |
| `@kalendaria:theme` | Preferencia de tema (`zustand/persist`) |

- **Lectura sin red:** `fetchMonth` cae a la caché del mes si la petición falla por falta de red. Una caché corrupta o con forma inválida se ignora.
- **Escritura sin red:** bloqueada. `ActivityForm` usa `useNetworkStatus()`: sin conexión muestra "Sin conexión. Revisa tu internet." y deshabilita Guardar y Eliminar.
- **Invalidación:** iniciar sesión, registrarse y cerrar sesión borran **toda** la caché (`clearAllCache`, que solo toca las claves de la caché y conserva el tema). Cada escritura actualiza la caché de su mes.
- La caché **no está separada por usuario**: se vacía en cada cambio de sesión, que es lo que evita mezclar datos.

---

## 7. Tema y preferencias

1. La preferencia (`light` | `dark` | `system`) vive en `themeStore` y se persiste en AsyncStorage → arranque instantáneo, también sin red.
2. Al cambiarla en Ajustes se guarda también en `profiles.theme_preference` (`updateThemePreference`).
3. Al iniciar sesión, `useThemePreferenceSync` lee `profiles.theme_preference` y la aplica → el tema **sigue al usuario entre dispositivos**. Si la lectura falla, se conserva la local.

---

## 8. Mapa de errores

| Origen | Condición | Mensaje al usuario |
|---|---|---|
| Auth | `invalid_credentials` | Correo o contraseña incorrectos. |
| Auth | `user_already_exists` / `email_exists` / identidades vacías | Ese correo ya tiene una cuenta. |
| Auth | `weak_password` / validación local | La contraseña debe tener al menos 8 caracteres, una letra y un número. |
| Auth | `over_request_rate_limit` | Has pedido demasiados intentos. Espera un momento… |
| Auth | registro sin sesión (Confirm email activo) | No se pudo completar el registro en este momento. Inténtalo más tarde. |
| Red | "network"/"fetch" en el error, estado 0 | Sin conexión. Revisa tu internet. |
| Sesión | JWT caducado, 401, `refresh_token_*` | Tu sesión expiró. Vuelve a entrar. (y cierra sesión) |
| Datos | cualquier otro error al cargar / guardar / eliminar | No se pudieron cargar las actividades. / No se pudo guardar… / No se pudo eliminar… |
| Validación | título vacío / largo, nota larga | Escribe un título. / El título puede tener hasta 100 caracteres. / … |

`authErrors.ts` y `activitiesService.ts` traducen los errores técnicos; el detalle técnico solo se escribe en consola en desarrollo (`__DEV__`). Un `ErrorBoundary` global (`AppErrorBoundary`) captura fallos de renderizado y ofrece "Reintentar".

---

## 9. Seguridad del flujo (resumen)

- Cada petición lleva el JWT del usuario; **RLS decide** qué filas existen para él. El cliente no puede saltarse esto ni con la clave publicable.
- Tokens en el llavero del sistema, nunca en AsyncStorage.
- Sin `service_role` en el cliente.
- Los mensajes de error no revelan si falló el correo o la contraseña.
- Validación duplicada (app + `CHECK` en SQL).
- Verificado contra el proyecto real (solo lectura): sin sesión, `activities` y `profiles` devuelven `[]`; `update_last_login` responde `permission denied` a `anon`.

---

## 10. Cómo probar el backend

| Qué | Cómo |
|---|---|
| Lógica de servicios, store, caché, validaciones | `npm test` (48 pruebas; usan un cliente Supabase falso y no tocan la base real) |
| Seguridad RLS (solo lectura) | Consultas de `pg_tables`/`pg_policies` y llamadas anónimas con `curl` (ver `09-Supabase.md` §8) |
| Variables incrustadas en el APK | `npm run release:verify` |
| Flujo completo | Probar el APK en un teléfono: registro, login, crear/editar/eliminar, modo avión, tema, cerrar sesión |

---

## 11. Limitaciones conocidas

- Sin sincronización offline de escrituras (solo lectura en caché).
- Sin *Realtime*: un cambio hecho en otro dispositivo se ve al volver a cargar el mes.
- Cada mes se consulta de forma independiente; los días de relleno de meses vecinos en la cuadrícula solo muestran puntos si ese mes ya se cargó.
- Falta la función de **eliminar cuenta** (requisito de Google Play).

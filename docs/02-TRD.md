# Technical Requirements Document (TRD)
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.0
**Fecha:** Octubre 2026
**Estado:** Aprobado
**Documento base:** `01-PRD.md`

---

## 1. Resumen Técnico

Kalendaria es una aplicación móvil multiplataforma (Android + iOS) construida con **Expo** y **React Native**, con **Expo Router** para navegación basada en archivos, **Zustand** para estado global, **Supabase** como backend (autenticación + PostgreSQL + API REST con RLS), y **AsyncStorage** para persistencia local. El objetivo técnico es construir una app ligera, mantenible y sin dependencias innecesarias.

---

## 2. Stack Tecnológico

### 2.1. Entorno de desarrollo

| Herramienta | Versión | Uso |
|---|---|---|
| **Node.js** | 20.x LTS (vía nvm) | Runtime para npm, Metro y Expo CLI |
| **npm** | Incluido con Node | Gestión de dependencias |
| **Expo Go** | Compatible con SDK 54 | Ejecución en dispositivo físico durante desarrollo |
| **EAS CLI** | Global (opcional) | Build de APK/AAB en producción (futuro) |
| **TypeScript** | ~5.6.x | Tipado estático en todo el código fuente |

> **Nota:** No usar `expo-cli` global (obsoleto). Siempre `npx expo` dentro del proyecto.

### 2.2. Framework y plataforma

| Paquete | Versión | Rol |
|---|---|---|
| `expo` | SDK 54 (última estable) | Plataforma, bundler, plugins nativos |
| `react` | 19.x | Motor de UI |
| `react-native` | 0.81.x | Componentes nativos |

> **Nota:** Expo SDK 54 es la versión estable más reciente. La referencia a "SDK 57" en documentación previa era errónea.

### 2.3. Navegación

| Paquete | Rol |
|---|---|
| `expo-router` | Navegación basada en archivos (file-based routing) |
| `react-native-screens` | Optimización de pantallas nativas (dependencia de expo-router) |
| `react-native-safe-area-context` | Manejo de áreas seguras (notch, barras del sistema) |
| `react-native-gesture-handler` | Gestos nativos (swipe entre meses) |
| `react-native-reanimated` | Animaciones fluidas (transiciones) |

**Estructura de rutas (Expo Router):**

app/
├── _layout.tsx # Layout raíz (providers globales)
├── index.tsx # Punto de entrada (redirect según auth)
├── (auth)/ # Grupo de rutas de autenticación
│ ├── _layout.tsx
│ ├── login.tsx
│ ├── register.tsx
│ └── verify.tsx # Verificación por código
├── (app)/ # Grupo de rutas protegidas
│ ├── _layout.tsx # Guard de autenticación
│ ├── calendar.tsx # Calendario mensual (home)
│ ├── day/[date].tsx # Detalle del día (ej: /day/2026-10-14)
│ ├── activity/new.tsx # Crear actividad (recibe ?date=YYYY-MM-DD)
│ ├── activity/[id].tsx # Editar actividad
│ └── settings.tsx # Ajustes (tema, logout)


### 2.4. Estado y persistencia

| Paquete | Rol |
|---|---|
| `zustand` | Stores ligeros (`useAuthStore`, `useActivitiesStore`, `useThemeStore`) |
| `@react-native-async-storage/async-storage` | Persistencia clave-valor local (caché de lectura + preferencias) |

**Decisión:** Zustand en lugar de Redux porque el estado es simple y no requiere middleware complejo. AsyncStorage es suficiente para el volumen de datos (actividades del mes).

### 2.5. Backend y autenticación

| Paquete | Rol |
|---|---|
| `@supabase/supabase-js` | Cliente oficial de Supabase |
| `react-native-url-polyfill` | Polyfill necesario para Supabase en RN |
| `expo-secure-store` | Almacenamiento seguro del token de sesión |

**Supabase** provee:
- **Auth:** registro, login, verificación por OTP (código de 6 dígitos por email).
- **PostgreSQL:** base de datos relacional con RLS.
- **API REST autogenerada:** sobre las tablas definidas.
- **Email service integrado:** envío de códigos de verificación.

### 2.6. Utilidades

| Paquete | Rol |
|---|---|
| `date-fns` | Manipulación de fechas (formato, comparación, locale `es`) |
| `@expo/vector-icons` | Iconografía (Ionicons) |
| `expo-status-bar` | Control de la barra de estado del sistema |

### 2.7. Funcionalidades nativas (Expo modules)

| Paquete | Rol |
|---|---|
| `expo-splash-screen` | Splash nativo; se oculta al terminar la hidratación de sesión |
| `expo-haptics` | Feedback táctil sutil (opcional) |

> **Importante:** NO se incluye `expo-notifications` ni `expo-keep-awake` porque la app no usa notificaciones ni requiere mantener la pantalla encendida.

### 2.8. Plugins de Expo (`app.json`)

json
"plugins": [
  "expo-router",
  "expo-secure-store",
  ["expo-splash-screen", {
    "backgroundColor": "#ffffff",
    "image": "./assets/images/splash.png",
    "resizeMode": "contain",
    "imageWidth": 200
  }]
]

---

## 3. Arquitectura de la Aplicación

### 3.1. Estructura de carpetas

Kalendaria/
├── app/                          # Rutas (Expo Router)
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   └── (app)/
├── src/
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Botones, inputs, modales base
│   │   ├── calendar/             # MonthGrid, DayCell, ActivityDot
│   │   └── activity/             # ActivityCard, CategoryPicker, ActivityForm
│   ├── constants/
│   │   ├── categories.ts         # Definición de categorías y colores
│   │   └── config.ts             # Constantes globales
│   ├── hooks/                    # Hooks personalizados
│   │   ├── useAuth.ts
│   │   ├── useActivities.ts
│   │   └── useTheme.ts
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase configurado
│   │   ├── cache.ts              # Helpers de AsyncStorage
│   │   └── dates.ts              # Helpers de date-fns
│   ├── services/                 # Capa de servicios (API)
│   │   ├── authService.ts
│   │   └── activitiesService.ts
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── activitiesStore.ts
│   │   └── themeStore.ts
│   ├── theme/                    # Sistema de temas
│   │   ├── colors.ts             # Paleta (definida en brief UI/UX)
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── ThemeProvider.tsx
│   └── types/
│       ├── auth.ts
│       ├── activity.ts
│       └── database.ts           # Tipos generados por Supabase
├── assets/
│   └── images/
├── app.json
├── package.json
├── tsconfig.json
└── .env.local                    # Variables de entorno (NO commitear)

### 3.2. Patrón de arquitectura
Arquitectura en capas:
1. UI (componentes + pantallas) → solo presentación, sin lógica de negocio.
2. Hooks → conectan UI con stores y servicios.
3. Stores (Zustand) → estado global de la app (auth, activities, theme).
4. Servicios → capa de acceso a Supabase y caché local.
5. Supabase / AsyncStorage → persistencia.

Flujo típico de una acción:

Usuario toca "Guardar" en ActivityForm
  → handleSubmit (componente)
    → useActivities().createActivity(data) (hook)
      → activitiesStore.createActivity(data) (store)
        → activitiesService.create(data) (servicio)
          → supabase.from('activities').insert(data) (Supabase)
        ← resultado
      ← actualiza estado global
    ← UI se re-renderiza automáticamente
    
### 3.3. Configuración de TypeScript

strict: true activado.
Alias de paths configurados en tsconfig.json:

"paths": {
  "@/*": ["./src/*"],
  "@components/*": ["./src/components/*"],
  "@hooks/*": ["./src/hooks/*"],
  "@store/*": ["./src/store/*"],
  "@services/*": ["./src/services/*"],
  "@theme/*": ["./src/theme/*"]
}

### 3.4. Variables de entorno
Archivo .env.local (no commiteado):

EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

Se accede vía process.env.EXPO_PUBLIC_SUPABASE_URL desde el código.

---

## 4. Autenticación — Diseño Técnico

### 4.1. Flujo de registro
1. Usuario completa formulario (email + password + confirmación).
2. Cliente valida formato localmente (regex email, password ≥ 8 caracteres con letra y número).
3. Se llama supabase.auth.signUp({ email, password }).
4. Supabase crea el usuario en estado "unverified" y envía OTP por email.
5. App navega a /(auth)/verify?email=xxx.
6. Usuario introduce el código de 6 dígitos.
7. Se llama supabase.auth.verifyOtp({ email, token, type: 'signup' }).
8. Si es correcto, se crea la sesión y se redirige a /(app)/calendar.

### 4.2. Flujo de login con "confianza por tiempo"
Regla de negocio: si el último login fue hace < 30 días, no se pide OTP.
1. Usuario ingresa email + password.
2. Se consulta last_login_at del usuario (guardado en tabla profiles o auth.users.last_sign_in_at).
3. Si now - last_login_at < 30 días:
- Se llama supabase.auth.signInWithPassword({ email, password }).
- Se redirige directo a /(app)/calendar.
4. Si now - last_login_at >= 30 días:
- Se llama supabase.auth.signInWithPassword (validación de credenciales).
- Se llama supabase.auth.signInWithOtp({ email }) para enviar código.
- Se navega a /(auth)/verify?email=xxx&mode=login.
- Al verificar, se redirige a la app.
5. Se actualiza last_login_at tras login exitoso.

### 4.3. Persistencia de sesión
- Supabase client configurado con storage: ExpoSecureStoreAdapter.
- Al abrir la app, supabase.auth.getSession() restaura la sesión si existe.
- (app)/_layout.tsx verifica sesión activa; si no hay, redirige a /login.

### 4.4. Configuración Supabase
- Email templates: personalizar los correos de verificación con branding "Kalendaria".
- OTP expiry: 600 segundos (10 minutos).
- Password requirements: mínimo 8 caracteres (configurable en Supabase).
- Rate limiting: dejar los valores por defecto de Supabase. 

---

## 5. Backend — Supabase

### 5.1. Tabla activities

Columna	| Tipo | Restricciones
id | uuid | PRIMARY KEY, default gen_random_uuid()
user_id | uuid | NOT NULL, FK → auth.users.id, ON DELETE CASCADE
date | date | NOT NULL (formato YYYY-MM-DD)
title | text | NOT NULL, max 100 chars
category | text | NOT NULL, CHECK en ['reunion','pendiente','personal','trabajo','otro']
note | text | NULL, max 500 chars
created_at | timestamptz | NOT NULL, default now()
updated_at | timestamptz | NOT NULL, default now()

Índices:

- CREATE INDEX idx_activities_user_date ON activities(user_id, date);

Políticas RLS:

-- SELECT
CREATE POLICY "Users read own activities"
ON activities FOR SELECT
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users insert own activities"
ON activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users update own activities"
ON activities FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users delete own activities"
ON activities FOR DELETE
USING (auth.uid() = user_id);

### 5.2. Tabla profiles (extiende auth.users)

Columna | Tipo | Restricciones
id | uuid | PRIMARY KEY, FK → auth.users.id, ON DELETE CASCADE
email | text | NOT NULL
last_login_at | timestamptz | NULL
theme_preference | text | NULL, CHECK en ['light','dark','system'], default 'system'
created_at | timestamptz | NOT NULL, default now()

Trigger: crear fila en profiles automáticamente al crear un usuario.

CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

Nota: theme_preference se guarda también localmente en AsyncStorage para acceso offline instantáneo.
La DB es la fuente de verdad para restaurar la preferencia al cambiar de dispositivo.

### 5.3. Consultas principales

// Obtener actividades de un mes
const start = '2026-10-01';
const end = '2026-10-31';
const { data } = await supabase
  .from('activities')
  .select('*')
  .gte('date', start)
  .lte('date', end)
  .order('date', { ascending: true });

// Crear actividad
const { data } = await supabase
  .from('activities')
  .insert({ user_id, date, title, category, note })
  .select()
  .single();

// Actualizar
await supabase.from('activities').update({...}).eq('id', id);

// Eliminar
await supabase.from('activities').delete().eq('id', id);

---

## 6. Gestión de Estado (Zustand)

### 6.1. authStore

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  // actions
  initialize: () => Promise<void>;
  signIn: (email, password) => Promise<{ requiresOtp: boolean }>;
  signUp: (email, password) => Promise<void>;
  verifyOtp: (email, token, mode) => Promise<void>;
  signOut: () => Promise<void>;
}

### 6.2. activitiesStore

interface ActivitiesState {
  activitiesByDate: Record<string, Activity[]>;  // indexado por YYYY-MM-DD
  isLoading: boolean;
  error: string | null;
  // actions
  fetchMonth: (year, month) => Promise<void>;
  createActivity: (data) => Promise<void>;
  updateActivity: (id, data) => Promise<void>;
  deleteActivity: (id) => Promise<void>;
  getActivitiesForDate: (date: string) => Activity[];
}

### 6.3. themeStore

interface ThemeState {
  preference: 'light' | 'dark' | 'system';
  setPreference: (pref) => void;
}

Persistido con zustand/middleware + AsyncStorage.

---

## 7. Caché Local y Modo Offline

### 7.1. Estrategia
- Lectura: al cargar un mes, se guarda el resultado en AsyncStorage con clave cache:activities:YYYY-MM.
- Fallback: si fetchMonth falla por falta de red, se lee de la caché.
- Escritura: requiere conexión. Si no hay red, se muestra un Toast "Sin conexión. Revisa tu internet."
- Invalidación: al hacer login nuevo o al crear/editar/eliminar una actividad, se invalida la caché del mes afectado.

### 7.2. Detección de conexión
Usar @react-native-community/netinfo:

const isOnline = useNetInfo().isConnected;

Si !isOnline, los botones de guardar/eliminar se deshabilitan con un mensaje.

---

## 8. Sistema de Temas
- Paleta: se define en src/theme/colors.ts (a detallar en el brief UI/UX, documento #4).
- Estructura:

export const lightTheme = { background, surface, text, textSecondary, border, primary, ... };
export const darkTheme = { ... };

- Acceso: hook useTheme() devuelve el objeto de tema activo.
- Detección del sistema: useColorScheme() de React Native, cuando la preferencia es 'system'.
- Persistencia: tema actual en AsyncStorage + sincronizado con profiles.theme_preference.

---

## 9. Manejo de Fechas
- Librería: date-fns (tree-shakeable, funcional, sin mutaciones).
- Locale: import { es } from 'date-fns/locale';
- Formato estándar interno: YYYY-MM-DD (string) para fechas de actividad (columna date).
- Formato de display: "Martes, 14 de octubre de 2026" → format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).
- Semana comienza en: lunes (estándar en España/Latinoamérica).

---

## 10. Seguridad
- Auth: gestionada 100% por Supabase Auth.
- RLS: obligatorio en todas las tablas (activities, profiles).
- Tokens: almacenados en expo-secure-store.
- HTTPS: todas las comunicaciones con Supabase usan TLS.
- Variables sensibles: EXPO_PUBLIC_* solo para URL y anon key (públicas por diseño en Supabase).
- No hardcodear secretos (ningún service_role key en el cliente).

---

## 11. Rendimiento
- FlatList para listas de actividades (virtualización).
- React.memo en DayCell del calendario (36 celdas por vista).
- useMemo para agrupar actividades por fecha.
- Lazy loading: pantallas cargadas vía Expo Router ya aplican code-splitting automático.
- Imágenes: formato WebP, tamaño optimizado.
- Caché de consultas: evitar refetch si los datos del mes ya están en el store.

---

## 12. Manejo de Errores
- Errores de red: mensajes claros al usuario ("Sin conexión. Revisa tu internet.").
- Errores de auth: mensajes genéricos sin revelar detalles ("Correo o contraseña incorrectos").
- Errores de Supabase: capturar y loggear; mostrar Toast genérico al usuario.
- Error Boundary: componente de React que captura errores de render y muestra pantalla de fallback.
- Logs en desarrollo: console.error; en producción silenciar.

---

## 13. Testing
- Unit tests: utilidades (dates.ts, cache.ts) con Jest.
- Component tests: componentes de UI con @testing-library/react-native.
- Integration tests: flujos de auth y actividades (mockear Supabase).
- E2E: opcional para MVP, se puede añadir Maestro después.

---

## 14. Build y Deployment

### 14.1. Desarrollo
- npx expo start → QR para Expo Go.
- Ejecución en dispositivo físico o emulador.

### 14.2. Build de producción
- EAS Build con perfiles en eas.json:
- development (dev client)
- preview (APK interno)
- production (AAB para Play Store / IPA para App Store)

### 14.3. Distribución
- Android: Google Play Console (AAB).
- iOS: App Store Connect (IPA) — requiere Apple Developer Account.

---

## 15. Convenciones de Código
- Nombrado: camelCase para variables/funciones, PascalCase para componentes y tipos.
- Archivos: componentes en PascalCase.tsx, utilidades en camelCase.ts.
- Imports: alias @/* en lugar de rutas relativas largas.
- Estilos: StyleSheet.create en el mismo archivo del componente; temas vía hook.
- Componentes: funcionales con hooks, nunca clases.
- TypeScript: strict: true; evitar any; usar tipos generados por Supabase.
- ESLint + Prettier: configuración con eslint-config-expo.

---

## 16. Riesgos Técnicos y Mitigaciones

Riesgo   |   Impacto   |   Mitigación
Supabase Auth OTP puede caer en spam   |   Medio   |   Personalizar templates de email + dominio verificado.
Rate limiting de Supabase en envíos de OTP   |   Medio   |   Mensajes claros al usuario; permitir reintentar tras espera.
Conflictos de caché local vs servidor   |   Bajo   |   Invalidar caché tras cada escritura y al iniciar sesión.
Expo Router en fase de cambios   |   Bajo   |   Seguir documentación oficial; versión fija en package.json.
Dependencia total de Supabase   |   Medio   |   Backend abstraído en services/; migrar sería factible.

---

## 17. Roadmap Técnico Post-MVP (Backlog)
- Sync offline completo (cola de operaciones pendientes).
- Realtime con Supabase (suscripciones para cambios entre dispositivos).
- Push notifications (si el cliente cambia de opinión).
- Personalización de categorías por usuario.
- Exportación a PDF/CSV.
- Widgets nativos.
- Tests E2E automatizados.

---

## 18. Dependencias Completas (package.json objetivo)
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "expo-haptics": "~14.0.0",
    "react": "19.0.0",
    "react-native": "0.81.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.1.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-url-polyfill": "^2.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@react-native-async-storage/async-storage": "2.1.0",
    "@react-native-community/netinfo": "11.4.1",
    "zustand": "^5.0.0",
    "date-fns": "^4.1.0",
    "@expo/vector-icons": "^14.0.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "@types/react": "~19.0.0",
    "eslint": "^8.57.0",
    "eslint-config-expo": "~8.0.0",
    "prettier": "^3.3.0"
  }
}

Las versiones son orientativas; al inicializar el proyecto se debe ejecutar npx expo install para cada paquete y dejar que Expo resuelva las versiones compatibles con el SDK.



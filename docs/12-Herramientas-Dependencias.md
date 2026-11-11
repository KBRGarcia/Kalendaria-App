# Herramientas, librerías y dependencias

**Versión:** 1.0 · **Fecha:** noviembre 2026 · **Fuente de verdad de versiones:** `package.json` y `package-lock.json`

Este documento explica **qué es cada pieza y qué papel cumple** en Kalendaria. Para el detalle de decisiones de arquitectura, ver `02-TRD.md`.

> **Regla de oro de versiones:** las dependencias de Expo se instalan y actualizan con `npx expo install` (elige la versión compatible con el SDK), nunca con `npm install paquete@latest`. `react` está fijado a `19.3.0` porque así lo pide el SDK.

---

## 1. Panorama

```
Lenguaje y calidad      TypeScript · node:test · expo-doctor
Plataforma y build      Expo SDK 58 · React Native 0.88 · Metro · Hermes · EAS
Interfaz                React 19 · Expo Router · Ionicons · Inter · (tema propio)
Estado y datos          Zustand · AsyncStorage · SecureStore · NetInfo · Supabase JS
Utilidades              date-fns · Haptics
Landing                 HTML + CSS + JS sin framework · Vercel
Operación               Git/GitHub · GitHub Actions · pg_dump · scripts propios
```

---

## 2. Herramientas de desarrollo (no van en la app)

| Herramienta | Versión | Papel |
|---|---|---|
| **Node.js** | 22.x (mín. 22.13) | Ejecuta npm, Metro, las pruebas y la CLI de Expo. **No usar 20 ni 25** para compilar. Se gestiona con `nvm` |
| **npm** | el de Node 22 | Instala dependencias y ejecuta los scripts de `package.json` |
| **TypeScript** | ~6.0.3 | Tipado estático (`strict: true`). `npm run typecheck` revisa la app y las pruebas |
| **Expo CLI** (`npx expo`) | con el SDK | Servidor de desarrollo, `export`, `install --fix`, `prebuild` |
| **EAS CLI** (`npx eas-cli`) | 27.x | Compila en la nube, gestiona variables y credenciales |
| **expo-doctor** | 1.x | Diagnóstico de compatibilidad del proyecto (20 comprobaciones). Se ejecuta con Node 25 en este entorno; en Node 22 puede fallar al descargarse |
| **Metro** | incluido | Empaquetador de JavaScript de React Native |
| **Hermes** | incluido | Motor de JavaScript de la app; el bundle de producción se compila a *bytecode* |
| **`node:test`** | incluido en Node | Ejecutor de pruebas nativo. Con Node 22 ejecuta TypeScript directamente (*type stripping*); `tests/loader.mjs` resuelve los alias y sustituye Supabase y AsyncStorage por *mocks* |
| **`@types/node`** | ^22 | Tipos de Node para las pruebas |
| **Git / GitHub** | — | Control de versiones y alojamiento del código y del APK (Releases). Se usa **SSH** para `git push` |
| **GitHub Actions** | — | Tarea programada `keepalive.yml` (evita la pausa del proyecto de Supabase) |
| **`pg_dump` / `psql`** | PostgreSQL client | Respaldos de la base (`npm run db:backup`) |
| **`curl`, `unzip`, `strings`, `sha256sum`** | del sistema | Usados por `scripts/verify-apk.sh` |
| **Cursor rules** (`.cursor/rules/`) | — | Reglas para asistentes de IA (estilo, estructura, Supabase, flujo de trabajo) |

### Scripts de `package.json`

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor Metro (requiere *development build*; Expo Go no vale) |
| `npm run android` / `ios` | Compila y ejecuta en un dispositivo/emulador conectado |
| `npm run typecheck` | `tsc` sobre `src/` y sobre `tests/` |
| `npm test` | 48 pruebas con `node --test` |
| `npm run landing` | Servidor local de la landing en `http://localhost:4173` |
| `npm run doctor` | `expo-doctor` |
| `npm run build:preview` | APK de prueba (EAS, entorno `preview`) |
| `npm run build:apk` | APK de producción (EAS, entorno `production`) |
| `npm run build:aab` | AAB para Google Play |
| `npm run release:verify` | Verifica un APK (referencia de Supabase incrustada, tamaño, SHA-256) |
| `npm run db:backup` | Respaldo de la base con `pg_dump` |

---

## 3. Dependencias de la app (`dependencies`)

### 3.1 Núcleo

| Paquete | Versión | Papel |
|---|---|---|
| `expo` | ~58.0.24 | El SDK: runtime, módulos nativos y compatibilidad. Punto de entrada |
| `react` | 19.3.0 | Biblioteca de UI (componentes y hooks). Versión fijada por el SDK |
| `react-native` | 0.88.1 | Renderiza los componentes como vistas **nativas** de Android/iOS |
| `expo-constants` | ~58.0.13 | Lee la configuración de `app.json` en ejecución (la versión que muestra Ajustes) |
| `expo-linking` | ~58.0.17 | Soporte de enlaces profundos; requerido por Expo Router |
| `expo-font` | ~58.0.10 | Carga las fuentes personalizadas (Inter) |

### 3.2 Navegación

| Paquete | Versión | Papel |
|---|---|---|
| `expo-router` | ~58.0.31 | Rutas basadas en archivos (`src/app/`): login, registro, calendario, hoja de actividad, ajustes. Aporta el *guard* de sesión mediante layouts y `<Redirect>` |
| `react-native-screens` | ~4.30.1 | Pantallas nativas optimizadas. Dependencia de Expo Router (no se importa directamente) |
| `react-native-safe-area-context` | ~5.11.1 | Márgenes seguros (notch, barra de gestos). Se usa en las pantallas |
| `react-native-gesture-handler` | ~3.3.0 | Sistema de gestos nativo. Dependencia de la navegación (no se importa directamente) |
| `react-native-reanimated` | 4.7.1 | Motor de animaciones. Instalado como requisito del ecosistema de navegación; las animaciones propias usan la API `Animated` de React Native |
| `react-native-worklets` | 0.13.0 | Requisito obligatorio de Reanimated en SDK 58 |

### 3.3 Backend, sesión y red

| Paquete | Versión | Papel |
|---|---|---|
| `@supabase/supabase-js` | ^2.118.0 (instalada 2.119.x) | Cliente oficial de Supabase: Auth y consultas a la API REST. Ver `09-Supabase.md` |
| `react-native-url-polyfill` | ^4.0.0 | Aporta la API `URL` que supabase-js necesita y React Native no trae (`import 'react-native-url-polyfill/auto'` en `src/lib/supabase.ts`) |
| `expo-secure-store` | ~58.0.3 | Guarda los tokens de sesión en el Keystore/Keychain del sistema |
| `@react-native-async-storage/async-storage` | 2.2.0 | Almacén clave-valor local: preferencia de tema y **caché de actividades** (modo lectura sin conexión) |
| `@react-native-community/netinfo` | 12.0.1 | Detecta si hay conexión (hook `useNetworkStatus`); bloquea la escritura sin red |

### 3.4 Estado

| Paquete | Versión | Papel |
|---|---|---|
| `zustand` | ^5.0.16 (instalada 5.1.x) | Estados globales ligeros: `authStore`, `activitiesStore`, `themeStore` (este último con `persist` sobre AsyncStorage). Elegido en lugar de Redux por simplicidad |

### 3.5 Interfaz y recursos

| Paquete | Versión | Papel |
|---|---|---|
| `@react-native-vector-icons/ionicons` | ^14 | Íconos (Ionicons). Es el paquete recomendado por Expo desde SDK 56; **no** se usa `@expo/vector-icons` |
| `@expo-google-fonts/inter` | ^0.4.2 | Fuente Inter (400, 500, 600, 700) empaquetada con la app |
| `expo-splash-screen` | ~58.0.13 | Pantalla de arranque nativa; se mantiene hasta que hay fuentes, tema y sesión |
| `expo-status-bar` | ~58.0.5 | Estilo de la barra de estado según el tema |
| `expo-haptics` | ~58.0.8 | Vibración ligera al guardar, eliminar y cambiar de mes |

### 3.6 Utilidades

| Paquete | Versión | Papel |
|---|---|---|
| `date-fns` | ^4.4.0 | Fechas: construir la cuadrícula de 42 celdas (semana desde lunes), rangos de mes, formato en español (`es`). Sin mutaciones |

### 3.7 `devDependencies` y `overrides`

| Paquete | Papel |
|---|---|
| `typescript` ~6.0.3 | Compilador de tipos |
| `@types/react` ~19.3 | Tipos de React |
| `@types/node` ^22 | Tipos de Node (solo pruebas) |
| `overrides.react-dom: 19.3.0` | Evita un conflicto de versiones: Expo Router declara `react-dom` como *peer*, aunque la app no es web |

---

## 4. Lo que **no** se usa (a propósito)

| Pieza | Por qué no |
|---|---|
| `expo-notifications` | Decisión de producto: sin notificaciones ni alarmas |
| `expo-keep-awake` | La app no necesita mantener la pantalla encendida |
| `@expo/vector-icons` | Desaconsejado por Expo desde SDK 56; se usa `@react-native-vector-icons/ionicons` |
| Redux | El estado es sencillo; Zustand basta |
| Jest / Testing Library | Las pruebas son de lógica y usan `node:test` sin dependencias nuevas. No hay pruebas de componentes ni E2E todavía |
| ESLint / Prettier | Previstos en el TRD pero **sin instalar** (deuda técnica) |
| `expo-updates` (EAS Update) | Cada cambio exige un APK nuevo |
| `react-native-keyboard-controller` | El manejo del teclado se resuelve con `KeyboardAvoidingView`; es la alternativa si hiciera falta más control |
| `expo-sqlite` | El *quickstart* de Supabase lo usa para la sesión; aquí se usa SecureStore (decisión de Fase 0) |
| Servidor propio / Express / funciones | No hay servidor: la app habla directo con Supabase |

---

## 5. Archivos de configuración

| Archivo | Función |
|---|---|
| `app.json` | Configuración de Expo: nombre, paquete, íconos, plugins, experimentos |
| `eas.json` | Perfiles de compilación de EAS |
| `tsconfig.json` | TypeScript estricto y **alias de rutas** (`@components/*`, `@services/*`, `@store/*`, `@lib/*`, `@theme/*`, `@hooks/*`, `@constants/*`, `@/*`) |
| `tests/tsconfig.json` | TypeScript de las pruebas (añade `@types/node` y permite importar `.ts`) |
| `.env.local` | Variables locales (`EXPO_PUBLIC_SUPABASE_*`). **No se versiona** |
| `.gitignore` | Excluye `node_modules`, `.env*.local`, `android/`, `ios/`, `*.jks`, `backups/` |
| `landing/vercel.json` | Encabezados de seguridad y caché de la landing |
| `.github/workflows/keepalive.yml` | Tarea programada contra la pausa de Supabase |
| `supabase/migrations/*.sql` | Esquema de la base (001–005) |
| `supabase/templates/*.html` | Plantillas de correo guardadas para cuando haya plan de pago |
| `docs/` | Documentación del proyecto |

---

## 6. Capas y carpetas de `src/` (qué librería vive dónde)

| Carpeta | Contenido | Librerías que toca |
|---|---|---|
| `src/app/` | Rutas (Expo Router) | `expo-router` |
| `src/components/` | UI: `ui/`, `auth/`, `calendar/`, `activity/`, `settings/` | `react-native`, `@react-native-vector-icons/ionicons`, `expo-haptics`, `safe-area-context` |
| `src/hooks/` | `useAuth`, `useMonthActivities`, `useNetworkStatus`, `useThemePreference` | `zustand`, `netinfo` |
| `src/store/` | Estados globales | `zustand`, `async-storage` |
| `src/services/` | Acceso a Supabase, validaciones, traducción de errores | `@supabase/supabase-js` |
| `src/lib/` | `supabase.ts`, `cache.ts`, `dates.ts`, `sessionNotice.ts` | `supabase-js`, `secure-store`, `async-storage`, `date-fns` |
| `src/theme/` | Colores, tipografía, espaciado, sombras y `ThemeProvider` | `react-native` |
| `src/constants/` | Mensajes, categorías | — |
| `src/types/` | Tipos de dominio y `database.ts` (generado por Supabase) | — |

---

## 7. La landing

Sin framework ni dependencias de npm: **HTML + CSS + JavaScript** propios. Única dependencia externa: la fuente **Inter** desde Google Fonts. Servidor local propio (`landing/dev-server.mjs`, solo módulos de Node). Se publica en **Vercel** (ver `10-Vercel.md`).

---

## 8. Cómo actualizar dependencias sin romper nada

1. `nvm use 22`
2. `npx expo install --check` → lista lo desalineado.
3. `npx expo install --fix` → aplica las versiones compatibles con el SDK.
4. `npm run typecheck && npm test` y `npx expo-doctor`.
5. `npx expo export --platform android` (el bundle debe generarse sin errores).
6. Para librerías **no** gestionadas por Expo (`zustand`, `date-fns`, `@supabase/supabase-js`): `npm update <paquete>` dentro del rango semver y repetir 4–5.
7. **No** subir de versión mayor `react`, `react-native` ni `async-storage` por separado: se cambian al migrar de SDK.
8. Tras cualquier cambio, compilar un APK de prueba y probarlo en un teléfono real.

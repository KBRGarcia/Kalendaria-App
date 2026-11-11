# Expo en Kalendaria

**Versión:** 1.0 · **Fecha:** noviembre 2026 · **Documentos relacionados:** `02-TRD.md` (stack), `08-Guia-Produccion.md` (builds y release), `12-Herramientas-Dependencias.md`

---

## 1. Qué es Expo

**React Native** permite escribir apps móviles nativas con JavaScript/TypeScript y React. Por sí solo exige configurar herramientas nativas de Android (Gradle, SDK, NDK) y de iOS (Xcode, CocoaPods). **Expo** es un conjunto de herramientas y servicios construido **encima** de React Native que elimina casi toda esa fricción. Se compone de cuatro partes que conviene distinguir:

| Pieza | Qué es | Qué hace en Kalendaria |
|---|---|---|
| **Expo SDK** (`expo`, `expo-*`) | Colección versionada de módulos nativos listos para usar y de ajustes de compatibilidad | Aporta almacén seguro, hápticos, fuentes, barra de estado, *splash screen*, etc. Hoy: **SDK 58** (React Native 0.88, React 19.3) |
| **Expo Router** (`expo-router`) | Enrutamiento basado en archivos sobre React Navigation | Cada archivo de `src/app/` es una pantalla; las carpetas `(auth)` y `(app)` agrupan rutas sin aparecer en la URL |
| **Expo CLI / Metro** (`npx expo …`) | Servidor de desarrollo y empaquetador de JavaScript | `npx expo start` levanta Metro; `expo export` genera el bundle de producción |
| **EAS** (*Expo Application Services*) | Servicios en la nube de Expo | **EAS Build** compila el APK/AAB sin que instales Android Studio; guarda el *keystore*; guarda variables de entorno |

> **En una frase:** Expo es lo que permite que un solo código TypeScript se convierta en un APK instalable, compilado en la nube, sin tocar código nativo.

La cuenta de Expo del proyecto es **`@kbrgarcia/kalendaria`** (`https://expo.dev/accounts/kbrgarcia/projects/kalendaria`), enlazada con `eas init` (`extra.eas.projectId` y `owner` en `app.json`).

---

## 2. Flujo de trabajo: de código a teléfono

```
 TypeScript (src/)  ──►  Metro (empaqueta JS)  ──►  Hermes (bytecode)  ──┐
                                                                          ├──► APK
 app.json + plugins ──►  "prebuild" genera android/  ──►  Gradle  ───────┘
                          (en la nube, dentro de EAS Build)
```

1. **Desarrollo.** Metro sirve el JavaScript y recarga en caliente. El proyecto usa **SDK 58 con *development build***: la app **Expo Go de la tienda no sirve** (sigue en una versión anterior del SDK durante la transición).
2. **Compilación.** `eas build` sube el proyecto, ejecuta *prebuild* (genera la carpeta nativa `android/` a partir de `app.json` y los plugins), compila con Gradle, firma con el *keystore* y entrega un enlace de descarga.
3. **Distribución.** El APK se publica en GitHub Releases y se enlaza desde la landing (`07-Distribucion.md`).

### Continuous Native Generation (CNG)

`android/` **no se versiona** (está en `.gitignore`): se regenera desde `app.json`. La configuración nativa se cambia con **plugins** o campos de `app.json`, no editando `android/` a mano. Por eso el paquete `com.kalendaria.app`, los íconos y el *splash* viven en `app.json`.

---

## 3. `app.json`: la configuración de la app

| Campo | Valor / función |
|---|---|
| `name`, `slug`, `scheme` | `Kalendaria` · `kalendaria` · `kalendaria` |
| `version` | `1.0.0`: versión visible para el usuario (Ajustes → "Versión") |
| `orientation` | `portrait` |
| `userInterfaceStyle` | `automatic` (respeta el tema del sistema; la app además tiene su propio selector) |
| `icon` | `./assets/icon.png`: isotipo sobre fondo arena |
| `android.package` | **`com.kalendaria.app`**: identificador permanente de la app. **No se cambia** tras publicar |
| `android.versionCode` | Entero interno que Android usa para saber si un APK es más nuevo. Lo sube EAS automáticamente en los perfiles de producción |
| `android.adaptiveIcon` | Primer plano, fondo y versión monocroma (íconos temáticos de Android 13+) |
| `ios.supportsTablet` | `false` (solo teléfonos); **iOS no está publicado** |
| `experiments.typedRoutes` | Rutas tipadas: `router.push('/activity/new')` se comprueba al compilar |
| `experiments.reactCompiler` | React Compiler: memoriza componentes automáticamente |
| `plugins` | Ver §4 |
| `extra.eas.projectId` / `owner` | Enlace con el proyecto de EAS |

### Versión visible vs `versionCode`

- `version` (`1.0.0`): la ve el usuario; **se sube a mano** en cada release.
- `versionCode` (`3`, `4`…): lo compara Android al actualizar; **solo puede crecer**. Con `appVersionSource: "local"` se lee de `app.json` y `autoIncrement` lo sube en cada build de producción (por eso `app.json` aparece modificado tras compilar: hay que commitearlo).

---

## 4. Plugins de Expo configurados

| Plugin | Qué hace |
|---|---|
| `expo-router` | Registra el enrutador y su configuración nativa |
| `expo-status-bar` | Control de la barra de estado |
| `expo-secure-store` | Habilita el almacén seguro (Keystore/Keychain) donde vive la sesión |
| `expo-splash-screen` | Pantalla de arranque nativa: fondo `#F2ECEA` (claro) / `#0E1C22` (oscuro), logo a 200 pt de ancho. Se oculta al terminar de cargar fuentes, tema y sesión |
| `expo-font` | Registro nativo de fuentes (Inter) |
| `@react-native-vector-icons/ionicons` | Incrusta la fuente de íconos Ionicons |

No se incluyen `expo-notifications` ni `expo-keep-awake`: la app no usa notificaciones ni mantiene la pantalla encendida (decisión de producto).

---

## 5. EAS Build: perfiles (`eas.json`)

| Perfil | Salida | Entorno de variables | Para qué |
|---|---|---|---|
| `development` | Cliente de desarrollo (APK interno) | `development` | Desarrollar con módulos nativos en un teléfono real |
| `preview` | **APK** interno | `preview` | Probar antes de publicar |
| `production-apk` | **APK** interno, `versionCode` autoincrementado | `production` | **El archivo que se descarga desde la landing** |
| `production` | **AAB** (App Bundle), `versionCode` autoincrementado | `production` | Para subir a Google Play |

Todos usan `node: 22.13.0` en la nube (perfil `base`) y `appVersionSource: local`. Atajos: `npm run build:preview`, `npm run build:apk`, `npm run build:aab`.

> **APK vs AAB.** El APK se instala directamente (descarga manual). El AAB es el formato que exige Google Play; Play genera de él los APK optimizados para cada dispositivo.

---

## 6. Variables de entorno en EAS

Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` se guardan en EAS por **entorno** (`preview`, `production`):

```bash
npx eas-cli env:list --environment production        # ver
npx eas-cli env:create --environment production --name NOMBRE --value "…" --visibility plaintext
```

Reglas clave:

1. **Se incrustan en el bundle al compilar**: cualquiera con el APK puede leerlas. Solo van valores públicos (URL y clave publicable). Nunca la `service_role`.
2. **Lectura estática obligatoria**: `process.env.EXPO_PUBLIC_X` sí; `process.env[nombre]` no. Una lectura dinámica deja la variable en `undefined` en producción y la app se cierra al abrir. `tests/env.test.ts` lo previene.
3. Cambiar una variable **no actualiza apps ya instaladas**: hay que recompilar.
4. `npm run release:verify` comprueba que el APK lleva la referencia del proyecto de Supabase incrustada **antes** de instalarlo o publicarlo.

---

## 7. Credenciales y firma (*keystore*)

Android exige que cada APK esté **firmado**. Todas las versiones de Kalendaria deben firmarse con **la misma llave**: si cambia, Android rechaza la actualización sobre la app instalada (habría que desinstalar y perder los datos locales).

- EAS generó el *keystore* en el primer build y lo guarda (`Build Credentials … (default)`).
- Respaldo: `npx eas-cli credentials` → Android → *Download existing keystore*. Guarda el `.jks` y las contraseñas **fuera del repositorio** (`*.jks` está en `.gitignore`).
- Si se pierde la llave **y** EAS no la conserva, no podrás publicar actualizaciones de esa app. Por eso el respaldo es obligatorio.
- Para Google Play, Google puede gestionar su propia llave de distribución (Play App Signing); la de EAS pasa a ser la llave de subida.

---

## 8. Cosas que Expo *no* hace aquí

- **Actualizaciones por aire (EAS Update / `expo-updates`):** no está instalado. Cada cambio de código requiere un APK nuevo y que el usuario lo instale.
- **EAS Submit:** no se usa (no hay publicación automática en tiendas todavía).
- **iOS:** el proyecto está preparado (Expo es multiplataforma) pero **no se compila** para iOS: requiere cuenta de Apple Developer.

---

## 9. Comandos de referencia

```bash
nvm use 22                         # Node requerido (no usar 25 para compilar)
npm start                          # Metro (development build)
npm run android                    # compila y lanza en un dispositivo/emulador conectado
npx expo-doctor                    # diagnóstico de compatibilidad (20 comprobaciones)
npx expo install --check           # ¿versiones alineadas con el SDK?
npx expo install --fix             # alinear versiones
npx expo export --platform android # bundle de producción local (para inspeccionar)
npm run build:apk                  # APK de producción en EAS
npx eas-cli build:list             # estado de los builds
npx eas-cli credentials            # gestionar/respaldar el keystore
```

---

## 10. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El APK se instala pero **se cierra al abrir** | Variables `EXPO_PUBLIC_*` no incrustadas (lectura dinámica o sin cargar en EAS) | `npm run release:verify`; revisar `env:list`; `adb logcat -d \| grep -E "AndroidRuntime\|ReactNativeJS\|FATAL"` |
| "App no instalada" al actualizar | Firmada con otro *keystore* o `versionCode` menor | Usar siempre el mismo *keystore*; verificar `versionCode` |
| El teclado tapa los campos | Android con *edge-to-edge* (SDK 58) ya no redimensiona la ventana | `KeyboardAvoidingView` con `behavior="padding"` en ambas plataformas (ya aplicado) |
| `expo-doctor` marca paquetes desalineados | Parches nuevos de SDK 58 | `npx expo install --fix` |
| El build falla por la versión de Node | Node 25 local o perfil sin `node` | `nvm use 22`; los perfiles fijan `22.13.0` |
| Cola de build muy larga | Plan gratuito de EAS | Esperar; los builds tardan de minutos a ~40 min |

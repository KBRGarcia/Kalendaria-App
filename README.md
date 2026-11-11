# Kalendaria

**Tu agenda personal, simple y clara.** App móvil para anotar lo que hiciste y lo que tienes pendiente en un calendario mensual, con actividades por categorías de color. Sin alarmas, sin notificaciones y sin depender de Google. Tus datos viven en tu cuenta, así que no se pierden al cambiar de teléfono.

- **Plataforma:** Android (APK). iOS preparado en el código, aún sin publicar.
- **Versión:** 1.0.0
- **Stack:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · Zustand · Supabase

---

## Funciones

- Calendario mensual con puntos de color por categoría y navegación entre meses.
- Toca un día y ve sus actividades **bajo el calendario**; crea, edita y elimina sin cambiar de pantalla.
- Cinco categorías fijas: Reunión, Pendiente, Trabajo, Personal y Otro.
- Registro e inicio de sesión con correo y contraseña; sesión guardada en el almacén seguro del sistema.
- Tema claro, oscuro o del sistema; la preferencia te sigue entre dispositivos.
- **Modo sin conexión de lectura:** consulta lo ya cargado sin internet; las escrituras requieren conexión.
- Interfaz en español, accesible (zonas táctiles de 44 pt, etiquetas para lectores de pantalla).

## Arquitectura en una vista

```
App móvil (Expo / React Native) ──HTTPS──► Supabase (Auth + PostgreSQL + RLS)
Landing (HTML/CSS/JS) en Vercel ──enlace──► APK en GitHub Releases
Compilación del APK: EAS Build (Expo)
```

La app **no tiene servidor propio**: habla directamente con Supabase, y la seguridad la dan las políticas RLS (cada usuario solo ve sus filas). Detalle en [`docs/13-Backend-Flujo.md`](docs/13-Backend-Flujo.md).

---

## Puesta en marcha (desarrollo)

### Requisitos

- **Node.js 22** (mínimo 22.13) — con [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`. No usar 20 ni 25 para compilar.
- Un proyecto de [Supabase](https://supabase.com) con las migraciones de `supabase/migrations/` aplicadas (ver [`docs/09-Supabase.md`](docs/09-Supabase.md)).
- Un teléfono o emulador Android. **Expo Go de la tienda no abre este proyecto** (SDK 58): se usa un *development build*.

### Instalación

```bash
git clone git@github.com:KBRGarcia/Kalendaria-App.git
cd Kalendaria-App
nvm use 22
npm install
```

Crea `.env.local` en la raíz (no se versiona):

```
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu clave publicable, sb_publishable_…>
```

> Usa solo la clave **publicable**. Nunca la `service_role` / clave secreta.

### Ejecutar

```bash
npm run android     # compila el development build y lo instala en el dispositivo/emulador
npm start           # servidor Metro (después de tener el development build instalado)
```

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | TypeScript estricto sobre la app y las pruebas |
| `npm test` | 48 pruebas (`node --test`, sin red y sin tocar la base real) |
| `npm run landing` | Landing en `http://localhost:4173` |
| `npm run doctor` | Diagnóstico de compatibilidad de Expo |
| `npm run build:preview` | APK de prueba (EAS) |
| `npm run build:apk` | APK de producción (EAS) |
| `npm run build:aab` | AAB para Google Play (EAS) |
| `npm run release:verify` | Verifica un APK antes de publicarlo (configuración incrustada, tamaño, SHA-256) |
| `npm run db:backup` | Respaldo de la base con `pg_dump` |

---

## Estructura del proyecto

```
src/
├── app/            Rutas (Expo Router): (auth)/login · register · (app)/calendar · activity/* · settings
├── components/     ui/ · auth/ · calendar/ · activity/ · settings/
├── hooks/          useAuth · useMonthActivities · useNetworkStatus · useThemePreference
├── store/          authStore · activitiesStore · themeStore (Zustand)
├── services/       Acceso a Supabase, validaciones y traducción de errores
├── lib/            Cliente Supabase · caché · fechas
├── theme/          Colores, tipografía, espaciado, sombras y ThemeProvider
├── constants/      Mensajes y categorías
└── types/          Tipos de dominio y tipos generados de la base
landing/            Sitio web de descarga (Vercel)
supabase/           Migraciones SQL y plantillas de correo
tests/              Pruebas y mocks
scripts/            Verificación de APK y respaldo de la base
docs/               Documentación completa
```

---

## Pruebas

```bash
npm run typecheck && npm test
```

Cubren fechas, validaciones, caché, traducción de errores, servicios y el store de actividades (incluido el modo sin conexión y la sesión expirada), más una prueba que impide leer variables de entorno de forma dinámica (que rompería el APK). No hay aún pruebas de componentes ni E2E.

---

## Publicar una nueva versión

1. `nvm use 22` y comprobar `npm run typecheck && npm test`.
2. Subir `expo.version` en `app.json` (el `versionCode` lo sube EAS).
3. `npm run build:apk`, descargar el APK y ejecutar `npm run release:verify`.
4. Probarlo en un teléfono real.
5. Crear la release en GitHub con el archivo `kalendaria.apk`.
6. Actualizar `version`, `apkSize` y `sha256` en `landing/config.js`, hacer `git push` (Vercel redespliega solo).

Guía completa, de local a producción: [`docs/08-Guia-Produccion.md`](docs/08-Guia-Produccion.md).

> **Importante:** las variables `EXPO_PUBLIC_*` se incrustan al compilar y deben leerse con acceso estático (`process.env.EXPO_PUBLIC_X`). Una lectura dinámica deja la app cerrándose al abrir en producción.

---

## Documentación

| Documento | Contenido |
|---|---|
| [`01-PRD.md`](docs/01-PRD.md) | Requisitos de producto |
| [`02-TRD.md`](docs/02-TRD.md) | Requisitos y arquitectura técnica |
| [`04-UIUX-Brief.md`](docs/04-UIUX-Brief.md) | Diseño: marca, paleta, componentes, pantallas |
| [`05-Backend-Schema.md`](docs/05-Backend-Schema.md) | Esquema de base de datos, RLS y consultas |
| [`06-Implementation-Plan.md`](docs/06-Implementation-Plan.md) | Fases de construcción y estado |
| [`07-Distribucion.md`](docs/07-Distribucion.md) | Cómo se distribuye la app (landing + APK) |
| [`08-Guia-Produccion.md`](docs/08-Guia-Produccion.md) | De local a producción, paso a paso |
| [`09-Supabase.md`](docs/09-Supabase.md) | Papel de Supabase en el proyecto |
| [`10-Vercel.md`](docs/10-Vercel.md) | Papel de Vercel en el proyecto |
| [`11-Expo.md`](docs/11-Expo.md) | Qué es Expo/EAS y cómo se usa aquí |
| [`12-Herramientas-Dependencias.md`](docs/12-Herramientas-Dependencias.md) | Todas las herramientas y librerías |
| [`13-Backend-Flujo.md`](docs/13-Backend-Flujo.md) | Backend: rutas, consultas y flujos |

---

## Operación

- **Pausa de Supabase (plan gratuito):** el workflow `.github/workflows/keepalive.yml` consulta la API cada 3 días. Requiere los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub.
- **Respaldos:** `npm run db:backup` (necesita `pg_dump` y `SUPABASE_DB_URL`; ver cabecera de `scripts/backup-db.sh`).
- **Firma de Android:** el *keystore* lo guarda EAS. Respáldalo con `npx eas-cli credentials` y guárdalo fuera del repositorio; sin él no se pueden publicar actualizaciones.

## Estado y próximos pasos

- ✅ MVP completo (fases 0–10), APK 1.0.0 compilado y probado en dispositivo.
- ⏳ Publicación en Google Play (pendiente del acceso a Play Console). Antes hace falta **eliminar cuenta desde la app**, requisito de Play.
- 💡 Backlog: código de verificación por correo (con plan de pago), sincronización offline de escrituras, categorías personalizables, actividades recurrentes, widgets. Ver `docs/01-PRD.md` §6 y `docs/02-TRD.md` §17.

## Contribuir

- Commits en formato *Conventional Commits* (`feat:`, `fix:`, `chore:`, `docs:`).
- TypeScript estricto, componentes funcionales, estilos con `StyleSheet.create`, alias `@/…` en lugar de rutas relativas largas.
- Antes de abrir un cambio: `npm run typecheck && npm test`.
- Si añades carpetas o dependencias, actualiza la documentación en `docs/`.

## Licencia

Ver [`LICENSE`](LICENSE).

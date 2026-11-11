# Guía: del entorno local a producción

Guía paso a paso para publicar Kalendaria usando solo servicios gratuitos: **Supabase** (backend), **EAS** (compilación del APK), **GitHub** (código y archivo de descarga) y **Vercel** (landing page).

> Lo que ya está hecho en el repo: app completa (Fases 0–9), `eas.json` con perfiles, landing en `landing/`, `android.package = com.kalendaria.app`, proyecto de Expo enlazado. Esta guía cubre lo que falta fuera del código.

---

## 0. Visión general

```
┌────────────────┐   build    ┌───────────────┐  sube APK   ┌──────────────────┐
│ Código (local) │ ─────────► │ EAS (Expo)    │ ──────────► │ GitHub Release   │
│  Node 22       │            │ genera APK    │             │ kalendaria.apk   │
└───────┬────────┘            └───────────────┘             └────────▲─────────┘
        │ git push                                                   │ enlace "latest"
        ▼                                                            │
┌────────────────┐  deploy automático  ┌────────────────────────────┴───┐
│ GitHub (main)  │ ──────────────────► │ Vercel: landing/ (sitio estático) │ ◄── usuarios
└────────────────┘                     └────────────────────────────────┘
                 La app instalada habla con ──► Supabase (Auth + Postgres + RLS)
```

| Pieza | Dónde vive | Costo |
|---|---|---|
| Base de datos y auth | Supabase (plan Free) | $0 |
| Compilar el APK | EAS Build (plan Free, cola limitada) | $0 |
| Código y APK descargable | GitHub (repo + Releases) | $0 |
| Landing page | Vercel (plan Hobby) | $0 |
| Dominio propio | opcional | ~10–15 USD/año |

**Antes de cada release:** `npm run typecheck && npm test` deben pasar.

**Orden recomendado:** 1) Supabase de producción → 2) variables en EAS → 3) build y prueba del APK → 4) GitHub Release → 5) landing en Vercel → 6) verificación final.

---

## 1. Prerrequisitos en tu máquina

1. **Node 22** (no 25: es la versión que usa EAS y la que pide el TRD):
   ```bash
   nvm install 22 && nvm use 22 && node -v
   ```
2. Dependencias instaladas y proyecto sano:
   ```bash
   npm install
   npm run typecheck      # tipos de la app y de las pruebas
   npm test               # 46 pruebas (utilidades, validaciones, caché, auth, servicios y store)
   npx expo install --check
   ```
   Las pruebas usan el ejecutor nativo de Node (`node --test`) con un cliente Supabase falso (`tests/mocks`): no tocan tu base real ni necesitan red.
3. Herramientas de línea de comandos:
   - EAS CLI: `npx eas-cli --version` (se usa con `npx`, no hace falta instalarlo global).
   - GitHub CLI (opcional pero cómodo): `gh --version` y `gh auth login`.
4. Sesión en EAS: `npx eas-cli whoami` debe mostrar tu usuario (`kbrgarcia`). Si no, `npx eas-cli login`.

---

## 2. Supabase: pasar a producción

### 2.1 ¿Un proyecto o dos?

Hoy desarrollas contra un único proyecto de Supabase. Para producción conviene **separar**:

| Proyecto | Uso | Datos |
|---|---|---|
| `kalendaria-dev` (el actual) | Desarrollo y pruebas | De prueba, se pueden borrar |
| `kalendaria-prod` (nuevo) | Usuarios reales | Reales; no se tocan a mano |

El plan Free permite 2 proyectos activos (verifícalo en tu dashboard).

- **Opción A: dos proyectos (más seguro).** Producción queda aislada de tus pruebas, pero consumes los 2 cupos.
- **Opción B: reutilizar el actual como producción (decisión actual).** Ahorra un cupo para el futuro. A cambio, desarrollo y producción comparten base de datos, así que:
  1. En el proyecto actual, omite 2.2 y 2.3 si las tablas ya existen: compruébalo en el *Table Editor* (con RLS activo). Aplica igualmente 2.4 (Confirm email desactivado, contraseña mínima 8) y 2.5.
  2. Antes de lanzar, borra tus usuarios de prueba en *Authentication → Users*. Sus actividades y perfiles se eliminan en cascada.
  3. Haz respaldo (2.9) antes de cualquier cambio de esquema y escribe migraciones que solo añadan (`006_…`), sin borrar columnas ni tablas.
  4. Prueba siempre con una cuenta tuya de prueba, y bórrala antes de cada release.
  5. En EAS (sección 3) usa los mismos valores de `.env.local` para `preview` y `production`.
  6. Cuando cambies el esquema con frecuencia, considera Supabase CLI con Docker (`supabase start`): una base local gratuita para desarrollo, sin gastar proyectos de la nube. Requiere renombrar las migraciones con marca de tiempo.

### 2.2 Crear el proyecto de producción

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nombre `kalendaria-prod`, región **cercana a tus usuarios**, y una contraseña de base de datos fuerte (guárdala en un gestor de contraseñas; no se vuelve a mostrar).
3. Espera a que termine el aprovisionamiento (1–2 minutos).

### 2.3 Crear el esquema

Ejecuta las migraciones **en orden**, cada archivo completo, en **SQL Editor** (o en DBeaver, como describe `supabase/README.md`). Si uno falla, no sigas.

1. `supabase/migrations/001_create_profiles.sql`
2. `supabase/migrations/002_create_activities.sql`
3. `supabase/migrations/003_set_updated_at_function.sql`
4. `supabase/migrations/004_enable_rls.sql`
5. `supabase/migrations/005_update_last_login_function.sql`

No ejecutes el seed de la sección 9.2 de `05-Backend-Schema.md`: son datos de ejemplo y piden un UUID real.

### 2.4 Configurar Auth

En **Authentication**:

| Ajuste | Valor | Motivo |
|---|---|---|
| Providers → Email | Activado | Acceso con correo y contraseña |
| Confirm email | **Desactivado** | El plan Free no permite plantillas propias; la app no pide código |
| Allow new users to sign up | Activado | Registro abierto |
| Password → Minimum length | **8** | El valor por defecto es menor; la app exige 8 con letra y número |
| URL Configuration → Site URL | URL de tu landing en Vercel (cuando la tengas) | No se usan enlaces de correo, pero evita valores `localhost` en producción |

### 2.5 Verificar seguridad (RLS)

1. **Table Editor**: `profiles` y `activities` deben mostrar el candado de RLS activo.
2. Prueba sin token (reemplaza URL y anon key por los de **producción**, en **Project Settings → API**):
   ```bash
   curl -s "https://<ref>.supabase.co/rest/v1/activities?select=*" \
     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
   ```
   Debe devolver `[]`. Nunca datos de nadie.
3. **Advisors → Security** no debe mostrar alertas críticas.

### 2.6 Claves: qué es público y qué no

| Clave | ¿Va en la app? | Notas |
|---|---|---|
| `URL` del proyecto | Sí (`EXPO_PUBLIC_SUPABASE_URL`) | Pública |
| `anon` key | Sí (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) | Pública por diseño; la protege RLS |
| `service_role` key | **Nunca** | Salta RLS. No la pegues en la app, el repo, EAS ni Vercel |
| Contraseña de la base | **Nunca** en la app | Solo para DBeaver o `pg_dump` |

### 2.7 Límites del plan Free que debes conocer

Verifica las cifras vigentes en [supabase.com/pricing](https://supabase.com/pricing), pero los puntos que afectan a Kalendaria son:

- **Pausa por inactividad:** los proyectos Free se pausan tras aproximadamente una semana sin actividad. Mientras estén pausados, la app falla. Se reactiva desde el dashboard. Para evitarlo, ver 2.8.
- **Sin copias de seguridad automáticas descargables** en Free: haz respaldos manuales (2.9).
- Límites de almacenamiento, usuarios activos mensuales y transferencia: muy por encima de lo que necesita una agenda personal, pero revísalos si crece.

### 2.8 Mantener el proyecto despierto (ya automatizado)

El repositorio incluye `.github/workflows/keepalive.yml`: cada 3 días hace una consulta de **solo lectura** a la API (`GET /rest/v1/activities?select=id&limit=1`) y falla de forma visible si la API no responde 200. Solo necesita **dos secretos** que debes crear tú en GitHub:

1. Repositorio → **Settings → Secrets and variables → Actions → New repository secret**.
2. `SUPABASE_URL` = la **Project URL** del proyecto, exactamente `https://<ref>.supabase.co` (sin barra final ni rutas). **No** la dirección del panel (`supabase.com/dashboard/project/…`): con ella la API responde `308` y el workflow falla. La encuentras en **Connect** (barra superior del proyecto) o en `EXPO_PUBLIC_SUPABASE_URL` de tu `.env.local`.
3. `SUPABASE_ANON_KEY` = la clave **publicable** (`sb_publishable_…`). Nunca la `service_role` ni `sb_secret_…`.
4. Pestaña **Actions → Supabase keep-alive → Run workflow** para probarlo; debe terminar en verde ("Respuesta de la API: 200").

Notas: GitHub desactiva los workflows programados de repositorios **públicos** sin actividad durante ~60 días (te avisa por correo; se reactiva con un clic o con cualquier commit). Si un día falla, GitHub te envía un correo: significa que el proyecto está pausado o las claves cambiaron.

### 2.9 Respaldo manual (ya automatizado)

```bash
npm run db:backup
```

Requisitos: `pg_dump` (`sudo apt install postgresql-client`) y la variable `SUPABASE_DB_URL`. Obtén la cadena en Supabase → **Connect → Session pooler** (compatible con IPv4), sustituye `[YOUR-PASSWORD]` por la contraseña de tu base y guárdala en `.env.backup.local` (ignorado por git) como:

```
SUPABASE_DB_URL=postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Genera en `backups/` (ignorada por git) dos archivos: el esquema y datos de la app, y los datos de `auth.users` (cuentas y hashes de contraseña: **sensibles**). Guarda una copia fuera del equipo. Hazlo antes de cualquier migración y con la frecuencia que te dé tranquilidad (p. ej. semanal).

### 2.10 Cambios futuros del esquema

Escribe una migración nueva (`006_...sql`), pruébala en `kalendaria-dev` y, solo si funciona, ejecútala en `kalendaria-prod` tras un respaldo. Añade el archivo al repo.

---

## 3. Variables de entorno en EAS

Las claves `EXPO_PUBLIC_*` se **incrustan en el bundle** al compilar. Por eso deben existir en EAS para cada entorno; el `.env.local` solo vale en tu máquina.

Usa los valores de **producción** para el entorno `production` (y los de `dev` o de prueba para `preview`). Los comandos leen de variables de shell para que no escribas las claves en el historial:

```bash
nvm use 22
export PROD_URL="https://<ref-prod>.supabase.co"
export PROD_ANON="<anon key de producción>"

npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL      --value "$PROD_URL"  --visibility plaintext --non-interactive --force
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$PROD_ANON" --visibility sensitive  --non-interactive --force
```

Repite con `--environment preview` (puede apuntar al proyecto de dev). Comprueba:

```bash
npx eas-cli env:list --environment production
```

> Si `env:create` te avisa de que está deprecado, el equivalente nuevo es `env:set`.

---

## 4. Compilar y probar el APK

### 4.1 Primer build de prueba (`preview`)

```bash
nvm use 22
npm run build:preview
```

- En el primer build, EAS pregunta si genera un **keystore** de Android: responde **sí**.
- El build corre en la nube (cola gratuita: puede tardar de minutos a decenas de minutos).
- Al terminar te da un enlace y un QR para descargar el `.apk`.

### 4.2 Prueba en un teléfono real

Instala el APK y revisa **todo** esto:

- [ ] Registro con correo nuevo → entra sin código.
- [ ] Registro con correo repetido → mensaje de error.
- [ ] Login correcto e incorrecto ("Correo o contraseña incorrectos").
- [ ] Cerrar y abrir la app → mantiene la sesión.
- [ ] Crear, editar y eliminar una actividad; los puntos del calendario se actualizan.
- [ ] Modo avión: se ven las actividades en caché; crear se bloquea con "Sin conexión".
- [ ] Tema claro/oscuro/sistema; la preferencia persiste.
- [ ] Cerrar sesión limpia todo y vuelve a login.
- [ ] Icono y splash se ven bien (claro y oscuro).

### 4.3 Respaldar el keystore (importante)

```bash
npx eas-cli credentials
```

Elige Android → el perfil → descarga el keystore y sus contraseñas. Guárdalos **fuera del repo** (gestor de contraseñas o disco cifrado). Si lo pierdes, **no podrás actualizar** la app instalada: habría que desinstalar e instalar de cero.

### 4.4 Build de producción (APK para la web)

Con las variables de producción cargadas (sección 3):

```bash
npm run build:apk
```

Usa el perfil `production-apk` (entorno `production`, incrementa `versionCode` solo). Descarga el `.apk` resultante y **vuelve a probarlo** con la lista de 4.2, ahora contra el Supabase de producción.

Renómbralo a `kalendaria.apk`.

### 4.5 Comprobar que el APK lleva la configuración incrustada (antes de instalarlo)

Un APK sin las variables de Supabase se instala bien pero **se cierra al abrirlo**. Compruébalo en segundos: el bundle debe contener la referencia de tu proyecto (la parte `xxxx` de `https://xxxx.supabase.co`).

```bash
REF=$(sed -n 's#.*https://\([a-z0-9]*\)\.supabase\.co.*#\1#p' .env.local); unzip -p ~/Descargas/kalendaria.apk assets/index.android.bundle | strings | grep -c "$REF"
```

Debe imprimir **1 o más**. Si imprime `0`, el build no incrustó las variables: no lo publiques. Las causas habituales son que las variables no estén cargadas en el entorno de EAS o que el código las lea con `process.env[nombre]` en vez de `process.env.EXPO_PUBLIC_NOMBRE` (la prueba `tests/env.test.ts` lo vigila).

Si la app aun así se cierra, conecta el teléfono por USB (depuración USB activada) y mira el motivo real:

```bash
adb logcat -d | grep -E "AndroidRuntime|ReactNativeJS|FATAL" | tail -40
```

---

## 5. GitHub: repositorio y release del APK

### 5.1 Antes de subir nada

```bash
git status                       # árbol limpio
git ls-files | grep -E '\.env|\.jks|\.p12|\.key'   # no debe salir nada
```

`.env.local` y los keystores ya están en `.gitignore`. Verifica además que ningún archivo del repo contenga la `service_role` ni la contraseña de la base.

### 5.2 Subir el código

```bash
git push origin main
```

### 5.3 Crear la release con el APK

El nombre del archivo debe ser exactamente `kalendaria.apk`: la landing enlaza a `.../releases/latest/download/kalendaria.apk`.

```bash
gh release create v1.0.0 kalendaria.apk \
  --title "Kalendaria 1.0.0" \
  --notes "Primera versión pública."
```

(Sin `gh`: GitHub → **Releases → Draft a new release** → tag `v1.0.0` → arrastra el APK → **Publish**.)

### 5.4 Datos de integridad para la landing

```bash
sha256sum kalendaria.apk
ls -lh kalendaria.apk
```

Copia el resultado en [`landing/config.js`](../landing/config.js):

```js
version: '1.0.0',
apkSize: '58 MB',                 // el tamaño real
sha256: '<la huella de arriba>',
```

Al guardarlo, la landing muestra tamaño y huella con un botón de copiar. Commit y push:

```bash
git add landing/config.js && git commit -m "chore(landing): publica versión 1.0.0" && git push
```

---

## 6. Vercel: publicar la landing

La landing es **estática** (HTML, CSS y JS sin build). No necesita base de datos ni variables de entorno.

### 6.1 Crear el proyecto

1. Entra a [vercel.com](https://vercel.com) con tu cuenta (la de GitHub es lo más simple).
2. **Add New… → Project** → **Import** el repo `Kalendaria-App` (autoriza a Vercel a leer ese repo).
3. En la pantalla de configuración:

| Campo | Valor |
|---|---|
| Project Name | `kalendaria` (la URL será `kalendaria.vercel.app`, si está libre) |
| Framework Preset | **Other** |
| **Root Directory** | **`landing`** (pulsa *Edit* y elige la carpeta) |
| Build Command | vacío (déjalo en blanco o "None") |
| Output Directory | vacío (se sirve la raíz de `landing/`) |
| Install Command | vacío |
| Environment Variables | ninguna |

4. **Deploy**. En segundos tendrás la URL pública.

`landing/vercel.json` ya aplica los encabezados de seguridad (CSP estricta, HSTS, `nosniff`, etc.) y la caché; no tienes que configurarlos en el panel.

### 6.2 Despliegue automático

Desde ahora, cada `git push` a `main` redepliega. Las ramas y los *pull requests* generan URLs de vista previa. Si solo quieres desplegar cuando cambie la landing, en **Settings → Git → Ignored Build Step** puedes usar:

```bash
git diff --quiet HEAD^ HEAD -- landing/
```

### 6.3 ¿Hace falta enlazar Vercel con Supabase?

**No.** Existe una integración Vercel↔Supabase, pero sirve para sincronizar variables de entorno hacia proyectos de Vercel que consultan la base. Aquí la landing es estática y la app móvil habla directo con Supabase desde el teléfono; no hay nada en Vercel que necesite esas claves. Enlazarlas solo añadiría una superficie de riesgo (claves en un tercer servicio) sin beneficio. Si más adelante añades un backend en Vercel (por ejemplo, una función para eliminar cuentas), ahí sí tendría sentido, usando la `service_role` solo del lado servidor.

### 6.4 Nota sobre el plan Hobby

El plan Hobby de Vercel es para uso personal y no comercial. Si más adelante monetizas Kalendaria, revisa sus términos o migra la landing a otro hosting estático gratuito (Cloudflare Pages o GitHub Pages sirven el mismo contenido sin cambios, pero tendrías que replicar los encabezados de `vercel.json`).

### 6.5 Dominio propio (opcional)

1. Compra el dominio en el registrador que prefieras.
2. Vercel → proyecto → **Settings → Domains → Add** y sigue los registros DNS que te muestra (un `A` o `CNAME`).
3. Actualiza **Site URL** en Supabase (2.4) al dominio nuevo.

### 6.6 Verificación de la landing publicada

```bash
curl -sI https://kalendaria.vercel.app | grep -i -E "content-security|strict-transport|x-content-type"
```

Y desde un **teléfono Android** (esta es la prueba que importa):

- [ ] La página se ve bien en claro y oscuro.
- [ ] El botón "Descargar para Android" baja `kalendaria.apk`.
- [ ] El APK se instala siguiendo los pasos de la página.
- [ ] `https://<tu-url>/privacidad` carga.
- [ ] La huella SHA-256 mostrada coincide con la del archivo descargado.

---

## 7. Probar la landing en local

```bash
npm run landing
```

Abre `http://localhost:4173`. El servidor aplica los **mismos encabezados que producción** (incluida la CSP), así que cualquier script o estilo en línea que rompa en Vercel también rompe aquí, y lo ves antes de desplegar. Puedes cambiar el puerto: `node landing/dev-server.mjs 5000`.

Para probar el botón de descarga sin release, edita temporalmente `apkUrl` en `landing/config.js` hacia un archivo dentro de `landing/` (por ejemplo `kalendaria.apk`) y vuelve a dejarlo antes de hacer commit.

---

## 8. Publicar una nueva versión

1. Haz los cambios y pruébalos en local.
2. Sube `expo.version` en `app.json` (p. ej. `1.0.1`). El `versionCode` lo incrementa EAS solo.
3. `nvm use 22 && npm run build:apk`.
4. Prueba el APK en un teléfono.
5. `gh release create v1.0.1 kalendaria.apk --title "Kalendaria 1.0.1" --notes "..."`.
6. Actualiza `version`, `apkSize` y `sha256` en `landing/config.js`, commit y push (Vercel redepliega).
7. Si hubo cambios de esquema: respaldo → migración en `kalendaria-prod` **antes** de publicar el APK.

**Revertir:** en Vercel → *Deployments* → el despliegue anterior → **Promote to Production**. En GitHub, marca como *latest* la release anterior o elimina la defectuosa.

---

## 9. Después: Google Play Store

Cuando resuelvas el acceso a Play Console:

1. Genera el **AAB**: `npm run build:aab` (perfil `production`).
2. Prepara lo que Play exige: **política de privacidad** (tu URL `/privacidad`), formulario de **Seguridad de los datos**, clasificación de contenido, capturas e icono de 512×512.
3. **Eliminación de cuenta:** Play pide que las apps con registro permitan eliminar la cuenta y tengan una URL web para solicitarlo. Kalendaria aún **no** lo implementa: es trabajo pendiente antes de publicar en Play (opción en Ajustes + función segura en servidor, p. ej. una Edge Function de Supabase que use la `service_role` del lado servidor).
4. Las cuentas personales nuevas pueden requerir una **prueba cerrada con testers durante un periodo mínimo** antes de producción. Confirma los requisitos vigentes en la ayuda de Play Console.
5. El `package` (`com.kalendaria.app`) es permanente una vez publicado.
6. Cuando tengas la ficha, pon su URL en `playStoreUrl` de `landing/config.js`: el botón "Obtener en Google Play" aparece solo y el APK queda como alternativa.

---

## 10. Checklist final de salida

**Supabase**
- [ ] Proyecto de producción creado; esquema aplicado en orden.
- [ ] RLS activo; `curl` anónimo devuelve `[]`.
- [ ] Confirm email desactivado; longitud mínima de contraseña 8.
- [ ] Respaldo manual hecho.
- [ ] (Opcional) keep-alive configurado.

**EAS / APK**
- [ ] Variables de `production` cargadas (`env:list`).
- [ ] APK probado en teléfono real contra producción.
- [ ] Keystore respaldado fuera del repo.

**GitHub**
- [ ] Sin secretos en el repo.
- [ ] Release `vX.Y.Z` con `kalendaria.apk`.

**Vercel**
- [ ] Root Directory `landing`, sin build.
- [ ] Encabezados de seguridad presentes.
- [ ] Descarga e instalación probadas desde un Android.

**Documentación**
- [ ] `docs/06-Implementation-Plan.md` con la Fase 10 cerrada.

---

## 11. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La app instalada no conecta o falla al iniciar sesión | Faltan `EXPO_PUBLIC_*` en EAS para ese entorno | Revisa `env:list` y recompila: se incrustan en el build |
| "Falta la variable de entorno…" al abrir | Build sin variables | Igual que arriba |
| La app dejó de responder tras unos días | Proyecto Free de Supabase pausado | Reactívalo en el dashboard; configura 2.8 |
| El botón de descarga da 404 | No existe la release o el archivo no se llama `kalendaria.apk` | Revisa nombre y que la release esté publicada (no borrador) |
| Android no deja instalar | Falta permitir "apps desconocidas" | Sigue el paso 3 de la landing |
| "App no instalada" al actualizar | Firmado con otro keystore | Usa siempre el mismo; si lo perdiste, desinstala e instala de cero |
| La landing sin estilos en producción | Ruta de Root Directory incorrecta | En Vercel debe ser `landing` |
| Algo funciona en local pero no en Vercel | CSP bloquea un script o estilo en línea | Pruébalo con `npm run landing`: aplica la misma CSP |
| `eas build` falla por versión de Node | Node 25 local o perfil sin `node` | Usa `nvm use 22`; los perfiles ya fijan `22.13.0` |

---

## 12. Referencia rápida de comandos

```bash
nvm use 22                      # versión de Node
npm run typecheck               # tipos
npm run landing                 # landing en http://localhost:4173
npm run build:preview           # APK de prueba (entorno preview)
npm run build:apk               # APK de producción (para la web)
npm run build:aab               # AAB de producción (para Play Store)
npx eas-cli env:list --environment production
npx eas-cli credentials         # respaldar el keystore
gh release create vX.Y.Z kalendaria.apk --title "..." --notes "..."
```

---

## 13. Operación continua (después del lanzamiento)

Todo lo recurrente, en un solo lugar:

| Tarea | Frecuencia | Cómo | Automatizado |
|---|---|---|---|
| Evitar la pausa de Supabase | Cada 3 días | `keepalive.yml` (ver 2.8) | ✅ (requiere los 2 secretos) |
| Respaldo de la base | Antes de cambios de esquema y periódico | `npm run db:backup` (ver 2.9) | Script listo; lo ejecutas tú |
| Verificar cada APK nuevo | En cada release | `npm run release:verify` (ver 4.5) | Script listo |
| Publicar versión nueva | Cuando haya cambios | Sección 8 | Parcial |
| Revisar el keep-alive | Mensual | GitHub → Actions: debe estar en verde | — |
| Mantener el keystore | Siempre | Copia fuera del repositorio; no borrar la de EAS | — |
| Actualizar dependencias | Cada 1–2 meses | `docs/12` §8: `npx expo install --fix`, tests, build de prueba | — |
| Limpiar cuentas de prueba | Tras cada prueba | Supabase → Authentication → Users | — |
| Vigilar el plan gratuito | Trimestral | Panel de Supabase/Vercel/EAS: uso y límites | — |

**Qué NO puede automatizar el repositorio** (depende de tus cuentas): crear los secretos de GitHub, la contraseña de la base de datos, el respaldo del keystore, la release en GitHub y el despliegue en Vercel.

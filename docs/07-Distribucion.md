# Distribución de Kalendaria

> Procedimiento completo, paso a paso, en [`08-Guia-Produccion.md`](08-Guia-Produccion.md). Esta página resume la decisión.

**Estado:** vigente desde noviembre 2026. Hasta resolver el acceso a Google Play Console, la app se distribuye como APK desde una landing page.

## Decisión

Landing page profesional + APK alojado como asset de una GitHub Release. No se comparte el enlace directo al archivo.

- La landing es un sitio estático en [`landing/`](../landing/index.html). Explica la app, cómo instalarla y contiene el botón de descarga.
- El APK vive en GitHub Releases con el nombre fijo `kalendaria.apk`. La URL `https://github.com/KBRGarcia/Kalendaria-App/releases/latest/download/kalendaria.apk` siempre apunta a la última versión, así que la landing no se edita en cada release.
- La landing se publica en **Vercel** (plan Hobby) con *Root Directory* `landing` y sin paso de build; cada `git push` a `main` redepliega. Los encabezados de seguridad (CSP, HSTS) viven en `landing/vercel.json`.
- Cuando Play Store esté disponible, se añade su URL a `playStoreUrl` en `landing/config.js` y el botón aparece solo; el APK queda como alternativa.

## Por qué no un enlace directo

- Un `.apk` suelto en un enlace genera desconfianza y no explica el aviso de “apps desconocidas” de Android.
- La landing da una URL estable, instrucciones, y un lugar para añadir Play Store, capturas y soporte.

## Publicar una versión (APK)

1. `nvm use 22`.
2. Subir `expo.version` en `app.json` si cambia la versión visible. `versionCode` lo incrementa EAS (`autoIncrement`).
3. Generar el APK de producción:
   ```bash
   npm run build:apk
   ```
   Usa el perfil `production-apk` (entorno `production` de EAS, que debe tener `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Descargar el APK desde el enlace que entrega EAS, renombrarlo a `kalendaria.apk`.
5. Probarlo en un teléfono real (registro, login, CRUD, offline, tema, icono y splash).
6. Crear la release en GitHub y adjuntar `kalendaria.apk`:
   ```bash
   gh release create v1.0.0 kalendaria.apk --title "Kalendaria 1.0.0" --notes "Primera versión pública."
   ```

## Firma (importante)

- EAS genera y guarda el keystore de Android en la primera build. Descarga una copia de respaldo con `npx eas-cli credentials` y guárdala fuera del repo (`*.jks` está en `.gitignore`).
- Todas las versiones del APK deben firmarse con ese mismo keystore. Si cambia, Android no permite actualizar sobre la app instalada.
- Para Play Store se usa el AAB (`npm run build:aab`); Google gestiona su propia clave de distribución con Play App Signing.

## Variables de entorno en EAS

`EXPO_PUBLIC_*` se incrusta en el bundle: son públicas por diseño (URL y anon key de Supabase; la seguridad la da RLS). Se cargan por entorno (`preview` y `production`) con `eas env:create`.

## Pendiente

- Importar el repo en Vercel con Root Directory `landing` (ver `08-Guia-Produccion.md`, sección 6).
- Añadir capturas reales de la app a la landing.
- Dominio propio (opcional) apuntando a Vercel.
- Política de privacidad: ya existe en `landing/privacidad.html`; revisa que el contacto sea el que quieres publicar (`contactEmail` en `landing/config.js`).

## Documentación relacionada

`08-Guia-Produccion.md` (paso a paso), `09-Supabase.md`, `10-Vercel.md`, `11-Expo.md`, `12-Herramientas-Dependencias.md` y `13-Backend-Flujo.md`.

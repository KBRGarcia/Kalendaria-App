# Vercel en Kalendaria

**Versión:** 1.0 · **Fecha:** noviembre 2026 · **Documentos relacionados:** `07-Distribucion.md` (decisión de distribución), `08-Guia-Produccion.md` (despliegue paso a paso)

---

## 1. Qué es y qué papel tiene

[Vercel](https://vercel.com) es una plataforma de alojamiento web. Toma una carpeta de tu repositorio de GitHub, la publica en internet con HTTPS y la vuelve a publicar automáticamente cada vez que haces `git push`.

En Kalendaria, Vercel hace **una sola cosa**: sirve la **landing page** (el sitio web público desde donde las personas descargan la app).

> **Lo que Vercel NO hace en este proyecto:**
> - No aloja la app móvil (corre en el teléfono).
> - No aloja el APK (vive en **GitHub Releases**; la landing solo enlaza a él).
> - No es el backend (eso es **Supabase**) y no se conecta a Supabase.
> - No compila nada: el sitio es HTML, CSS y JavaScript sin paso de *build*.

```
Usuario ─► https://<tu-sitio>.vercel.app  (Vercel sirve landing/)
              │
              └─ botón "Descargar" ─► GitHub Releases ─► kalendaria.apk ─► teléfono
```

---

## 2. Por qué una landing y no un enlace directo al APK

- Un `.apk` suelto genera desconfianza y no explica el aviso de "apps de origen desconocido" de Android.
- La landing da una URL estable y profesional, instrucciones de instalación, la huella SHA-256 para verificar el archivo, la política de privacidad (que Google Play exigirá) y un sitio donde añadir el botón de Play Store cuando exista.
- La URL del APK no cambia entre versiones (`releases/latest/download/kalendaria.apk`), así que la landing no se edita en cada release salvo versión, tamaño y huella.

---

## 3. Qué hay en `landing/`

| Archivo | Función |
|---|---|
| `index.html` | Página principal: hero, demo interactiva del calendario, características, categorías, instalación, FAQ |
| `privacidad.html` | Política de privacidad (qué datos se guardan y cómo pedir su eliminación) |
| `404.html` | Página de error con la marca; Vercel la usa automáticamente |
| `styles.css` | Estilos con los tokens del `04-UIUX-Brief.md` (tema claro y oscuro) |
| `app.js` | Comportamiento: tema claro/oscuro/sistema, demo del calendario, copiar huella, enlaces |
| `config.js` | **Único archivo que cambia por versión**: `version`, `apkUrl`, `apkSize`, `sha256`, `playStoreUrl`, enlaces y contacto |
| `theme-init.js` | Aplica el tema guardado antes del primer pintado (evita el parpadeo) |
| `robots.txt` | Permite el rastreo |
| `vercel.json` | Encabezados de seguridad, caché y `cleanUrls` |
| `.vercelignore` | Excluye `dev-server.mjs` del despliegue |
| `dev-server.mjs` | Servidor local sin dependencias (`npm run landing`); **no se publica** |
| `assets/` | Logo, ícono y favicon |

### 3.1 `config.js`, el panel de control

```js
window.KALENDARIA = {
  version: '1.0.0',
  apkUrl: 'https://github.com/KBRGarcia/Kalendaria-App/releases/latest/download/kalendaria.apk',
  apkSize: '93 MB',
  sha256: '<huella del APK publicado>',
  minAndroid: '8.0',
  playStoreUrl: '',      // cuando exista, aparece el botón de Google Play
  githubUrl: '…', issuesUrl: '…',
  contactEmail: '',      // opcional; si está vacío se usa la página de Issues
};
```

Comportamientos automáticos: si `apkUrl` está vacío, el botón se desactiva ("Disponible muy pronto"); si hay `sha256`/`apkSize`, aparecen en la tarjeta de descarga; si hay `playStoreUrl`, se muestra el botón de Play y se oculta "próximamente".

---

## 4. Configuración del proyecto en Vercel

| Campo | Valor |
|---|---|
| Repositorio | `KBRGarcia/Kalendaria-App` |
| **Root Directory** | **`landing`** |
| Framework Preset | Other |
| Build / Output / Install command | vacíos |
| Variables de entorno | ninguna |
| Plan | Hobby (gratuito) |

Con eso, cada `git push` a `main` redepliega. Las ramas y los *pull requests* generan URLs de vista previa.

---

## 5. Seguridad y rendimiento (`vercel.json`)

- **Content-Security-Policy estricta:** `default-src 'self'`; scripts y estilos solo del propio sitio (más Google Fonts para la tipografía Inter); sin `unsafe-inline`; `frame-ancestors 'none'`; `base-uri 'none'`; `form-action 'none'`. Por eso **no hay estilos ni scripts en línea**: todo está en archivos.
- **HSTS** (HTTPS obligatorio), `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy` (sin cámara, micrófono, ubicación ni pagos).
- **Caché:** `assets/` es inmutable (un año); `.css` y `.js` se revalidan en cada visita para que un cambio se vea al instante.
- `cleanUrls`: `/privacidad` sirve `privacidad.html`.

> El servidor local (`npm run landing`) aplica **los mismos encabezados**, así que cualquier script o estilo en línea que rompa en Vercel también rompe en local y se detecta antes de desplegar.

---

## 6. Trabajar con la landing

| Tarea | Cómo |
|---|---|
| Ver en local | `npm run landing` → `http://localhost:4173` |
| Publicar un cambio | Edita, `git commit`, `git push` → Vercel redepliega solo |
| Publicar versión nueva | Actualiza `version`, `apkSize` y `sha256` en `config.js` (el script `npm run release:verify` te los imprime) |
| Revertir | Vercel → Deployments → despliegue anterior → **Promote to Production** |
| Dominio propio (opcional) | Vercel → Settings → Domains → sigue los registros DNS |
| Añadir capturas | Colócalas en `landing/assets/` y enlázalas desde `index.html` |

---

## 7. Preguntas habituales

**¿Hay que enlazar Vercel con Supabase?** No. La integración Vercel↔Supabase sirve para sincronizar variables de entorno a proyectos de Vercel que consultan la base. Aquí la landing es estática y la app móvil habla directo con Supabase; enlazarlas solo pondría claves en un tercer servicio sin ningún beneficio. Tendría sentido si algún día se añade un backend en Vercel (por ejemplo, una función de eliminación de cuenta).

**¿Qué pasa si se cae Vercel?** La app sigue funcionando (no depende de Vercel). Solo la página de descarga dejaría de estar disponible.

**¿Límites del plan Hobby?** Es para uso personal y no comercial; si monetizas Kalendaria, revisa los términos de Vercel. El contenido se puede mover a otro hosting estático (Cloudflare Pages, GitHub Pages) replicando los encabezados de `vercel.json`.

**El botón de descarga da 404.** Falta publicar la release en GitHub, el archivo no se llama `kalendaria.apk`, o el repositorio es privado (las descargas anónimas requieren repositorio público).

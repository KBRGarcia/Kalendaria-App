// Servidor estático local para la landing. No tiene dependencias.
// Uso: npm run landing   (o: node landing/dev-server.mjs [puerto])
// Aplica los mismos encabezados que vercel.json (incluida la CSP) para detectar
// problemas antes de desplegar, y sirve /privacidad como privacidad.html (cleanUrls).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const globalHeaders = Object.fromEntries(
  (config.headers.find((rule) => rule.source === '/(.*)')?.headers ?? []).map((h) => [h.key, h.value]),
);
// En local no hay HTTPS: HSTS solo tiene sentido en producción.
delete globalHeaders['Strict-Transport-Security'];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive',
};

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const target = normalize(join(root, clean === '/' ? 'index.html' : clean));
  if (target !== root && !target.startsWith(root + sep)) return null; // evita salir de landing/

  const candidates = extname(target) ? [target] : [target, `${target}.html`, join(target, 'index.html')];
  for (const candidate of candidates) {
    const info = await stat(candidate).catch(() => null);
    if (info?.isFile()) return candidate;
  }
  return null;
}

const hidden = new Set(['dev-server.mjs', 'vercel.json']);

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/');
  const name = file ? file.slice(root.length + 1) : '';

  if (!file || hidden.has(name)) {
    const page = await readFile(join(root, '404.html')).catch(() => Buffer.from('404 — No encontrado'));
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...globalHeaders });
    res.end(page);
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...globalHeaders,
  });
  res.end(body);
  console.log(`${req.method} ${req.url} → ${name}`);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Landing en http://localhost:${port}  (Ctrl+C para detener)`);
});

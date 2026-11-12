import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { ACTIVITY_CATEGORY_LIST, CUSTOM_CATEGORY_COLORS } from '@constants/categories';

// Auditoría estructural: comprueba que el proyecto está completo y coherente sin necesitar
// dispositivo ni red. Se ejecuta junto con el resto con `npm test`.

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = walk(src).filter((file) => /\.(ts|tsx)$/.test(file));
const readJson = (path: string): Record<string, unknown> => JSON.parse(readFileSync(path, 'utf8'));

const ALIASES: [string, string][] = [
  ['@components/', join(src, 'components')],
  ['@hooks/', join(src, 'hooks')],
  ['@store/', join(src, 'store')],
  ['@services/', join(src, 'services')],
  ['@theme/', join(src, 'theme')],
  ['@lib/', join(src, 'lib')],
  ['@constants/', join(src, 'constants')],
  ['@/', src],
];

function resolves(base: string): boolean {
  return ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some((suffix) => {
    const path = base + suffix;
    return existsSync(path) && statSync(path).isFile();
  });
}

describe('integridad del código', () => {
  it('todos los imports con alias o relativos apuntan a un archivo que existe', () => {
    const broken: string[] = [];
    const pattern = /(?:from|import)\s+['"]([^'"]+)['"]/g;

    for (const file of sourceFiles) {
      const code = readFileSync(file, 'utf8');
      for (const match of code.matchAll(pattern)) {
        const specifier = match[1] ?? '';
        const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix));
        if (alias) {
          const target = join(alias[1], specifier.slice(alias[0].length));
          if (!resolves(target)) broken.push(`${file} → ${specifier}`);
        } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
          if (!resolves(join(file, '..', specifier))) broken.push(`${file} → ${specifier}`);
        }
      }
    }

    assert.deepEqual(broken, []);
  });

  it('no quedan console.log ni debugger en src', () => {
    const offenders = sourceFiles.filter((file) => /\bconsole\.log\(|\bdebugger\b/.test(readFileSync(file, 'utf8')));
    assert.deepEqual(offenders, []);
  });

  it('las rutas de la app existen y cada pantalla de ruta exporta un componente por defecto', () => {
    const routes = [
      'app/_layout.tsx',
      'app/index.tsx',
      'app/(auth)/_layout.tsx',
      'app/(auth)/login.tsx',
      'app/(auth)/register.tsx',
      'app/(app)/_layout.tsx',
      'app/(app)/calendar.tsx',
      'app/(app)/settings.tsx',
      'app/(app)/activity/new.tsx',
      'app/(app)/activity/[id].tsx',
    ];

    for (const route of routes) {
      const path = join(src, route);
      assert.ok(existsSync(path), `falta la ruta ${route}`);
      assert.match(readFileSync(path, 'utf8'), /export default/, `${route} debe exportar un componente por defecto`);
    }
  });
});

describe('base de datos y tipos', () => {
  const migrations = readdirSync(join(root, 'supabase', 'migrations')).sort();

  it('las migraciones están numeradas de forma consecutiva desde 001', () => {
    migrations.forEach((name, index) => {
      assert.ok(name.startsWith(String(index + 1).padStart(3, '0') + '_'), `migración fuera de orden: ${name}`);
      assert.ok(name.endsWith('.sql'));
    });
  });

  it('el CHECK de category en SQL coincide con las categorías de la app', () => {
    const sql = readFileSync(join(root, 'supabase', 'migrations', '002_create_activities.sql'), 'utf8');
    const match = sql.match(/category IN \(([^)]*)\)/);
    const inSql = (match?.[1] ?? '').split(',').map((value) => value.trim().replace(/'/g, ''));
    assert.deepEqual([...inSql].sort(), [...ACTIVITY_CATEGORY_LIST].sort());
  });

  it('la migración de categoría personalizada es aditiva y valida nombre, color y par', () => {
    const name = migrations.find((file) => file.includes('custom_category'));
    assert.ok(name, 'falta la migración de categoría personalizada');
    const sql = readFileSync(join(root, 'supabase', 'migrations', name), 'utf8');
    assert.doesNotMatch(sql, /DROP\s|DELETE\s+FROM|TRUNCATE|NOT NULL/i, 'debe ser aditiva y no destructiva');
    assert.match(sql, /custom_category_name\s+text/);
    assert.match(sql, /custom_category_color\s+text/);
    assert.match(sql, /\^#\[0-9A-Fa-f\]\{6\}\$/);
    assert.match(sql, /BETWEEN 1 AND 30/);
    assert.match(sql, /category = 'otro'/);
  });

  it('database.ts declara las columnas de categoría personalizada y RLS sigue definido', () => {
    const types = readFileSync(join(src, 'types', 'database.ts'), 'utf8');
    assert.match(types, /custom_category_name: string \| null/);
    assert.match(types, /custom_category_color: string \| null/);
    const rls = readFileSync(join(root, 'supabase', 'migrations', '004_enable_rls.sql'), 'utf8');
    assert.match(rls, /ENABLE ROW LEVEL SECURITY/i);
  });

  it('la paleta de categorías son colores hex distintos', () => {
    const values = CUSTOM_CATEGORY_COLORS.map((color) => color.value.toLowerCase());
    assert.equal(new Set(values).size, values.length);
    assert.ok(values.every((value) => /^#[0-9a-f]{6}$/.test(value)));
  });
});

describe('configuración de publicación', () => {
  const app = (readJson(join(root, 'app.json')).expo ?? {}) as Record<string, unknown>;
  const pkg = readJson(join(root, 'package.json'));

  it('app.json tiene paquete Android, versionCode entero y versión semántica', () => {
    const android = (app.android ?? {}) as Record<string, unknown>;
    assert.equal(android.package, 'com.kalendaria.app');
    assert.ok(Number.isInteger(android.versionCode) && (android.versionCode as number) >= 1);
    assert.match(String(app.version), /^\d+\.\d+\.\d+$/);
  });

  it('la versión de app.json y package.json coinciden', () => {
    assert.equal(app.version, pkg.version);
  });

  it('existen los scripts que usan la guía de publicación y la auditoría', () => {
    const scripts = (pkg.scripts ?? {}) as Record<string, string>;
    for (const name of ['typecheck', 'test', 'build:apk', 'release:verify', 'db:backup']) {
      assert.ok(scripts[name], `falta el script ${name}`);
    }
  });

  it('los scripts de respaldo y verificación existen', () => {
    assert.ok(existsSync(join(root, 'scripts', 'backup-db.sh')));
    assert.ok(existsSync(join(root, 'scripts', 'verify-apk.sh')));
  });

  it('los recursos referenciados por app.json existen', () => {
    const android = (app.android ?? {}) as { adaptiveIcon?: Record<string, string> };
    const assets = [app.icon, ...Object.values(android.adaptiveIcon ?? {})].filter(
      (value): value is string => typeof value === 'string' && value.startsWith('./'),
    );
    for (const asset of assets) {
      assert.ok(existsSync(join(root, asset)), `falta ${asset}`);
    }
  });
});

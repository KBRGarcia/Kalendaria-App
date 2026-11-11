// Hooks de resolución para ejecutar el código de src/ con `node --test` sin bundler.
// - Resuelve los alias de tsconfig.json (@lib/*, @services/*, ...).
// - Sustituye los módulos que dependen de React Native por mocks en tests/mocks.
// - Añade extensiones .ts/.tsx que Node exige en ESM.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const aliases = [
  ['@components/', join(src, 'components/')],
  ['@hooks/', join(src, 'hooks/')],
  ['@store/', join(src, 'store/')],
  ['@services/', join(src, 'services/')],
  ['@theme/', join(src, 'theme/')],
  ['@lib/', join(src, 'lib/')],
  ['@constants/', join(src, 'constants/')],
  ['@/', src + '/'],
];

const mocks = new Map([
  ['@lib/supabase', join(root, 'tests/mocks/supabase.ts')],
  ['@react-native-async-storage/async-storage', join(root, 'tests/mocks/asyncStorage.ts')],
]);

function withExtension(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, join(path, 'index.ts')]) {
    if (existsSync(candidate) && !candidate.endsWith('/') && candidate.match(/\.(ts|tsx)$/)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (mocks.has(specifier)) {
    return nextResolve(pathToFileURL(mocks.get(specifier)).href, context);
  }

  for (const [prefix, base] of aliases) {
    if (specifier.startsWith(prefix)) {
      const target = withExtension(join(base, specifier.slice(prefix.length)));
      if (target) return nextResolve(pathToFileURL(target).href, context);
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const parent = dirname(fileURLToPath(context.parentURL));
    const target = withExtension(join(parent, specifier));
    if (target) return nextResolve(pathToFileURL(target).href, context);
  }

  return nextResolve(specifier, context);
}

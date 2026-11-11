import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// Expo solo incrusta las variables EXPO_PUBLIC_* cuando se leen de forma estática
// (process.env.EXPO_PUBLIC_X). Una lectura dinámica funciona en desarrollo pero devuelve
// undefined en el APK/AAB de producción y la app se cierra al arrancar.

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const files = sourceFiles(join(import.meta.dirname, '..', 'src'));

function codeOf(path: string): string {
  // Se ignoran los comentarios para no marcar la explicación del propio arreglo.
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('variables de entorno de Expo', () => {
  it('no se leen con process.env[...] ni se desestructuran', () => {
    const offenders = files.filter((file) => {
      const code = codeOf(file);
      return /process\.env\s*\[/.test(code) || /=\s*process\.env\s*;/.test(code) || /\{[^}]*\}\s*=\s*process\.env/.test(code);
    });

    assert.deepEqual(offenders, [], 'Usa process.env.EXPO_PUBLIC_NOMBRE de forma estática');
  });

  it('el cliente de Supabase lee sus dos variables de forma estática', () => {
    const code = codeOf(join(import.meta.dirname, '..', 'src', 'lib', 'supabase.ts'));
    assert.match(code, /process\.env\.EXPO_PUBLIC_SUPABASE_URL/);
    assert.match(code, /process\.env\.EXPO_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import type { Database } from '@/types/database';

// Android limita cada valor de SecureStore a 2048 bytes. La sesión de Supabase
// lo supera, así que se parte en trozos. Sigue siendo SecureStore, no sqlite.
const SECURE_STORE_CHUNK = 1800;

const secureStoreAdapter = {
  getItem(key: string): Promise<string | null> {
    return readStoredValue(key);
  },
  setItem(key: string, value: string): Promise<void> {
    return writeStoredValue(key, value);
  },
  removeItem(key: string): Promise<void> {
    return removeStoredValue(key);
  },
};

function chunkCountKey(key: string): string {
  return `${key}.chunk-count`;
}

function chunkKey(key: string, index: number): string {
  return `${key}.chunk.${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(chunkCountKey(key));
  const count = Number(raw);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function readStoredValue(key: string): Promise<string | null> {
  const count = await readChunkCount(key);
  if (count === 0) {
    return SecureStore.getItemAsync(key);
  }

  const chunks: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const chunk = await SecureStore.getItemAsync(chunkKey(key, index));
    if (chunk === null) {
      return null;
    }

    chunks.push(chunk);
  }

  return chunks.join('');
}

async function writeStoredValue(key: string, value: string): Promise<void> {
  await removeStoredValue(key);

  if (value.length <= SECURE_STORE_CHUNK) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / SECURE_STORE_CHUNK);
  for (let index = 0; index < count; index += 1) {
    const start = index * SECURE_STORE_CHUNK;
    const chunk = value.slice(start, start + SECURE_STORE_CHUNK);
    await SecureStore.setItemAsync(chunkKey(key, index), chunk);
  }

  await SecureStore.setItemAsync(chunkCountKey(key), String(count));
}

async function removeStoredValue(key: string): Promise<void> {
  const count = await readChunkCount(key);
  await deleteIfPresent(key);

  if (count === 0) {
    return;
  }

  await deleteIfPresent(chunkCountKey(key));
  for (let index = 0; index < count; index += 1) {
    await deleteIfPresent(chunkKey(key, index));
  }
}

async function deleteIfPresent(key: string): Promise<void> {
  const current = await SecureStore.getItemAsync(key);
  if (current === null) {
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function readPublicEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

export const supabase = createClient<Database>(
  readPublicEnv('EXPO_PUBLIC_SUPABASE_URL'),
  readPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

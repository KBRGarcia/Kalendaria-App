// Prepara el entorno de pruebas: alias de tsconfig, mocks de módulos nativos y __DEV__.
import { register } from 'node:module';

globalThis.__DEV__ = false;
register('./loader.mjs', import.meta.url);

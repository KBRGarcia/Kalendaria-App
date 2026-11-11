import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { AuthApiError } from '@supabase/supabase-js';

import { authMessages } from '@constants/auth';
import { signIn, signUp } from '@services/authService';
import { AuthRequestError } from '@services/authErrors';
import { mock } from '../tests/mocks/supabase.ts';

describe('authService', () => {
  beforeEach(() => mock.reset());

  it('signIn: credenciales incorrectas → mensaje genérico', async () => {
    mock.respond({ data: {}, error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials') });
    await assert.rejects(
      signIn('a@b.co', 'Incorrecta1'),
      (error: unknown) => error instanceof AuthRequestError && error.userMessage === authMessages.invalidCredentials,
    );
  });

  it('signIn: valida antes de llamar a la red', async () => {
    await assert.rejects(signIn('', ''), (error: unknown) => error instanceof AuthRequestError);
    assert.equal(mock.queue.length, 0);
  });

  it('signIn: un fallo de last_login no impide entrar', async () => {
    mock.respond({ data: {}, error: null }, { data: null, error: { message: 'Network request failed' } });
    await assert.doesNotReject(signIn('a@b.co', 'Correcta1'));
  });

  it('signUp: correo ya registrado (identities vacías) → duplicado', async () => {
    mock.respond({ data: { user: { id: 'u', identities: [] }, session: null }, error: null });
    await assert.rejects(
      signUp('a@b.co', 'Correcta1'),
      (error: unknown) => error instanceof AuthRequestError && error.userMessage === authMessages.duplicateEmail,
    );
  });

  it('signUp: sin sesión (Confirm email activo) → error claro, sin pantallas a medias', async () => {
    mock.respond({ data: { user: { id: 'u', identities: [{}] }, session: null }, error: null });
    await assert.rejects(
      signUp('a@b.co', 'Correcta1'),
      (error: unknown) => error instanceof AuthRequestError && error.userMessage === authMessages.confirmationStillRequired,
    );
  });

  it('signUp: contraseña débil se rechaza localmente', async () => {
    await assert.rejects(
      signUp('a@b.co', 'corta'),
      (error: unknown) => error instanceof AuthRequestError && error.userMessage === authMessages.weakPassword,
    );
    assert.equal(mock.queue.length, 0);
  });

  it('signUp correcto con sesión', async () => {
    mock.respond({ data: { user: { id: 'u', identities: [{}] }, session: { access_token: 't' } }, error: null });
    await assert.doesNotReject(signUp('A@B.co', 'Correcta1'));
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { AuthApiError } from '@supabase/supabase-js';

import { activityMessages } from '@constants/activities';
import { authMessages } from '@constants/auth';
import {
  CUSTOM_CATEGORY_COLORS,
  isCustomCategoryColor,
  resolveCategory,
  type ActivityCategory,
} from '@constants/categories';
import { mock } from '../tests/mocks/supabase.ts';
import * as activities from '@services/activitiesService';
import { parseActivityDraft } from '@services/activityValidation';
import { AuthRequestError, isSessionExpiredError, toAuthError } from '@services/authErrors';
import { assertNewPassword, assertRegistration, assertSignIn, normalizeEmail } from '@services/authValidation';

function messageOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return error instanceof AuthRequestError || error instanceof activities.ActivityRequestError
      ? error.userMessage
      : String(error);
  }
  return undefined;
}

describe('authValidation', () => {
  it('normaliza el correo', () => {
    assert.equal(normalizeEmail('  Ana@Correo.COM '), 'ana@correo.com');
  });

  it('login: exige campos y correo válido', () => {
    assert.equal(messageOf(() => assertSignIn('', 'x')), authMessages.missingFields);
    assert.equal(messageOf(() => assertSignIn('a@b.co', '')), authMessages.missingFields);
    assert.equal(messageOf(() => assertSignIn('sin-arroba', 'x')), authMessages.invalidEmail);
    assert.equal(messageOf(() => assertSignIn('a@b.co', 'x')), undefined);
  });

  it('contraseña: mínimo 8, una letra y un número', () => {
    assert.equal(messageOf(() => assertNewPassword('a@b.co', 'abc1234')), authMessages.weakPassword); // 7
    assert.equal(messageOf(() => assertNewPassword('a@b.co', 'abcdefgh')), authMessages.weakPassword); // sin número
    assert.equal(messageOf(() => assertNewPassword('a@b.co', '12345678')), authMessages.weakPassword); // sin letra
    assert.equal(messageOf(() => assertNewPassword('a@b.co', 'abcdefg1')), undefined);
    assert.equal(messageOf(() => assertNewPassword('a@b.co', 'contraseñaÑ1')), undefined); // letras unicode
  });

  it('registro: campos completos y confirmación igual', () => {
    assert.equal(messageOf(() => assertRegistration('a@b.co', 'abcdefg1', '')), authMessages.incompleteSignUp);
    assert.equal(messageOf(() => assertRegistration('a@b.co', 'abcdefg1', 'abcdefg2')), authMessages.passwordMismatch);
    assert.equal(messageOf(() => assertRegistration('a@b.co', 'abcdefg1', 'abcdefg1')), undefined);
  });
});

describe('categorías personalizadas', () => {
  const base: Record<ActivityCategory, string> = {
    reunion: '#111111',
    pendiente: '#222222',
    trabajo: '#333333',
    personal: '#444444',
    otro: '#555555',
  };

  it('la paleta son hex únicos y válidos', () => {
    const values = CUSTOM_CATEGORY_COLORS.map((color) => color.value);
    assert.equal(new Set(values).size, values.length);
    assert.ok(values.every((value) => /^#[0-9A-Fa-f]{6}$/.test(value) && isCustomCategoryColor(value)));
    assert.equal(isCustomCategoryColor('#000000'), false);
  });

  it('resolveCategory usa nombre y color propios solo en "otro"', () => {
    const color = CUSTOM_CATEGORY_COLORS[2]?.value ?? '';
    assert.deepEqual(
      resolveCategory({ category: 'otro', custom_category_name: 'Gimnasio', custom_category_color: color }, base),
      { label: 'Gimnasio', color },
    );
    assert.deepEqual(
      resolveCategory({ category: 'trabajo', custom_category_name: 'Gimnasio', custom_category_color: color }, base),
      { label: 'Trabajo', color: '#333333' },
    );
  });

  it('filas antiguas o de caché sin los campos se ven como siempre', () => {
    assert.deepEqual(resolveCategory({ category: 'otro' }, base), { label: 'Otro', color: '#555555' });
    assert.deepEqual(resolveCategory({ category: 'desconocida' }, base), { label: 'Otro', color: '#555555' });
    assert.deepEqual(
      resolveCategory({ category: 'otro', custom_category_name: 'X', custom_category_color: '#000000' }, base),
      { label: 'Otro', color: '#555555' },
    );
  });
});

describe('activityValidation', () => {
  it('recorta y convierte nota vacía en null', () => {
    const draft = parseActivityDraft('  Reunión  ', 'reunion', '   ');
    assert.deepEqual(draft, {
      title: 'Reunión',
      category: 'reunion',
      note: null,
      customName: null,
      customColor: null,
    });
  });

  it('"Otro" con nombre y color de la paleta los conserva recortados', () => {
    const color = CUSTOM_CATEGORY_COLORS[0]?.value ?? '';
    const draft = parseActivityDraft('t', 'otro', '', { name: '  Gimnasio ', color });
    assert.equal(draft.customName, 'Gimnasio');
    assert.equal(draft.customColor, color);
  });

  it('"Otro" sin nombre se comporta como el de siempre y descarta el color', () => {
    const color = CUSTOM_CATEGORY_COLORS[0]?.value ?? '';
    const draft = parseActivityDraft('t', 'otro', '', { name: '   ', color });
    assert.equal(draft.customName, null);
    assert.equal(draft.customColor, null);
  });

  it('exige color válido de la paleta y nombre de hasta 30 caracteres', () => {
    const color = CUSTOM_CATEGORY_COLORS[0]?.value ?? '';
    assert.equal(
      messageOf(() => parseActivityDraft('t', 'otro', '', { name: 'Gym', color: null })),
      activityMessages.customColorRequired,
    );
    assert.equal(
      messageOf(() => parseActivityDraft('t', 'otro', '', { name: 'Gym', color: '#123456' })),
      activityMessages.customColorRequired,
    );
    assert.equal(
      messageOf(() => parseActivityDraft('t', 'otro', '', { name: 'a'.repeat(31), color })),
      activityMessages.customNameTooLong,
    );
    assert.equal(messageOf(() => parseActivityDraft('t', 'otro', '', { name: 'a'.repeat(30), color })), undefined);
  });

  it('con otra categoría fuerza nombre y color a null', () => {
    const color = CUSTOM_CATEGORY_COLORS[0]?.value ?? '';
    const draft = parseActivityDraft('t', 'trabajo', '', { name: 'Gym', color });
    assert.equal(draft.customName, null);
    assert.equal(draft.customColor, null);
  });

  it('valida título y nota', () => {
    assert.equal(messageOf(() => parseActivityDraft('   ', 'otro', '')), activityMessages.titleRequired);
    assert.equal(messageOf(() => parseActivityDraft('a'.repeat(101), 'otro', '')), activityMessages.titleTooLong);
    assert.equal(messageOf(() => parseActivityDraft('a'.repeat(100), 'otro', '')), undefined);
    assert.equal(messageOf(() => parseActivityDraft('t', 'otro', 'n'.repeat(501))), activityMessages.noteTooLong);
    assert.equal(messageOf(() => parseActivityDraft('t', 'otro', 'n'.repeat(500))), undefined);
  });
});

describe('authErrors', () => {
  it('traduce códigos de Supabase', () => {
    const invalid = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');
    assert.equal(toAuthError(invalid).userMessage, authMessages.invalidCredentials);

    const dup = new AuthApiError('User already registered', 422, 'user_already_exists');
    assert.equal(toAuthError(dup).userMessage, authMessages.duplicateEmail);

    const weak = new AuthApiError('Password should be...', 422, 'weak_password');
    assert.equal(toAuthError(weak).userMessage, authMessages.weakPassword);

    const rate = new AuthApiError('rate', 429, 'over_request_rate_limit');
    assert.equal(toAuthError(rate).userMessage, authMessages.rateLimit);
  });

  it('el error de credenciales no revela cuál campo falló', () => {
    assert.equal(authMessages.invalidCredentials, 'Correo o contraseña incorrectos.');
  });

  it('detecta falta de conexión', () => {
    assert.equal(toAuthError(new TypeError('Network request failed')).userMessage, authMessages.offline);
    assert.equal(toAuthError(new TypeError('Failed to fetch')).userMessage, authMessages.offline);
  });

  it('detecta sesión expirada', () => {
    assert.ok(isSessionExpiredError(new AuthApiError('x', 401, 'bad_jwt')));
    assert.ok(isSessionExpiredError({ code: 'PGRST301', message: 'JWT expired' }));
    assert.ok(isSessionExpiredError({ message: 'invalid JWT' }));
    assert.equal(isSessionExpiredError(new AuthApiError('x', 400, 'invalid_credentials')), false);
    assert.equal(isSessionExpiredError(new Error('otra cosa')), false);
  });

  it('errores desconocidos dan mensaje genérico', () => {
    assert.equal(toAuthError(new Error('boom')).userMessage, authMessages.generic);
  });
});

describe('activitiesService', () => {
  beforeEach(() => mock.reset());

  it('fetchByMonth consulta el rango del mes y ordena', async () => {
    mock.respond({ data: [{ id: 'a' }], error: null });
    const result = await activities.fetchByMonth(2026, 2);

    assert.equal(result.length, 1);
    const ops = mock.calls[0]?.ops.join(' ') ?? '';
    assert.equal(mock.calls[0]?.table, 'activities');
    assert.match(ops, /gte\("date","2026-02-01"\)/);
    assert.match(ops, /lte\("date","2026-02-28"\)/);
    assert.match(ops, /order\("date",\{"ascending":true\}\)/);
  });

  it('error de red → mensaje offline', async () => {
    mock.respond({ data: null, error: { message: 'TypeError: Network request failed' } });
    await assert.rejects(activities.fetchByMonth(2026, 11), (error: unknown) => activities.isOfflineActivityError(error));
  });

  it('JWT vencido → error de sesión', async () => {
    mock.respond({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } });
    await assert.rejects(activities.fetchByMonth(2026, 11), (error: unknown) => activities.isSessionActivityError(error));
  });

  it('create recorta, usa el usuario actual y guarda nota vacía como null', async () => {
    mock.respond({ data: { id: 'new' }, error: null });
    await activities.create({ date: '2026-11-11', title: '  Hola ', category: 'otro', note: '   ' });
    const ops = mock.calls[0]?.ops.join(' ') ?? '';
    assert.match(ops, /"user_id":"user-1"/);
    assert.match(ops, /"title":"Hola"/);
    assert.match(ops, /"note":null/);
  });

  it('create y update envían la categoría personalizada (o null)', async () => {
    mock.respond({ data: { id: 'new' }, error: null }, { data: { id: 'new' }, error: null });
    await activities.create({
      date: '2026-11-11',
      title: 'x',
      category: 'otro',
      customName: 'Gimnasio',
      customColor: '#D64550',
    });
    await activities.update('new', { title: 'x', category: 'trabajo', note: null });
    const created = mock.calls[0]?.ops.join(' ') ?? '';
    assert.match(created, /"custom_category_name":"Gimnasio"/);
    assert.match(created, /"custom_category_color":"#D64550"/);
    const updated = mock.calls[1]?.ops.join(' ') ?? '';
    assert.match(updated, /"custom_category_name":null/);
    assert.match(updated, /"custom_category_color":null/);
  });

  it('create sin usuario falla con mensaje de guardado', async () => {
    mock.user = null;
    await assert.rejects(
      activities.create({ date: '2026-11-11', title: 'x', category: 'otro' }),
      (error: unknown) => error instanceof activities.ActivityRequestError && error.userMessage === activityMessages.saveFailed,
    );
  });

  it('update filtra por id y remove usa delete + eq', async () => {
    mock.respond({ data: { id: 'a' }, error: null }, { data: null, error: null });
    await activities.update('a', { title: ' T ', category: 'trabajo', note: null });
    await activities.remove('a');
    assert.match(mock.calls[0]?.ops.join(' ') ?? '', /eq\("id","a"\)/);
    assert.match(mock.calls[1]?.ops.join(' ') ?? '', /delete\(\).*eq\("id","a"\)/);
  });

  it('un error de borrado conserva el mensaje correcto', async () => {
    mock.respond({ data: null, error: { message: 'permission denied' } });
    await assert.rejects(
      activities.remove('a'),
      (error: unknown) => error instanceof activities.ActivityRequestError && error.userMessage === activityMessages.deleteFailed,
    );
  });
});

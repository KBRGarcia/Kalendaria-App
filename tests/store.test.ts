import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { activityMessages } from '@constants/activities';
import { authMessages } from '@constants/auth';
import { loadMonthFromCache } from '@lib/cache';
import { consumeSessionNotice } from '@lib/sessionNotice';
import { mock } from '../tests/mocks/supabase.ts';
import { useActivitiesStore } from '@store/activitiesStore';
import type { Activity } from '@/types/activity';

function row(id: string, date: string, overrides: Partial<Activity> = {}): Activity {
  return {
    id,
    user_id: 'user-1',
    date,
    title: `Act ${id}`,
    category: 'otro',
    custom_category_name: null,
    custom_category_color: null,
    note: null,
    created_at: `2026-11-01T10:00:0${id.length}Z`,
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

const store = () => useActivitiesStore.getState();

describe('activitiesStore', () => {
  beforeEach(async () => {
    mock.reset();
    await AsyncStorage.clear();
    store().clearLocalActivities();
  });

  it('fetchMonth agrupa por fecha y guarda en caché', async () => {
    mock.respond({ data: [row('a', '2026-11-03'), row('b', '2026-11-03'), row('c', '2026-11-20')], error: null });
    await store().fetchMonth(2026, 11);

    assert.equal(store().getActivitiesForDate('2026-11-03').length, 2);
    assert.equal(store().getActivitiesForDate('2026-11-20').length, 1);
    assert.equal(store().getActivitiesForDate('2026-11-09').length, 0);
    assert.equal(store().isLoading, false);
    assert.equal(store().error, null);
    assert.equal((await loadMonthFromCache(2026, 11))?.length, 3);
  });

  it('sin conexión usa la caché y marca el error offline', async () => {
    mock.respond({ data: [row('a', '2026-11-03')], error: null });
    await store().fetchMonth(2026, 11);
    store().clearLocalActivities();
    // clearLocalActivities no borra AsyncStorage: simula reabrir la app sin red
    mock.respond({ data: null, error: { message: 'Network request failed' } });
    await store().fetchMonth(2026, 11);

    assert.equal(store().getActivitiesForDate('2026-11-03').length, 1);
    assert.equal(store().error, activityMessages.offline);
    assert.equal(store().isLoading, false);
  });

  it('sin conexión y sin caché muestra el error y no rompe', async () => {
    mock.respond({ data: null, error: { message: 'Network request failed' } });
    await store().fetchMonth(2026, 11);
    assert.equal(store().error, activityMessages.offline);
    assert.deepEqual(store().activitiesByDate, {});
  });

  it('un error genérico no cae a la caché y expone mensaje de carga', async () => {
    mock.respond({ data: null, error: { message: 'boom' } });
    await store().fetchMonth(2026, 11);
    assert.equal(store().error, activityMessages.loadFailed);
  });

  it('revalida en silencio un mes ya cargado (sin spinner)', async () => {
    mock.respond({ data: [row('a', '2026-11-03')], error: null });
    await store().fetchMonth(2026, 11);

    mock.respond({ data: [row('a', '2026-11-03'), row('b', '2026-11-04')], error: null });
    const pending = store().fetchMonth(2026, 11);
    assert.equal(store().isLoading, false, 'no debe mostrar spinner en una revalidación');
    await pending;
    assert.equal(store().getActivitiesForDate('2026-11-04').length, 1);
  });

  it('fetchMonth reemplaza solo el mes pedido', async () => {
    mock.respond({ data: [row('a', '2026-10-31')], error: null }, { data: [row('b', '2026-11-01')], error: null });
    await store().fetchMonth(2026, 10);
    await store().fetchMonth(2026, 11);
    assert.equal(store().getActivitiesForDate('2026-10-31').length, 1);
    assert.equal(store().getActivitiesForDate('2026-11-01').length, 1);
  });

  it('descarta una respuesta vieja si llegó otra petición después', async () => {
    mock.respond({ data: [row('old', '2026-11-03')], error: null }, { data: [row('new', '2026-11-05')], error: null });
    const first = store().fetchMonth(2026, 11);
    const second = store().fetchMonth(2026, 11);
    await Promise.all([first, second]);
    assert.equal(store().getActivitiesForDate('2026-11-03').length, 0);
    assert.equal(store().getActivitiesForDate('2026-11-05').length, 1);
  });

  it('crear, editar y eliminar actualizan estado y caché', async () => {
    mock.respond({ data: row('n', '2026-11-11', { title: 'Nueva' }), error: null });
    await store().createActivity({ date: '2026-11-11', title: 'Nueva', category: 'otro' });
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 1);
    assert.equal((await loadMonthFromCache(2026, 11))?.length, 1);

    mock.respond({ data: row('n', '2026-11-11', { title: 'Editada' }), error: null });
    await store().updateActivity('n', { title: 'Editada', category: 'otro', note: null });
    assert.equal(store().getActivitiesForDate('2026-11-11')[0]?.title, 'Editada');

    mock.respond({ data: null, error: null });
    await store().deleteActivity('n');
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 0);
    assert.equal((await loadMonthFromCache(2026, 11))?.length, 0);
  });

  it('editar la fecha de una actividad la mueve de día', async () => {
    mock.respond({ data: row('m', '2026-11-11'), error: null });
    await store().createActivity({ date: '2026-11-11', title: 'x', category: 'otro' });
    mock.respond({ data: row('m', '2026-11-12'), error: null });
    await store().updateActivity('m', { title: 'x', category: 'otro', note: null });
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 0);
    assert.equal(store().getActivitiesForDate('2026-11-12').length, 1);
  });

  it('un fallo de escritura se propaga y no altera el estado', async () => {
    mock.respond({ data: null, error: { message: 'Network request failed' } });
    await assert.rejects(store().createActivity({ date: '2026-11-11', title: 'x', category: 'otro' }));
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 0);
  });

  it('sesión expirada: cierra sesión local y deja aviso', async () => {
    mock.respond({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } });
    await store().fetchMonth(2026, 11);
    assert.equal(mock.signOutCalls, 1);
    assert.equal(consumeSessionNotice(), authMessages.sessionExpired);
    assert.equal(store().error, null);
  });
});

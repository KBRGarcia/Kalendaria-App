import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearAllCache, loadMonthFromCache, saveMonthToCache } from '@lib/cache';
import {
  buildMonthCells,
  formatDayHeading,
  formatMonthTitle,
  monthPrefix,
  monthRange,
  parseDateKey,
  shiftMonth,
  toDateKey,
} from '@lib/dates';
import type { Activity } from '@/types/activity';

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    user_id: 'user-1',
    date: '2026-11-11',
    title: 'Reunión',
    category: 'reunion',
    custom_category_name: null,
    custom_category_color: null,
    note: null,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

describe('dates', () => {
  it('formatea y parsea claves YYYY-MM-DD', () => {
    assert.equal(toDateKey(new Date(2026, 10, 5)), '2026-11-05');
    assert.equal(parseDateKey('2026-11-05')?.getDate(), 5);
  });

  it('rechaza fechas inexistentes o mal formadas', () => {
    assert.equal(parseDateKey('2026-02-30'), null);
    assert.equal(parseDateKey('2026-13-01'), null);
    assert.equal(parseDateKey('hola'), null);
    assert.equal(parseDateKey('2026-1-5'), null);
  });

  it('shiftMonth no salta febrero desde el día 31', () => {
    const next = shiftMonth(new Date(2026, 0, 31), 1);
    assert.equal(next.getMonth(), 1);
    assert.equal(next.getDate(), 1);
    assert.equal(shiftMonth(new Date(2026, 0, 31), -1).getMonth(), 11);
  });

  it('el grid tiene 42 celdas y empieza en lunes', () => {
    for (const month of [new Date(2026, 1, 1), new Date(2026, 9, 1), new Date(2028, 1, 1), new Date(2026, 10, 1)]) {
      const cells = buildMonthCells(month);
      assert.equal(cells.length, 42);
      assert.equal(cells[0]?.getDay(), 1);
    }
  });

  it('monthRange respeta bisiestos', () => {
    assert.deepEqual(monthRange(2028, 2), { start: '2028-02-01', end: '2028-02-29' });
    assert.deepEqual(monthRange(2026, 2), { start: '2026-02-01', end: '2026-02-28' });
    assert.deepEqual(monthRange(2026, 12), { start: '2026-12-01', end: '2026-12-31' });
    assert.equal(monthPrefix(2026, 3), '2026-03-');
  });

  it('formatea en español', () => {
    assert.equal(formatMonthTitle(new Date(2026, 9, 1)), 'Octubre 2026');
    assert.equal(formatDayHeading(new Date(2026, 9, 14)), 'Miércoles, 14 de octubre de 2026');
  });
});

describe('cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('guarda y recupera un mes', async () => {
    await saveMonthToCache(2026, 11, [activity()]);
    const loaded = await loadMonthFromCache(2026, 11);
    assert.equal(loaded?.length, 1);
    assert.equal(loaded?.[0]?.title, 'Reunión');
  });

  it('devuelve null si no hay caché del mes', async () => {
    assert.equal(await loadMonthFromCache(2026, 12), null);
  });

  it('ignora caché corrupta o con forma inválida', async () => {
    await AsyncStorage.setItem('@kalendaria:cache:activities:2026-11', '{no es json');
    assert.equal(await loadMonthFromCache(2026, 11), null);

    await AsyncStorage.setItem(
      '@kalendaria:cache:activities:2026-11',
      JSON.stringify({ year: 2026, month: 11, cachedAt: 'x', activities: [{ id: 1 }] }),
    );
    assert.equal(await loadMonthFromCache(2026, 11), null);
  });

  it('clearAllCache borra solo las claves de la caché', async () => {
    await saveMonthToCache(2026, 10, [activity()]);
    await saveMonthToCache(2026, 11, [activity()]);
    await AsyncStorage.setItem('@kalendaria:theme', '{"state":{"preference":"dark"}}');

    await clearAllCache();

    assert.equal(await loadMonthFromCache(2026, 10), null);
    assert.equal(await loadMonthFromCache(2026, 11), null);
    assert.ok(await AsyncStorage.getItem('@kalendaria:theme'), 'el tema debe conservarse');
  });
});

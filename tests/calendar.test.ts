import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { activityMessages } from '@constants/activities';
import { loadMonthFromCache } from '@lib/cache';
import {
  buildMonthWeeks,
  formatMonthName,
  formatYearTitle,
  shiftYear,
  toDateKey,
  yearMonths,
  yearPrefix,
  yearRange,
} from '@lib/dates';
import { yearColumns } from '@lib/responsive';
import * as activities from '@services/activitiesService';
import { useActivitiesStore } from '@store/activitiesStore';
import { mock } from '../tests/mocks/supabase.ts';
import type { Activity } from '@/types/activity';

function row(id: string, date: string): Activity {
  return {
    id,
    user_id: 'user-1',
    date,
    title: `Act ${id}`,
    category: 'otro',
    custom_category_name: null,
    custom_category_color: null,
    note: null,
    created_at: `2026-01-01T10:00:0${id.length}Z`,
    updated_at: '2026-01-01T10:00:00Z',
  };
}

const store = () => useActivitiesStore.getState();

describe('vista anual: utilidades de fechas', () => {
  it('yearMonths devuelve los 12 meses del año, día 1', () => {
    const months = yearMonths(2026);
    assert.equal(months.length, 12);
    assert.deepEqual(
      months.map((month) => month.getMonth()),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    );
    assert.ok(months.every((month) => month.getFullYear() === 2026 && month.getDate() === 1));
  });

  it('shiftYear conserva el mes y no se rompe con el 29 de febrero', () => {
    assert.equal(shiftYear(new Date(2026, 10, 15), 1).getFullYear(), 2027);
    assert.equal(shiftYear(new Date(2026, 10, 15), 1).getMonth(), 10);
    const fromLeap = shiftYear(new Date(2028, 1, 29), 1);
    assert.equal(fromLeap.getFullYear(), 2029);
    assert.equal(fromLeap.getMonth(), 1);
    assert.equal(shiftYear(new Date(2026, 0, 1), -1).getFullYear(), 2025);
  });

  it('formatea año y nombre de mes en español', () => {
    assert.equal(formatYearTitle(new Date(2026, 5, 1)), '2026');
    assert.equal(formatMonthName(new Date(2026, 10, 1)), 'Noviembre');
    assert.equal(formatMonthName(new Date(2026, 8, 1)), 'Septiembre');
  });

  it('yearRange y yearPrefix cubren de enero a diciembre', () => {
    assert.deepEqual(yearRange(2026), { start: '2026-01-01', end: '2026-12-31' });
    assert.equal(yearPrefix(2026), '2026-');
  });

  it('buildMonthWeeks contiene exactamente los días del mes, en semanas de 7 que empiezan en lunes', () => {
    for (const [year, month, days] of [
      [2026, 10, 30],
      [2026, 1, 28],
      [2028, 1, 29],
      [2026, 11, 31],
    ] as const) {
      const weeks = buildMonthWeeks(new Date(year, month, 1));
      assert.ok(weeks.every((week) => week.length === 7));
      const real = weeks.flat().filter((day): day is Date => day !== null);
      assert.equal(real.length, days);
      assert.ok(real.every((day) => day.getMonth() === month));
      assert.ok(weeks.every((week) => week.some((day) => day !== null)), 'sin semanas vacías');
    }
  });

  it('buildMonthWeeks coloca el día 1 en su columna (noviembre 2026 empieza en domingo)', () => {
    const first = buildMonthWeeks(new Date(2026, 10, 1))[0];
    assert.ok(first);
    assert.deepEqual(first.slice(0, 6), [null, null, null, null, null, null]);
    assert.equal(first[6] ? toDateKey(first[6]) : null, '2026-11-01');
  });
});

describe('vista anual: diseño responsivo', () => {
  it('3 columnas en teléfonos y 4 en pantallas anchas', () => {
    assert.equal(yearColumns(320), 3);
    assert.equal(yearColumns(360), 3);
    assert.equal(yearColumns(411), 3);
    assert.equal(yearColumns(599), 3);
    assert.equal(yearColumns(600), 4);
    assert.equal(yearColumns(840), 4);
    assert.equal(yearColumns(1280), 4);
  });
});

describe('vista anual: servicio fetchByYear', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('pide el año completo ordenado y por páginas de 1000', async () => {
    mock.respond({ data: [row('a', '2026-01-02')], error: null });
    const result = await activities.fetchByYear(2026);
    assert.equal(result.length, 1);
    const ops = mock.calls[0]?.ops.join(' ') ?? '';
    assert.match(ops, /gte\("date","2026-01-01"\)/);
    assert.match(ops, /lte\("date","2026-12-31"\)/);
    assert.match(ops, /range\(0,999\)/);
  });

  it('sigue pidiendo páginas mientras vengan llenas', async () => {
    const full = Array.from({ length: 1000 }, (_, index) => row(`p${index}`, '2026-03-01'));
    mock.respond({ data: full, error: null }, { data: [row('last', '2026-03-02')], error: null });
    const result = await activities.fetchByYear(2026);
    assert.equal(result.length, 1001);
    assert.equal(mock.calls.length, 2);
    assert.match(mock.calls[1]?.ops.join(' ') ?? '', /range\(1000,1999\)/);
  });

  it('traduce errores de red y de sesión', async () => {
    mock.respond({ data: null, error: { message: 'TypeError: Network request failed' } });
    await assert.rejects(activities.fetchByYear(2026), (error: unknown) => activities.isOfflineActivityError(error));
    mock.respond({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } });
    await assert.rejects(activities.fetchByYear(2026), (error: unknown) => activities.isSessionActivityError(error));
  });
});

describe('vista anual: store fetchYear', () => {
  beforeEach(async () => {
    mock.reset();
    await AsyncStorage.clear();
    store().clearLocalActivities();
  });

  it('agrupa por fecha en los 12 meses y guarda la caché de cada mes', async () => {
    mock.respond({
      data: [row('a', '2026-01-05'), row('b', '2026-06-10'), row('c', '2026-11-11')],
      error: null,
    });
    await store().fetchYear(2026);
    assert.equal(store().getActivitiesForDate('2026-01-05').length, 1);
    assert.equal(store().getActivitiesForDate('2026-06-10').length, 1);
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 1);
    assert.equal((await loadMonthFromCache(2026, 6))?.length, 1);
    assert.equal((await loadMonthFromCache(2026, 7))?.length, 0);
    assert.equal(store().error, null);
    assert.equal(store().isLoading, false);
  });

  it('reemplaza solo el año pedido y conserva otros años', async () => {
    mock.respond({ data: [row('old', '2025-12-31')], error: null });
    await store().fetchYear(2025);
    mock.respond({ data: [row('new', '2026-02-02')], error: null });
    await store().fetchYear(2026);
    assert.equal(store().getActivitiesForDate('2025-12-31').length, 1);
    assert.equal(store().getActivitiesForDate('2026-02-02').length, 1);
  });

  it('una actividad borrada en el servidor desaparece al recargar el año', async () => {
    mock.respond({ data: [row('a', '2026-04-01')], error: null });
    await store().fetchYear(2026);
    mock.respond({ data: [], error: null });
    await store().fetchYear(2026);
    assert.equal(store().getActivitiesForDate('2026-04-01').length, 0);
  });

  it('sin conexión usa la caché de los meses guardados', async () => {
    mock.respond({ data: [row('a', '2026-05-05')], error: null });
    await store().fetchYear(2026);
    store().clearLocalActivities();

    mock.respond({ data: null, error: { message: 'TypeError: Network request failed' } });
    await store().fetchYear(2026);
    assert.equal(store().getActivitiesForDate('2026-05-05').length, 1);
    assert.equal(store().error, activityMessages.offline);
  });

  it('sin conexión y sin caché muestra el error y no rompe', async () => {
    mock.respond({ data: null, error: { message: 'TypeError: Network request failed' } });
    await store().fetchYear(2026);
    assert.equal(store().error, activityMessages.offline);
    assert.equal(store().isLoading, false);
  });

  it('descarta una respuesta vieja si llegó otra petición después', async () => {
    mock.respond({ data: [row('old', '2026-02-01')], error: null }, { data: [row('new', '2026-03-01')], error: null });
    await Promise.all([store().fetchYear(2026), store().fetchYear(2026)]);
    assert.equal(store().getActivitiesForDate('2026-02-01').length, 0);
    assert.equal(store().getActivitiesForDate('2026-03-01').length, 1);
  });

  it('un error genérico se expone sin caer a la caché', async () => {
    mock.respond({ data: null, error: { message: 'boom' } });
    await store().fetchYear(2026);
    assert.equal(store().error, activityMessages.loadFailed);
  });

  it('pasar de la vista anual a la mensual mantiene los datos', async () => {
    mock.respond({ data: [row('a', '2026-11-11')], error: null });
    await store().fetchYear(2026);
    mock.respond({ data: [row('a', '2026-11-11'), row('b', '2026-11-12')], error: null });
    await store().fetchMonth(2026, 11);
    assert.equal(store().getActivitiesForDate('2026-11-11').length, 1);
    assert.equal(store().getActivitiesForDate('2026-11-12').length, 1);
  });
});

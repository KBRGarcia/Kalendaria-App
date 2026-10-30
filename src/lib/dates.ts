import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

const WEEK_STARTS_ON = 1;
const MONTH_CELL_COUNT = 42;
const DATE_KEY = 'yyyy-MM-dd';

export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export function toDateKey(date: Date): string {
  return format(date, DATE_KEY);
}

export function parseDateKey(value: string): Date | null {
  const date = parse(value, DATE_KEY, new Date());
  if (!isValid(date) || toDateKey(date) !== value) {
    return null;
  }

  return date;
}

export function shiftMonth(date: Date, amount: number): Date {
  return addMonths(date, amount);
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return isSameDay(left, right);
}

export function isInCalendarMonth(date: Date, month: Date): boolean {
  return isSameMonth(date, month);
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  const cursor = new Date(year, month - 1, 1);

  return {
    start: format(cursor, DATE_KEY),
    end: format(endOfMonth(cursor), DATE_KEY),
  };
}

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-`;
}

export function buildMonthCells(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start, end });

  while (days.length < MONTH_CELL_COUNT) {
    const last = days[days.length - 1];
    if (!last) {
      break;
    }

    days.push(addDays(last, 1));
  }

  return days;
}

export function formatMonthTitle(date: Date): string {
  return capitalize(format(date, 'LLLL yyyy', { locale: es }));
}

export function formatDayHeading(date: Date): string {
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: es }));
}

export function formatDaySpoken(date: Date): string {
  return format(date, "d 'de' MMMM", { locale: es });
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
}

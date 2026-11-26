import type { BillingCycle } from './billing';

/** A calendar date with no time or time zone, written as "YYYY-MM-DD". */
export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Months added per charge for the month-based cycles. */
const MONTHS_PER_CYCLE: Record<Exclude<BillingCycle, 'weekly'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const MS_PER_DAY = 86_400_000;

/** Earliest year accepted. Anything earlier is a typo, not a real subscription. */
const MIN_YEAR = 1900;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this month. month is 1-12.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parse(date: IsoDate): [number, number, number] {
  const match = ISO_DATE.exec(date);
  if (!match) {
    throw new RangeError(`Date must look like YYYY-MM-DD, got "${date}"`);
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Date.UTC treats years 0-99 as 1900-1999, so very old years would give wrong answers.
  // No subscription is that old: reject them instead of supporting them.
  if (year < MIN_YEAR) {
    throw new RangeError(`"${date}" is before ${MIN_YEAR}`);
  }
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`"${date}" is not a real date`);
  }
  return [year, month, day];
}

function format(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Days since 1970-01-01 for a calendar date, using UTC so time zones never shift it. */
function dayNumber(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/**
 * Checks whether a value is a real calendar date written as "YYYY-MM-DD" (from 1900 onwards).
 *
 * @param value - Anything, for example data read back from storage.
 * @returns True for dates like "2026-01-31"; false for "2026-02-30", "26-1-1", numbers, null and so on.
 */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a JavaScript Date to the calendar date the user sees on their phone.
 * Uses local time on purpose: `toISOString()` uses UTC, which is still yesterday
 * between midnight and 1am in Lagos.
 * @param date - Any JavaScript Date, usually `new Date()`.
 * @returns The local calendar date as "YYYY-MM-DD".
 * @throws RangeError if the Date is invalid (for example `new Date('nonsense')`).
 */

export function toIsoDate(date: Date): IsoDate {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError('Date is invalid');
  }
  return format(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Counts the days from one calendar date to another: 1 for tomorrow, 0 for the same day, -1 for yesterday.
 *
 * @param from - The starting date, "YYYY-MM-DD", usually today.
 * @param to - The other date, "YYYY-MM-DD".
 * @returns Whole days from `from` to `to` (negative if `to` is earlier).
 * @throws RangeError if either date is not a real "YYYY-MM-DD" date, or is before 1900.
 */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return dayNumber(...parse(to)) - dayNumber(...parse(from));
}

/**
 * Works out the next date a subscription charges, on or after today.
 *
 * Month-based cycles keep the day of the first charge where the month allows it:
 * a subscription first charged on 31 January charges on 28 or 29 February,
 * then 31 March again. One that starts on 29 February charges on 28 February in other years.
 *
 * @param firstCharge - The date of the first charge, "YYYY-MM-DD".
 * @param cycle - How often it repeats.
 * @param today - Today's date, "YYYY-MM-DD" (pass it in so the function is testable).
 * @returns The first charge date that is today or later. If today is a charge day, returns today.
 * @throws RangeError if either date is not a real "YYYY-MM-DD" date, or is before 1900.
 */
export function nextChargeDate(firstCharge: IsoDate, cycle: BillingCycle, today: IsoDate): IsoDate {
  const [fy, fm, fd] = parse(firstCharge);
  const [ty, tm, td] = parse(today);
  const start = dayNumber(fy, fm, fd);
  const now = dayNumber(ty, tm, td);
  if (now <= start) {
    return firstCharge;
  }

  if (cycle === 'weekly') {
    const weeks = Math.ceil((now - start) / 7);
    const next = new Date((start + weeks * 7) * MS_PER_DAY);
    return format(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  }

  const step = MONTHS_PER_CYCLE[cycle];
  const occurrence = (n: number): [number, number, number] => {
    const monthIndex = fm - 1 + n * step;
    const year = fy + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    // Always measured from the first charge's day, so 31 Jan → 28 Feb → 31 Mar.
    return [year, month, Math.min(fd, daysInMonth(year, month))];
  };

  // Charges before this one fall in an earlier month than today, so start here.
  let n = Math.floor(((ty - fy) * 12 + (tm - fm)) / step);
  while (dayNumber(...occurrence(n)) < now) {
    n += 1;
  }
  return format(...occurrence(n));
}
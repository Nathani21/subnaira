import { isIsoDate, nextChargeDate, toIsoDate } from '../src/lib/dates';

describe('nextChargeDate', () => {
  it.each([
    // [first charge, cycle, today, expected next charge, what it shows]
    ['2026-01-15', 'monthly', '2026-03-15', '2026-03-15', 'charge due today counts as next'],
    ['2026-01-15', 'monthly', '2026-03-16', '2026-04-15', 'day after a charge moves to next month'],
    ['2026-12-01', 'monthly', '2026-06-01', '2026-12-01', 'before the first charge returns the first charge'],
    ['2026-11-25', 'monthly', '2026-12-26', '2027-01-25', 'rolls over into the next year'],
    ['2026-01-31', 'monthly', '2026-02-01', '2026-02-28', '31st falls back to 28 Feb'],
    ['2026-01-31', 'monthly', '2026-03-01', '2026-03-31', 'back to the 31st after February'],
    ['2028-01-31', 'monthly', '2028-02-10', '2028-02-29', 'leap year February has a 29th'],
    ['2028-02-29', 'yearly', '2029-01-01', '2029-02-28', '29 Feb falls back to 28 Feb in normal years'],
    ['2028-02-29', 'yearly', '2031-06-01', '2032-02-29', 'back to 29 Feb in the next leap year'],
    ['2026-01-31', 'quarterly', '2026-02-01', '2026-04-30', 'quarterly from the 31st lands on 30 April'],
    ['2026-01-31', 'quarterly', '2026-05-01', '2026-07-31', 'and back to 31 July'],
    ['2026-01-01', 'weekly', '2026-01-08', '2026-01-08', 'weekly charge due today'],
    ['2026-01-01', 'weekly', '2026-01-09', '2026-01-15', 'weekly moves 7 days on'],
    ['2026-12-28', 'weekly', '2027-01-01', '2027-01-04', 'weekly across the new year'],
  ] as const)('%s %s, today %s → %s (%s)', (first, cycle, today, expected) => {
    expect(nextChargeDate(first, cycle, today)).toBe(expected);
  });

  it.each(['2026-02-30', '2026-13-01', '26-1-1', '2026-1-5', '0099-12-31', '1899-12-31'])(
    'rejects the invalid date %s',
    (bad) => {
      expect(() => nextChargeDate(bad, 'monthly', '2026-01-01')).toThrow(RangeError);
    },
  );
});

describe('toIsoDate', () => {
  it('uses the local calendar date, not UTC', () => {
    // 12:30am on 5 January local time is still 4 January in UTC when the phone is in Lagos.
    expect(toIsoDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });

  it('rejects an invalid Date', () => {
    expect(() => toIsoDate(new Date(Number.NaN))).toThrow(RangeError);
  });
});

describe('isIsoDate', () => {
  it.each(['2026-01-31', '2028-02-29', '1900-01-01'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-30', '2026-1-5', '1899-12-31', 20260131, null, undefined])('rejects %p', (value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});
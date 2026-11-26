import { daysBetween } from '../src/lib/dates';
import type { SavedData, Subscription } from '../src/lib/subscriptions';
import { summarize } from '../src/lib/summary';

const TODAY = '2026-11-26';

const netflix: Subscription = {
  id: 'netflix',
  name: 'Netflix',
  amount: 1549, // $15.49
  currency: 'USD',
  cycle: 'monthly',
  firstCharge: '2026-01-30',
};
const dstv: Subscription = {
  id: 'dstv',
  name: 'DStv',
  amount: 1_570_000, // ₦15,700
  currency: 'NGN',
  cycle: 'monthly',
  firstCharge: '2026-01-27',
};
const gym: Subscription = {
  id: 'gym',
  name: 'Gym',
  amount: 12_000_000, // ₦120,000 a year
  currency: 'NGN',
  cycle: 'yearly',
  firstCharge: '2026-03-01',
};

function data(subscriptions: Subscription[], rateKoboPerDollar: number | null = 155_050): SavedData {
  return { version: 1, rateKoboPerDollar, subscriptions };
}

describe('summarize', () => {
  it('is empty with no subscriptions', () => {
    expect(summarize(data([]), TODAY)).toEqual({ rows: [], totalMonthlyKobo: 0, missingRate: false });
  });

  it('sorts by next charge, soonest first', () => {
    const { rows } = summarize(data([gym, netflix, dstv]), TODAY);
    expect(rows.map((row) => [row.subscription.id, row.nextCharge, row.daysUntil])).toEqual([
      ['dstv', '2026-11-27', 1],
      ['netflix', '2026-11-30', 4],
      ['gym', '2027-03-01', 95],
    ]);
  });

  it('adds up monthly costs in Naira, converting dollars at the rate', () => {
    const summary = summarize(data([netflix, dstv, gym]), TODAY);
    // Netflix: $15.49 at ₦1,550.50 = ₦24,017.25; DStv ₦15,700; gym ₦120,000 / 12 = ₦10,000.
    expect(summary.rows.find((row) => row.subscription.id === 'netflix')?.monthlyKobo).toBe(2_401_725);
    expect(summary.totalMonthlyKobo).toBe(2_401_725 + 1_570_000 + 1_000_000);
    expect(summary.missingRate).toBe(false);
  });

  it('leaves dollar subscriptions out of the total until a rate is entered', () => {
    const summary = summarize(data([netflix, dstv], null), TODAY);
    expect(summary.missingRate).toBe(true);
    expect(summary.totalMonthlyKobo).toBe(1_570_000);
    expect(summary.rows.find((row) => row.subscription.id === 'netflix')?.monthlyKobo).toBeNull();
  });

  it('does not need a rate when everything is in Naira', () => {
    expect(summarize(data([dstv], null), TODAY).missingRate).toBe(false);
  });

  it('shows a charge due today as 0 days away', () => {
    const [row] = summarize(data([{ ...dstv, firstCharge: '2026-10-26' }]), TODAY).rows;
    expect(row.daysUntil).toBe(0);
  });

  it('puts same-day charges in name order', () => {
    const { rows } = summarize(
      data([
        { ...dstv, id: 'b', name: 'Spotify', firstCharge: '2026-11-27' },
        { ...dstv, id: 'a', name: 'Apple Music', firstCharge: '2026-11-27' },
      ]),
      TODAY,
    );
    expect(rows.map((row) => row.subscription.name)).toEqual(['Apple Music', 'Spotify']);
  });

  it('rejects a total too large to calculate exactly', () => {
    const huge = { ...dstv, amount: Number.MAX_SAFE_INTEGER - 1 };
    expect(() => summarize(data([huge, { ...huge, id: 'huge2' }]), TODAY)).toThrow(RangeError);
  });
});

describe('daysBetween', () => {
  it.each([
    ['2026-11-26', '2026-11-27', 1],
    ['2026-11-26', '2026-11-26', 0],
    ['2026-11-26', '2026-11-25', -1],
    ['2026-12-31', '2027-01-01', 1],
    ['2028-02-28', '2028-03-01', 2], // leap year
  ])('from %s to %s is %i', (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected);
  });

  it('rejects an invalid date', () => {
    expect(() => daysBetween('2026-02-30', '2026-03-01')).toThrow(RangeError);
  });
});
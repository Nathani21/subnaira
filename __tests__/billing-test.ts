import { monthlyCost } from '../src/lib/billing';

describe('monthlyCost', () => {
  it.each([
    ['monthly', 500_000, 500_000], // ₦5,000 a month stays ₦5,000
    ['yearly', 1_200_000, 100_000], // ₦12,000 a year = ₦1,000 a month
    ['quarterly', 300_000, 100_000], // ₦3,000 a quarter = ₦1,000 a month
    ['weekly', 100_000, 433_333], // ₦1,000 a week = ₦4,333.33 a month
  ] as const)('converts a %s charge of %i kobo to %i kobo a month', (cycle, amount, expected) => {
    expect(monthlyCost(amount, cycle)).toBe(expected);
  });

  it('rounds to the nearest kobo', () => {
    expect(monthlyCost(1_000, 'yearly')).toBe(83); // 83.33 → 83
  });

  it('returns 0 for a free subscription', () => {
    expect(monthlyCost(0, 'yearly')).toBe(0);
  });

  it('rejects a negative amount', () => {
    expect(() => monthlyCost(-100, 'monthly')).toThrow(RangeError);
  });

  it('rejects a fraction of a kobo', () => {
    expect(() => monthlyCost(10.5, 'monthly')).toThrow(RangeError);
  });
});
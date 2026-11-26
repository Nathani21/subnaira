import { chargeLabel, cycleLabel, formatAmount } from '../src/lib/labels';

describe('chargeLabel', () => {
  it.each([
    [0, 'Today'],
    [1, 'Tomorrow'],
    [2, 'In 2 days'],
    [95, 'In 95 days'],
  ])('labels %i days as %s', (days, expected) => {
    expect(chargeLabel(days)).toBe(expected);
  });

  it.each([-1, 1.5])('rejects %p days', (days) => {
    expect(() => chargeLabel(days)).toThrow(RangeError);
  });
});

describe('cycleLabel', () => {
  it.each([
    ['weekly', 'a week'],
    ['monthly', 'a month'],
    ['quarterly', 'a quarter'],
    ['yearly', 'a year'],
  ] as const)('describes %s as %s', (cycle, expected) => {
    expect(cycleLabel(cycle)).toBe(expected);
  });
});

describe('formatAmount', () => {
  it.each([
    [1_900_000, 'NGN', '₦19,000.00'],
    [0, 'NGN', '₦0.00'],
    [1549, 'USD', '$15.49'],
    [0, 'USD', '$0.00'],
  ] as const)('formats %i in %s as %s', (amount, currency, expected) => {
    expect(formatAmount(amount, currency)).toBe(expected);
  });

  it.each(['NGN', 'USD'] as const)('rejects a fraction of the smallest unit in %s', (currency) => {
    expect(() => formatAmount(1.5, currency)).toThrow(RangeError);
  });
});
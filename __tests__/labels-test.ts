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
  it('formats Naira from kobo', () => {
    expect(formatAmount(1_900_000, 'NGN')).toBe('₦19,000.00');
  });

  it('formats dollars from cents', () => {
    expect(formatAmount(1549, 'USD')).toBe('$15.49');
  });
});
import { formatCompactNaira, formatNaira } from '../src/lib/money';

describe('formatNaira', () => {
  it.each([
    [0, '₦0.00'],
    [5, '₦0.05'], // 5 kobo
    [99, '₦0.99'],
    [500_000, '₦5,000.00'],
    [123_456_789, '₦1,234,567.89'],
    [-150_000, '-₦1,500.00'], // negative, e.g. a refund
  ])('formats %i kobo as %s', (kobo, expected) => {
    expect(formatNaira(kobo)).toBe(expected);
  });

  it('rejects a fraction of a kobo', () => {
    expect(() => formatNaira(10.5)).toThrow(RangeError);
  });
});

describe('formatCompactNaira', () => {
  it.each([
    [50_000, '₦500.00'], // under ₦1,000 stays exact
    [99_999, '₦999.99'],
    [100_000, '₦1K'], // trailing zeros removed
    [150_000, '₦1.5K'],
    [123_456, '₦1.23K'],
    [123_456_700, '₦1.23M'],
    [99_999_900, '₦1M'], // ₦999,999 would round to "1000K"; moves up to M
    [250_000_000_000, '₦2.5B'],
    [-150_000, '-₦1.5K'],
    [100_500, '₦1.01K'], // ₦1,005: half rounds up (was ₦1K with decimal maths)
    [-100_500, '-₦1.01K'],
    [100_499, '₦1K'], // just under half rounds down
  ])('formats %i kobo as %s', (kobo, expected) => {
    expect(formatCompactNaira(kobo)).toBe(expected);
  });

  it('rejects a fraction of a kobo', () => {
    expect(() => formatCompactNaira(10.5)).toThrow(RangeError);
  });
});
import { formatUsd, toKobo, usdToKobo } from '../src/lib/currency';

describe('usdToKobo', () => {
  it.each([
    [1549, 155_050, 2_401_725], // $15.49 at ₦1,550.50 = ₦24,017.245 → ₦24,017.25 (half rounds up)
    [100, 150_000, 150_000], // $1 at ₦1,500 = ₦1,500
    [2000, 160_000, 3_200_000], // $20 at ₦1,600 = ₦32,000
    [0, 150_000, 0], // free
    [1, 155_050, 1551], // 1 cent = 1,550.5 kobo → 1,551 (half rounds up)
    [1, 155_049, 1550], // 1,550.49 kobo → 1,550 (rounds down)
  ])('converts %i cents at %i kobo/$ to %i kobo', (cents, rate, expected) => {
    expect(usdToKobo(cents, rate)).toBe(expected);
  });

  it.each([
    [-1, 150_000, 'negative amount'],
    [1.5, 150_000, 'fraction of a cent'],
    [100, 0, 'zero rate'],
    [100, -5, 'negative rate'],
    [100, 1.5, 'fraction of a kobo in the rate'],
    [200_000_000_001, 155_050, 'too large to convert exactly'],
  ])('rejects %p cents at %p kobo/$ (%s)', (cents, rate) => {
    expect(() => usdToKobo(cents, rate)).toThrow(RangeError);
  });
});

describe('toKobo', () => {
  it('passes Naira amounts through unchanged', () => {
    expect(toKobo(500_000, 'NGN', 155_050)).toBe(500_000);
  });

  it('converts dollar amounts at the rate', () => {
    expect(toKobo(1549, 'USD', 155_050)).toBe(2_401_725);
  });

  it.each([-1, 1.5])('rejects the invalid Naira amount %p', (kobo) => {
    expect(() => toKobo(kobo, 'NGN', 155_050)).toThrow(RangeError);
  });
});

describe('formatUsd', () => {
  it.each([
    [0, '$0.00'],
    [5, '$0.05'],
    [1549, '$15.49'],
    [123_456_789, '$1,234,567.89'],
    [-500, '-$5.00'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatUsd(cents)).toBe(expected);
  });

  it('rejects a fraction of a cent', () => {
    expect(() => formatUsd(1.5)).toThrow(RangeError);
  });
});
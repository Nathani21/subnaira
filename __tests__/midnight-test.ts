import { msUntilNextMidnight } from '../src/lib/dates';

describe('msUntilNextMidnight', () => {
  it('counts down to the next local midnight', () => {
    // 10pm local time → 2 hours to go.
    expect(msUntilNextMidnight(new Date(2026, 10, 26, 22, 0))).toBe(2 * 60 * 60 * 1000);
  });

  it('handles the last moment of the day', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 26, 23, 59, 59, 500))).toBe(500);
  });

  it('waits a full day when it is exactly midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 27, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });

  it('rejects an invalid Date', () => {
    expect(() => msUntilNextMidnight(new Date(Number.NaN))).toThrow(RangeError);
  });
});
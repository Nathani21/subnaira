import { type Bubble, layoutBubbles } from '../src/lib/bubbles';

const GAP = 4; // the default gap
const TOLERANCE = 1e-6; // allowance for floating-point rounding in positions

/** Fails the test if any bubble leaves the area or two bubbles come closer than the gap. */
function expectTidy(bubbles: Bubble[], width: number, height: number): void {
  for (const [i, a] of bubbles.entries()) {
    expect(a.x - a.r).toBeGreaterThanOrEqual(-TOLERANCE);
    expect(a.y - a.r).toBeGreaterThanOrEqual(-TOLERANCE);
    expect(a.x + a.r).toBeLessThanOrEqual(width + TOLERANCE);
    expect(a.y + a.r).toBeLessThanOrEqual(height + TOLERANCE);
    for (const b of bubbles.slice(i + 1)) {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      expect(distance).toBeGreaterThanOrEqual(a.r + b.r + GAP - TOLERANCE);
    }
  }
}

/** Repeatable "random" numbers, so a failing case can be reproduced. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

describe('layoutBubbles', () => {
  it('returns nothing for no subscriptions', () => {
    expect(layoutBubbles([], 360, 360)).toEqual([]);
  });

  it('makes bubble area proportional to monthly cost', () => {
    const [netflix, spotify] = layoutBubbles(
      [
        { id: 'netflix', monthlyKobo: 800_000 },
        { id: 'spotify', monthlyKobo: 200_000 },
      ],
      360,
      360,
    );
    // 4 times the cost → 4 times the area (r² ratio), so only 2 times the radius.
    expect(netflix.r ** 2 / spotify.r ** 2).toBeCloseTo(4, 9);
  });

  it('keeps the same order as the input', () => {
    const ids = layoutBubbles(
      [
        { id: 'small', monthlyKobo: 100_000 },
        { id: 'big', monthlyKobo: 900_000 },
        { id: 'medium', monthlyKobo: 400_000 },
      ],
      360,
      360,
    ).map((bubble) => bubble.id);
    expect(ids).toEqual(['small', 'big', 'medium']);
  });

  it('raises tiny and free subscriptions to the minimum radius', () => {
    const [, tiny, free] = layoutBubbles(
      [
        { id: 'big', monthlyKobo: 10_000_000 },
        { id: 'tiny', monthlyKobo: 100 },
        { id: 'free', monthlyKobo: 0 },
      ],
      360,
      360,
    );
    expect(tiny.r).toBeCloseTo(22, 9);
    expect(free.r).toBeCloseTo(22, 9);
  });

  it('centres a single bubble and fills the shorter side', () => {
    const [only] = layoutBubbles([{ id: 'only', monthlyKobo: 500_000 }], 360, 600);
    expect(only.x).toBeCloseTo(180, 9);
    expect(only.y).toBeCloseTo(300, 9);
    expect(only.r).toBeCloseTo(178, 6); // half the width, minus half the gap
  });

  it('draws every bubble the same smaller size when too many fit at the minimum', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `sub${i}`, monthlyKobo: (i + 1) * 10_000 }));
    const bubbles = layoutBubbles(many, 360, 360);
    expect(bubbles[0].r).toBeLessThan(22);
    for (const bubble of bubbles) {
      expect(bubble.r).toBeCloseTo(bubbles[0].r, 9);
    }
    expectTidy(bubbles, 360, 360);
  });

  it('never overlaps or leaves the area, across 50 varied layouts', () => {
    const random = seededRandom(42);
    for (let layout = 0; layout < 50; layout += 1) {
      const count = 1 + Math.floor(random() * 25);
      const items = Array.from({ length: count }, (_, i) => ({
        id: `sub${i}`,
        monthlyKobo: Math.floor(random() * (random() < 0.5 ? 10_000 : 100_000_000)),
      }));
      const width = 200 + random() * 400;
      const height = 200 + random() * 700;
      expectTidy(layoutBubbles(items, width, height), width, height);
    }
  });

  it.each([
    [[{ id: 'a', monthlyKobo: -1 }], 360, 'negative cost'],
    [[{ id: 'a', monthlyKobo: 1.5 }], 360, 'fraction of a kobo'],
    [[], 0, 'zero-width area'],
    [[], Number.POSITIVE_INFINITY, 'infinite width'],
  ])('rejects %j at width %p (%s)', (items, width) => {
    expect(() => layoutBubbles(items, width, 360)).toThrow(RangeError);
  });

  it.each([
    [{ gap: -4 }, 'negative gap'],
    [{ gap: Number.NaN }, 'gap that is not a number'],
    [{ minRadius: -1 }, 'negative minimum radius'],
    [{ minRadius: Number.POSITIVE_INFINITY }, 'infinite minimum radius'],
  ])('rejects the option %j (%s)', (options) => {
    expect(() => layoutBubbles([{ id: 'a', monthlyKobo: 100 }], 360, 360, options)).toThrow(RangeError);
  });

  it('accepts a zero gap and zero minimum radius', () => {
    const bubbles = layoutBubbles(
      [
        { id: 'a', monthlyKobo: 500_000 },
        { id: 'b', monthlyKobo: 500_000 },
      ],
      360,
      360,
      { gap: 0, minRadius: 0 },
    );
    const [a, b] = bubbles;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - TOLERANCE);
  });
});
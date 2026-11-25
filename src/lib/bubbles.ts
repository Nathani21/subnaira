import { packEnclose, packSiblings } from 'd3-hierarchy';

/** One subscription to draw as a bubble. */
export interface BubbleInput {
  /** Identifies the subscription, so the screen can match bubbles back to data. */
  id: string;
  /** Monthly cost in kobo (from `monthlyCost`), so every billing cycle compares fairly. */
  monthlyKobo: number;
}

/** A placed bubble, in screen units (pixels). */
export interface Bubble {
  id: string;
  /** Centre, measured from the top-left of the drawing area. */
  x: number;
  y: number;
  /** Radius. */
  r: number;
}

/** Layout options, in screen units. */
export interface BubbleOptions {
  /** Smallest radius, so cheap subscriptions stay big enough to tap. Default 22. */
  minRadius?: number;
  /** Gap between neighbouring bubbles. Default 4. */
  gap?: number;
}

interface Circle {
  id: string;
  r: number;
  x: number;
  y: number;
}

/** Packs circles with the given radii (plus half the gap each) and returns them with their enclosing circle. */
function pack(items: { id: string; base: number }[], scale: number, minRadius: number, gap: number) {
  const circles: Circle[] = items.map((item) => ({
    id: item.id,
    r: Math.max(item.base * scale, minRadius) + gap / 2,
    x: 0,
    y: 0,
  }));
  packSiblings(circles);
  const enclosure = packEnclose(circles);
  return { circles, enclosure };
}

/**
 * Places one bubble per subscription inside a width × height area, packed tightly without overlapping.
 *
 * Bubble *area* is proportional to monthly cost (radius ∝ √cost), so a subscription costing twice as much
 * covers twice the space. Exceptions: bubbles that would be smaller than `minRadius` are raised to it,
 * so they stay tappable; and if there are so many that even minimum-size bubbles don't fit, all bubbles
 * are drawn at the same, smaller size. The biggest bubbles are placed first, near the middle.
 *
 * @param items - The subscriptions, with their monthly cost in kobo.
 * @param width - Width of the drawing area.
 * @param height - Height of the drawing area.
 * @param options - Minimum radius and gap.
 * @returns One bubble per item (same order as `items`), all inside the area.
 * @throws RangeError if a cost is negative or not a whole number, or the area is not positive.
 */
export function layoutBubbles(
  items: BubbleInput[],
  width: number,
  height: number,
  options: BubbleOptions = {},
): Bubble[] {
  const minRadius = options.minRadius ?? 22;
  const gap = options.gap ?? 4;
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError('Width and height must be positive');
  }
  for (const item of items) {
    if (!Number.isInteger(item.monthlyKobo) || item.monthlyKobo < 0) {
      throw new RangeError(`Monthly cost for "${item.id}" must be a whole, non-negative number of kobo`);
    }
  }
  if (items.length === 0) {
    return [];
  }

  // Biggest first, so the largest bubbles sit near the middle.
  const sorted = items
    .map((item) => ({ id: item.id, base: Math.sqrt(item.monthlyKobo) }))
    .sort((a, b) => b.base - a.base);
  const maxBase = sorted[0].base;
  const limit = Math.min(width, height) / 2;

  // Find the largest scale whose packing still fits, by halving the search range each step.
  let low = 0;
  let high = maxBase > 0 ? limit / maxBase : 0;
  let best = pack(sorted, low, minRadius, gap);
  if (maxBase > 0) {
    for (let step = 0; step < 40; step += 1) {
      const middle = (low + high) / 2;
      const attempt = pack(sorted, middle, minRadius, gap);
      if (attempt.enclosure.r <= limit) {
        low = middle;
        best = attempt;
      } else {
        high = middle;
      }
    }
  }

  // Too many bubbles to fit even at the minimum size: make them all the same, smaller size
  // (keeping the gap), by searching for the largest radius that fits.
  if (best.enclosure.r > limit) {
    let small = 0;
    let large = minRadius;
    best = pack(sorted, 0, 0, gap);
    for (let step = 0; step < 40; step += 1) {
      const middle = (small + large) / 2;
      const attempt = pack(sorted, 0, middle, gap);
      if (attempt.enclosure.r <= limit) {
        small = middle;
        best = attempt;
      } else {
        large = middle;
      }
    }
  }

  const { circles, enclosure } = best;
  const byId = new Map(
    circles.map((circle) => [
      circle.id,
      {
        id: circle.id,
        x: width / 2 + (circle.x - enclosure.x),
        y: height / 2 + (circle.y - enclosure.y),
        r: Math.max(circle.r - gap / 2, 0),
      },
    ]),
  );
  return items.map((item) => byId.get(item.id) as Bubble);
}
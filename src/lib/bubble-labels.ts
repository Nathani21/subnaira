import { formatCompactNaira } from './money';

/** Approximate width of one character at the label font size (12px), in screen units. */
const CHAR_WIDTH = 7;
/** Space kept clear inside the bubble edge on each side. */
const PADDING = 6;
/** Bubbles smaller than this show no text: it wouldn't be readable. */
export const MIN_LABEL_RADIUS = 30;
/** Bubbles at least this big also show the monthly amount under the name. */
export const MIN_AMOUNT_RADIUS = 40;

/** What to write inside one bubble. Null means "write nothing on that line". */
export interface BubbleLabel {
  title: string | null;
  amount: string | null;
}

/**
 * Decides what text fits inside a bubble: the name (shortened with "…" if needed) and,
 * for bigger bubbles, the monthly cost in short form like "₦19K".
 *
 * @param name - The subscription name.
 * @param monthlyKobo - Monthly cost in kobo.
 * @param radius - The bubble's radius in screen units.
 * @returns The lines to draw; small bubbles get none (they can still be tapped for details).
 * @throws RangeError if the radius is negative or not finite, or the amount is not a whole number of kobo.
 */
export function bubbleLabel(name: string, monthlyKobo: number, radius: number): BubbleLabel {
  if (!Number.isFinite(radius) || radius < 0) {
    throw new RangeError('Radius must be a finite number, zero or more');
  }
  const amount = formatCompactNaira(monthlyKobo); // also validates the amount
  if (radius < MIN_LABEL_RADIUS) {
    return { title: null, amount: null };
  }
  const maxChars = Math.floor((2 * radius - 2 * PADDING) / CHAR_WIDTH);
  const trimmed = name.trim();
  const title = trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, maxChars - 1).trimEnd()}…`;
  return { title, amount: radius >= MIN_AMOUNT_RADIUS ? amount : null };
}
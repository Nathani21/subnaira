import { divideRoundHalfUp } from './money';

/** How often a subscription renews. */
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * How many months one cycle's charge covers, as a fraction (numerator / denominator).
 * Kept as whole numbers so the maths stays exact until the final rounding.
 */
const PER_MONTH: Record<BillingCycle, [number, number]> = {
  weekly: [52, 12], // 52 charges a year, spread over 12 months
  monthly: [1, 1],
  quarterly: [1, 3],
  yearly: [1, 12],
};

/**
 * Converts a charge into its monthly equivalent.
 *
 * @param amountKobo - The charge in kobo (whole number, never negative). ₦5,000 = 500000.
 * @param cycle - How often the charge repeats.
 * @returns The monthly cost in kobo, rounded to the nearest kobo (halves round up).
 * @throws RangeError if the amount is negative, not a whole number of kobo, or too large to
 * convert exactly (above about ₦1.7 trillion per weekly charge; no real subscription is near this).
 */
export function monthlyCost(amountKobo: number, cycle: BillingCycle): number {
  if (!Number.isInteger(amountKobo) || amountKobo < 0) {
    throw new RangeError('Amount must be a whole, non-negative number of kobo');
  }
  const [numerator, denominator] = PER_MONTH[cycle];
  return divideRoundHalfUp(amountKobo * numerator, denominator);
}
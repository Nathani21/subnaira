import type { BillingCycle } from './billing';
import { type Currency, formatUsd } from './currency';
import { formatNaira } from './money';

/**
 * Describes when the next charge is, for a list: "Today", "Tomorrow" or "In 5 days".
 *
 * @param daysUntil - Whole days from today to the charge (0 or more).
 * @returns A short label.
 * @throws RangeError if `daysUntil` is negative or not a whole number.
 */
export function chargeLabel(daysUntil: number): string {
  if (!Number.isInteger(daysUntil) || daysUntil < 0) {
    throw new RangeError('Days until the charge must be a whole number, 0 or more');
  }
  if (daysUntil === 0) {
    return 'Today';
  }
  if (daysUntil === 1) {
    return 'Tomorrow';
  }
  return `In ${daysUntil} days`;
}

const CYCLE_WORDS: Record<BillingCycle, string> = {
  weekly: 'a week',
  monthly: 'a month',
  quarterly: 'a quarter',
  yearly: 'a year',
};

/**
 * Describes a billing cycle for use after an amount, as in "₦19,000.00 a month".
 *
 * @param cycle - How often the charge repeats.
 * @returns "a week", "a month", "a quarter" or "a year".
 */
export function cycleLabel(cycle: BillingCycle): string {
  return CYCLE_WORDS[cycle];
}

/**
 * Formats an amount in its own currency: kobo as Naira, cents as dollars.
 *
 * @param amount - Whole number in the currency's smallest unit.
 * @param currency - The currency the amount is in.
 * @returns For example "₦19,000.00" or "$15.49".
 * @throws RangeError if the amount is not a whole number.
 */
export function formatAmount(amount: number, currency: Currency): string {
  return currency === 'USD' ? formatUsd(amount) : formatNaira(amount);
}
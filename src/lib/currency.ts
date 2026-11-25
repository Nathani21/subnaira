import { divideRoundHalfUp } from './money';

/** Currencies a subscription can be charged in. */
export type Currency = 'NGN' | 'USD';

/**
 * Converts a dollar amount to kobo at the user's exchange rate.
 *
 * @param amountCents - The charge in US cents (whole number, zero or more). $15.49 = 1549.
 * @param rateKoboPerDollar - Naira per dollar, in kobo (whole number, more than zero). ₦1,550.50 = 155050.
 * @returns The amount in kobo, rounded to the nearest kobo (halves round up).
 * @throws RangeError if either value is not a whole number, the amount is negative, the rate is not positive,
 * or the amount is too large to convert exactly (about $580 million at ₦1,550/$; no real subscription is near this).
 */
export function usdToKobo(amountCents: number, rateKoboPerDollar: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError('Amount must be a whole, non-negative number of cents');
  }
  if (!Number.isInteger(rateKoboPerDollar) || rateKoboPerDollar <= 0) {
    throw new RangeError('Exchange rate must be a whole, positive number of kobo per dollar');
  }
  // cents × (kobo per dollar) ÷ (100 cents per dollar) = kobo.
  return divideRoundHalfUp(amountCents * rateKoboPerDollar, 100);
}

/**
 * Converts a charge in either currency to kobo, so every subscription can be added up in Naira.
 *
 * @param amount - The charge in the currency's smallest unit: kobo for NGN, cents for USD.
 * @param currency - The currency the subscription is charged in.
 * @param rateKoboPerDollar - Naira per dollar, in kobo. Only used for USD.
 * @returns The amount in kobo.
 * @throws RangeError for invalid amounts or rates (see `usdToKobo`); NGN amounts must be whole and non-negative.
 */
export function toKobo(amount: number, currency: Currency, rateKoboPerDollar: number): number {
  if (currency === 'USD') {
    return usdToKobo(amount, rateKoboPerDollar);
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError('Amount must be a whole, non-negative number of kobo');
  }
  return amount;
}

/**
 * Formats US cents as dollars, for example 1549 → "$15.49".
 *
 * @param amountCents - Whole number of cents. Negative amounts get a leading minus.
 * @returns The amount with a dollar sign, thousands separators and two decimals.
 * @throws RangeError if the amount is not a whole number of cents.
 */
export function formatUsd(amountCents: number): string {
  if (!Number.isInteger(amountCents)) {
    throw new RangeError('Amount must be a whole number of cents');
  }
  const sign = amountCents < 0 ? '-' : '';
  const abs = Math.abs(amountCents);
  const dollars = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, '0')}`;
}
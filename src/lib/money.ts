/** The Naira sign, used by every formatter. */
export const NAIRA = '₦';

function assertKobo(amountKobo: number): void {
  if (!Number.isInteger(amountKobo)) {
    throw new RangeError('Amount must be a whole number of kobo');
  }
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats an amount in kobo as exact Naira, for example 500000 → "₦5,000.00".
 *
 * @param amountKobo - Whole number of kobo. Negative amounts get a leading minus.
 * @returns The amount with the Naira sign, thousands separators and two decimals.
 * @throws RangeError if the amount is not a whole number of kobo.
 */
export function formatNaira(amountKobo: number): string {
  assertKobo(amountKobo);
  const sign = amountKobo < 0 ? '-' : '';
  const abs = Math.abs(amountKobo);
  const naira = Math.floor(abs / 100);
  const kobo = abs % 100;
  return `${sign}${NAIRA}${groupThousands(String(naira))}.${String(kobo).padStart(2, '0')}`;
}

/** Compact units in kobo, smallest first: ₦1K = 100,000 kobo. */
const UNITS: [number, string][] = [
  [100_000, 'K'],
  [100_000_000, 'M'],
  [100_000_000_000, 'B'],
];

/**
 * Divides two non-negative whole numbers and rounds halves up, using only
 * whole-number arithmetic so no decimal error can creep in.
 */
function divideRoundHalfUp(numerator: number, denominator: number): number {
  let quotient = Math.floor(numerator / denominator);
  let remainder = numerator - quotient * denominator;
  // Correct the rare case where floating-point division lands one off.
  if (remainder < 0) {
    quotient -= 1;
    remainder += denominator;
  } else if (remainder >= denominator) {
    quotient += 1;
    remainder -= denominator;
  }
  return remainder * 2 >= denominator ? quotient + 1 : quotient;
}

/** Turns hundredths into "1", "1.5" or "1.23" (no trailing zeros). */
function hundredthsToText(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const fraction = hundredths % 100;
  if (fraction === 0) {
    return String(whole);
  }
  return `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
}

/**
 * Formats an amount in kobo in a short form for tight spaces, for example
 * 150000 → "₦1.5K" and 123456700 → "₦1.23M". Amounts under ₦1,000 use the exact form.
 * Rounds halves up, using whole-number arithmetic on kobo.
 *
 * @param amountKobo - Whole number of kobo. Negative amounts get a leading minus.
 * @returns The short form, with at most two decimals and no trailing zeros.
 * @throws RangeError if the amount is not a whole number of kobo.
 */
export function formatCompactNaira(amountKobo: number): string {
  assertKobo(amountKobo);
  const abs = Math.abs(amountKobo);
  if (abs < UNITS[0][0]) {
    return formatNaira(amountKobo);
  }
  let index = UNITS.length - 1;
  while (abs < UNITS[index][0]) {
    index -= 1;
  }
  // Hundredths of the unit, e.g. 100,500 kobo → 101 hundredths of ₦1K → "1.01".
  let hundredths = divideRoundHalfUp(abs * 100, UNITS[index][0]);
  // ₦999,999 rounds to "1000K"; move up to the next unit so it reads "1M".
  if (hundredths >= 100_000 && index < UNITS.length - 1) {
    index += 1;
    hundredths = divideRoundHalfUp(abs * 100, UNITS[index][0]);
  }
  const sign = amountKobo < 0 ? '-' : '';
  return `${sign}${NAIRA}${hundredthsToText(hundredths)}${UNITS[index][1]}`;
}
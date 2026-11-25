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

/** Thresholds for the compact form, smallest first. */
const UNITS: [number, string][] = [
  [1_000, 'K'],
  [1_000_000, 'M'],
  [1_000_000_000, 'B'],
];

function trimDecimals(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Formats an amount in kobo in a short form for tight spaces, for example
 * 150000 → "₦1.5K" and 123456700 → "₦1.23M". Amounts under ₦1,000 use the exact form.
 *
 * @param amountKobo - Whole number of kobo. Negative amounts get a leading minus.
 * @returns The short form, with at most two decimals and no trailing zeros.
 * @throws RangeError if the amount is not a whole number of kobo.
 */
export function formatCompactNaira(amountKobo: number): string {
  assertKobo(amountKobo);
  const naira = Math.abs(amountKobo) / 100;
  if (naira < UNITS[0][0]) {
    return formatNaira(amountKobo);
  }
  let index = UNITS.length - 1;
  while (naira < UNITS[index][0]) {
    index -= 1;
  }
  let rounded = Math.round((naira / UNITS[index][0]) * 100) / 100;
  // 999,999 rounds to "1000K"; move up to the next unit so it reads "1M".
  if (rounded >= 1000 && index < UNITS.length - 1) {
    index += 1;
    rounded = Math.round((naira / UNITS[index][0]) * 100) / 100;
  }
  const sign = amountKobo < 0 ? '-' : '';
  return `${sign}${NAIRA}${trimDecimals(rounded)}${UNITS[index][1]}`;
}
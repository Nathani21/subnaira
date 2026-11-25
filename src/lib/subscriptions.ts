import type { BillingCycle } from './billing';
import type { Currency } from './currency';
import { type IsoDate, isIsoDate } from './dates';

/** One subscription, as the app stores it. */
export interface Subscription {
  /** Unique within the saved data. */
  id: string;
  /** What the user calls it, e.g. "Netflix". */
  name: string;
  /** The charge in the currency's smallest unit: kobo for NGN, cents for USD. */
  amount: number;
  currency: Currency;
  cycle: BillingCycle;
  /** The date of the first charge, "YYYY-MM-DD". */
  firstCharge: IsoDate;
}

/** Everything the app saves on the phone. */
export interface SavedData {
  /** Format version, so a future app version can upgrade old data instead of misreading it. */
  version: 1;
  /** Naira per dollar in kobo (₦1,550.50 = 155050), or null until the user enters one. */
  rateKoboPerDollar: number | null;
  subscriptions: Subscription[];
}

/** Longest subscription name accepted. */
export const MAX_NAME_LENGTH = 60;

const CURRENCIES: readonly Currency[] = ['NGN', 'USD'];
const CYCLES: readonly BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

/** What a fresh install starts with. */
export function emptySavedData(): SavedData {
  return { version: 1, rateKoboPerDollar: null, subscriptions: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSubscription(value: unknown, position: number): Subscription {
  const where = `Subscription ${position + 1}`;
  if (!isRecord(value)) {
    throw new RangeError(`${where} is not an object`);
  }
  const { id, name, amount, currency, cycle, firstCharge } = value;
  if (typeof id !== 'string' || id.length === 0) {
    throw new RangeError(`${where} has no id`);
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new RangeError(`${where} needs a name of 1 to ${MAX_NAME_LENGTH} characters`);
  }
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError(`${where} has an invalid amount`);
  }
  if (!CURRENCIES.includes(currency as Currency)) {
    throw new RangeError(`${where} has an unknown currency`);
  }
  if (!CYCLES.includes(cycle as BillingCycle)) {
    throw new RangeError(`${where} has an unknown billing cycle`);
  }
  if (!isIsoDate(firstCharge)) {
    throw new RangeError(`${where} has an invalid first charge date`);
  }
  // Rebuild the object so unexpected extra fields are dropped.
  return { id, name, amount, currency: currency as Currency, cycle: cycle as BillingCycle, firstCharge };
}

/**
 * Reads saved data back from storage, checking every field.
 *
 * Bad data is reported, never silently replaced, so a bug can't wipe the user's subscriptions.
 *
 * @param json - The stored text, or null if nothing has been saved yet.
 * @returns The saved data, or empty data when nothing was saved.
 * @throws RangeError with a message saying what is wrong if the text is not valid saved data
 * (not JSON, unknown version, bad rate, a bad subscription, or two subscriptions with the same id).
 */
export function parseSavedData(json: string | null): SavedData {
  if (json === null) {
    return emptySavedData();
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new RangeError('Saved data is not valid JSON');
  }
  if (!isRecord(raw)) {
    throw new RangeError('Saved data is not an object');
  }
  if (raw.version !== 1) {
    // Only numbers are shown: String() on an object from JSON can itself throw a TypeError.
    const shown = typeof raw.version === 'number' ? ` ${raw.version}` : '';
    throw new RangeError(`Saved data has an unknown version${shown}`);
  }
  const rate = raw.rateKoboPerDollar;
  if (rate !== null && (typeof rate !== 'number' || !Number.isSafeInteger(rate) || rate <= 0)) {
    throw new RangeError('Saved exchange rate must be null or a whole, positive number of kobo');
  }
  if (!Array.isArray(raw.subscriptions)) {
    throw new RangeError('Saved subscriptions are not a list');
  }
  const subscriptions = raw.subscriptions.map(parseSubscription);
  const seen = new Set<string>();
  for (const subscription of subscriptions) {
    if (seen.has(subscription.id)) {
      throw new RangeError(`Two subscriptions share the id "${subscription.id}"`);
    }
    seen.add(subscription.id);
  }
  return { version: 1, rateKoboPerDollar: rate, subscriptions };
}

/**
 * Turns saved data into text for storage. `parseSavedData` reads it back.
 *
 * @param data - The data to save.
 * @returns JSON text.
 */
export function serializeSavedData(data: SavedData): string {
  return JSON.stringify(data);
}
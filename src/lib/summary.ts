import { monthlyCost } from './billing';
import { toKobo } from './currency';
import { daysBetween, type IsoDate, nextChargeDate } from './dates';
import type { SavedData, Subscription } from './subscriptions';

/** One subscription, ready to show in a list. */
export interface SubscriptionRow {
  subscription: Subscription;
  /** The next charge on or after today, "YYYY-MM-DD". */
  nextCharge: IsoDate;
  /** Days from today to the next charge: 0 means today. */
  daysUntil: number;
  /** Monthly cost in kobo, or null for a dollar subscription when no exchange rate has been entered. */
  monthlyKobo: number | null;
}

/** Everything the home screen needs. */
export interface Summary {
  /** Soonest charge first; same-day charges in name order. */
  rows: SubscriptionRow[];
  /** Total monthly cost in kobo of every subscription that could be converted. */
  totalMonthlyKobo: number;
  /** True when dollar subscriptions are left out of the total because no exchange rate has been entered. */
  missingRate: boolean;
}

/**
 * Works out what to show on the home screen: each subscription's next charge and monthly cost,
 * sorted soonest first, and the monthly total in Naira.
 *
 * Dollar amounts are converted to kobo at the saved rate first, then spread over a month.
 *
 * @param data - The saved data (rate and subscriptions).
 * @param today - Today's date, "YYYY-MM-DD" (passed in so the function is testable).
 * @returns The rows, the total, and whether a missing rate left anything out.
 * @throws RangeError if a date is invalid, or an amount or the total is too large to calculate exactly.
 */
export function summarize(data: SavedData, today: IsoDate): Summary {
  let totalMonthlyKobo = 0;
  let missingRate = false;
  const rows = data.subscriptions.map((subscription): SubscriptionRow => {
    const nextCharge = nextChargeDate(subscription.firstCharge, subscription.cycle, today);
    let monthlyKobo: number | null = null;
    if (subscription.currency === 'USD' && data.rateKoboPerDollar === null) {
      missingRate = true;
    } else {
      const chargeKobo = toKobo(subscription.amount, subscription.currency, data.rateKoboPerDollar ?? 1);
      monthlyKobo = monthlyCost(chargeKobo, subscription.cycle);
      totalMonthlyKobo += monthlyKobo;
    }
    return { subscription, nextCharge, daysUntil: daysBetween(today, nextCharge), monthlyKobo };
  });
  if (!Number.isSafeInteger(totalMonthlyKobo)) {
    throw new RangeError('The monthly total is too large to calculate exactly');
  }
  rows.sort(
    (a, b) => a.daysUntil - b.daysUntil || a.subscription.name.localeCompare(b.subscription.name),
  );
  return { rows, totalMonthlyKobo, missingRate };
}
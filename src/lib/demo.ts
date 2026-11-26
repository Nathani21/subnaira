import type { SavedData } from './subscriptions';

/**
 * Sample subscriptions so anyone can try the app before adding their own.
 * The amounts and the exchange rate are made-up examples, not real prices.
 *
 * @returns Saved data with six example subscriptions (dollar and Naira, every billing cycle but quarterly).
 */
export function demoData(): SavedData {
  return {
    version: 1,
    rateKoboPerDollar: 150_000, // ₦1,500 per dollar, an example rate
    subscriptions: [
      { id: 'demo-netflix', name: 'Netflix', amount: 1549, currency: 'USD', cycle: 'monthly', firstCharge: '2026-01-05' },
      { id: 'demo-chatgpt', name: 'ChatGPT Plus', amount: 2000, currency: 'USD', cycle: 'monthly', firstCharge: '2026-02-14' },
      { id: 'demo-icloud', name: 'iCloud+', amount: 99, currency: 'USD', cycle: 'monthly', firstCharge: '2026-03-21' },
      { id: 'demo-dstv', name: 'DStv', amount: 1_900_000, currency: 'NGN', cycle: 'monthly', firstCharge: '2026-01-28' },
      { id: 'demo-data', name: 'Mobile data', amount: 350_000, currency: 'NGN', cycle: 'weekly', firstCharge: '2026-01-03' },
      { id: 'demo-gym', name: 'Gym', amount: 15_000_000, currency: 'NGN', cycle: 'yearly', firstCharge: '2026-06-01' },
    ],
  };
}
import {
  emptySavedData,
  MAX_NAME_LENGTH,
  parseSavedData,
  type SavedData,
  serializeSavedData,
} from '../src/lib/subscriptions';

const netflix = {
  id: 'sub-1',
  name: 'Netflix',
  amount: 1549, // $15.49
  currency: 'USD',
  cycle: 'monthly',
  firstCharge: '2026-01-31',
};

/** Saved data as text, with one subscription changed or extra fields set. */
function saved(overrides: Record<string, unknown> = {}, subscription: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    rateKoboPerDollar: 155_050,
    subscriptions: [{ ...netflix, ...subscription }],
    ...overrides,
  });
}

describe('parseSavedData', () => {
  it('starts empty when nothing has been saved', () => {
    expect(parseSavedData(null)).toEqual(emptySavedData());
  });

  it('reads back exactly what was saved', () => {
    const data: SavedData = {
      version: 1,
      rateKoboPerDollar: 155_050,
      subscriptions: [
        { id: 'sub-1', name: 'Netflix', amount: 1549, currency: 'USD', cycle: 'monthly', firstCharge: '2026-01-31' },
        { id: 'sub-2', name: 'DStv', amount: 1_570_000, currency: 'NGN', cycle: 'monthly', firstCharge: '2026-02-01' },
      ],
    };
    expect(parseSavedData(serializeSavedData(data))).toEqual(data);
  });

  it('accepts a missing exchange rate (null)', () => {
    expect(parseSavedData(saved({ rateKoboPerDollar: null })).rateKoboPerDollar).toBeNull();
  });

  it('drops unexpected extra fields', () => {
    const [subscription] = parseSavedData(saved({}, { colour: 'red' })).subscriptions;
    expect(subscription).toEqual(netflix);
  });

  it.each([
    ['not JSON', 'oops'],
    ['not an object', '[]'],
    ['unknown version', saved({ version: 2 })],
    ['version that is an object', saved({ version: { toString: null } })],
    ['zero exchange rate', saved({ rateKoboPerDollar: 0 })],
    ['fractional exchange rate', saved({ rateKoboPerDollar: 1550.5 })],
    ['subscriptions not a list', saved({ subscriptions: {} })],
    ['subscription not an object', saved({ subscriptions: ['Netflix'] })],
    ['empty id', saved({}, { id: '' })],
    ['blank name', saved({}, { name: '   ' })],
    ['name too long', saved({}, { name: 'x'.repeat(MAX_NAME_LENGTH + 1) })],
    ['negative amount', saved({}, { amount: -1 })],
    ['fractional amount', saved({}, { amount: 15.49 })],
    ['amount as text', saved({}, { amount: '1549' })],
    ['unknown currency', saved({}, { currency: 'EUR' })],
    ['unknown cycle', saved({}, { cycle: 'daily' })],
    ['impossible date', saved({}, { firstCharge: '2026-02-30' })],
    ['duplicate ids', saved({ subscriptions: [netflix, { ...netflix, name: 'Netflix again' }] })],
  ])('rejects %s', (_reason, json) => {
    expect(() => parseSavedData(json)).toThrow(RangeError);
  });
});
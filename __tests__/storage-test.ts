import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadData, saveData, STORAGE_KEY } from '../src/data/storage';
import { emptySavedData, type SavedData } from '../src/lib/subscriptions';

// The real AsyncStorage needs a phone; tests use the in-memory version the library provides.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const data: SavedData = {
  version: 1,
  rateKoboPerDollar: 155_050,
  subscriptions: [
    { id: 'sub-1', name: 'Netflix', amount: 1549, currency: 'USD', cycle: 'monthly', firstCharge: '2026-01-31' },
  ],
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage', () => {
  it('loads empty data on first launch', async () => {
    await expect(loadData()).resolves.toEqual(emptySavedData());
  });

  it('loads back what was saved', async () => {
    await saveData(data);
    await expect(loadData()).resolves.toEqual(data);
  });

  it('reports corrupt stored data and leaves it untouched', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'oops');
    await expect(loadData()).rejects.toThrow(RangeError);
    await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBe('oops');
  });

  it('refuses to save invalid data and keeps what was stored', async () => {
    await saveData(data);
    await expect(saveData({ ...data, rateKoboPerDollar: -1 })).rejects.toThrow(RangeError);
    await expect(loadData()).resolves.toEqual(data);
  });
  
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'refuses a %p exchange rate instead of saving it as null',
    async (rate) => {
      await saveData(data);
      await expect(saveData({ ...data, rateKoboPerDollar: rate })).rejects.toThrow(RangeError);
      await expect(loadData()).resolves.toEqual(data);
    },
  );
});
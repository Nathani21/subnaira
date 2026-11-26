import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseSavedData, type SavedData, serializeSavedData } from '../lib/subscriptions';

/** The one key all app data is saved under. Changing it would make existing data look missing. */
export const STORAGE_KEY = 'subnaira/data';

/**
 * Loads the app's data from the phone.
 *
 * @returns The saved data, or empty data on first launch.
 * @throws RangeError if the stored data is corrupt (see `parseSavedData`). The stored data is left
 * untouched so nothing is lost. Errors from the storage itself are passed on.
 */
export async function loadData(): Promise<SavedData> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return parseSavedData(json);
}

/**
 * Saves the app's data to the phone, replacing what was there.
 * Runs the same checks as loading first, so invalid data is never written.
 *
 * @param data - Everything the app saves.
 * @throws RangeError if the data is invalid (nothing is written). Errors from the storage itself are passed on.
 */
export async function saveData(data: SavedData): Promise<void> {
  // Checked before serializing: JSON.stringify quietly turns NaN and Infinity into null,
  // and null is a valid rate ("not entered yet"), so the check after would miss them.
  const rate = data.rateKoboPerDollar;
  if (rate !== null && (!Number.isSafeInteger(rate) || rate <= 0)) {
    throw new RangeError('Exchange rate must be null or a whole, positive number of kobo');
  }
  const json = serializeSavedData(data);
  parseSavedData(json);
  await AsyncStorage.setItem(STORAGE_KEY, json);
}
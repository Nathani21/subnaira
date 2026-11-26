import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadData, saveData } from '@/data/storage';
import type { SavedData } from '@/lib/subscriptions';

/** What a screen should show for the app's saved data. */
export type SavedDataState =
  | { status: 'loading' }
  | { status: 'ready'; data: SavedData }
  | { status: 'error'; message: string };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

/**
 * Loads the app's saved data every time the screen comes into view, and saves changes.
 *
 * @returns The current state, and `save` to replace the saved data.
 */
export function useSavedData() {
  const [state, setState] = useState<SavedDataState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      // Ignore a result that arrives after the screen has lost focus.
      let active = true;
      loadData().then(
        (data) => {
          if (active) {
            setState({ status: 'ready', data });
          }
        },
        (error: unknown) => {
          if (active) {
            setState({
              status: 'error',
              message: `Your saved data couldn't be read (${errorText(error)}). Nothing has been changed or deleted.`,
            });
          }
        },
      );
      return () => {
        active = false;
      };
    }, []),
  );

  const save = useCallback(async (data: SavedData) => {
    try {
      await saveData(data);
      setState({ status: 'ready', data });
    } catch (error) {
      setState({ status: 'error', message: `Couldn't save your changes (${errorText(error)}).` });
    }
  }, []);

  return { state, save };
}
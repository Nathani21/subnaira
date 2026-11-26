import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { type IsoDate, msUntilNextMidnight, toIsoDate } from '@/lib/dates';

/**
 * Today's date on the phone's clock, kept current: it updates just after midnight, and whenever
 * the app comes back to the foreground (phones pause timers while an app is in the background).
 *
 * @returns Today's date, "YYYY-MM-DD".
 */
export function useToday(): IsoDate {
  const [today, setToday] = useState(() => toIsoDate(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // One clock reading per update, so the stored date and the timer delay always agree.
    const sync = () => {
      const now = new Date();
      setToday(toIsoDate(now));
      clearTimeout(timer);
      // One second after midnight, so the clock has definitely moved to the new day.
      timer = setTimeout(sync, msUntilNextMidnight(now) + 1000);
    };
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
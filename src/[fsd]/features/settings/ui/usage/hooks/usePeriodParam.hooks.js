import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

/**
 * Syncs the selected billing period with the URL as ?period=YYYYMM.
 * Falls back to availablePeriods[0] when the URL value is absent or invalid.
 */
export const usePeriodParam = (availablePeriods = []) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo(() => {
    const urlPeriod = searchParams.get('period');

    if (urlPeriod && (!availablePeriods.length || availablePeriods.includes(urlPeriod))) {
      return urlPeriod;
    }

    return availablePeriods[0] ?? null;
  }, [searchParams, availablePeriods]);

  const setPeriod = useCallback(
    newPeriod => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);

          if (newPeriod) {
            next.set('period', newPeriod);
          } else {
            next.delete('period');
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { period, setPeriod };
};

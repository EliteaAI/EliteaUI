import { useMemo } from 'react';

import { useTheme } from '@emotion/react';

import { CONTEXT_BUDGET } from '../constants';

/**
 * Hook to calculate and manage context utilization state
 */
export const useContextUtilization = utilization => {
  const theme = useTheme();

  const utilizationData = useMemo(() => {
    const percentage = Math.round(utilization * 100);
    const isHigh = utilization >= CONTEXT_BUDGET.HIGH_UTILIZATION_THRESHOLD;

    const color = isHigh ? theme.palette.warning.yellow : theme.palette.success.main;

    return {
      percentage,
      isHigh,
      color,
    };
  }, [utilization, theme.palette]);

  return utilizationData;
};

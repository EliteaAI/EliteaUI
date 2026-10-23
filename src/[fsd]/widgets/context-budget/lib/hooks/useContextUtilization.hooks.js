import { useMemo } from 'react';

import { useTheme } from '@mui/material';

import { CONTEXT_BUDGET } from '../constants';

/**
 * Utilization state: warning from the compaction threshold (90% of usable input), error at usable input.
 */
export const useContextUtilization = (utilization, currentTokens, budget = {}) => {
  const theme = useTheme();
  const { usableInput, compactionThreshold } = budget;

  const utilizationData = useMemo(() => {
    const percentage = Math.round((utilization || 0) * 100);
    const warningAt =
      compactionThreshold ?? (usableInput ? usableInput * CONTEXT_BUDGET.COMPACTION_RATIO : null);
    const isError = usableInput
      ? currentTokens >= usableInput
      : utilization >= CONTEXT_BUDGET.HIGH_UTILIZATION_THRESHOLD;
    const isHigh = isError || (warningAt ? currentTokens >= warningAt : false);

    const color = isError
      ? theme.palette.error.main
      : isHigh
        ? theme.palette.warning.high
        : theme.palette.success.main;

    return {
      percentage,
      isHigh,
      isError,
      color,
    };
  }, [utilization, currentTokens, usableInput, compactionThreshold, theme.palette]);

  return utilizationData;
};

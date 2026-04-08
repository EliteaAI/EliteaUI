import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import { ContextBudgetStatsDisplay } from '@/[fsd]/widgets/ContextBudget/ui';

/**
 * Shared tooltip content for context budget components.
 * Displays stats and optional high utilization warning.
 */
const ContextBudgetTooltipContent = memo(props => {
  const { stats, isHighUtilization } = props;

  const styles = contextBudgetTooltipContentStyles();

  return (
    <Box sx={styles.tooltipContent}>
      <Typography
        variant="labelSmall"
        sx={styles.tooltipTitle}
      >
        Context Budget
      </Typography>
      <ContextBudgetStatsDisplay
        stats={stats}
        showTokens
        labelStyle={styles.tooltipText}
        valueStyle={styles.tooltipText}
      />
      {isHighUtilization && (
        <Box sx={styles.tooltipWarningSection}>
          <Typography
            variant="labelSmall"
            sx={styles.tooltipTitle}
          >
            Attention!
          </Typography>
          <Typography
            variant="labelSmall"
            sx={styles.tooltipText}
          >
            {CONTEXT_MESSAGES.HIGH_USAGE_WARNING}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

ContextBudgetTooltipContent.displayName = 'ContextBudgetTooltipContent';

/** @type {MuiSx} */
const contextBudgetTooltipContentStyles = () => ({
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  tooltipTitle: {
    fontWeight: 700,
  },
  tooltipText: {
    fontWeight: 500,
  },
  tooltipWarningSection: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
});

export default ContextBudgetTooltipContent;

import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { TOOLTIP_CONFIG } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import { ContextBudgetTooltipContent } from '@/[fsd]/widgets/ContextBudget/ui';

/**
 * Collapsed view of context budget - shows minimal info with tooltip
 */
const ContextBudgetCollapsed = memo(props => {
  const { stats, isHighUtilization } = props;

  const styles = contextBudgetCollapsedStyles(isHighUtilization);

  return (
    <Tooltip
      title={
        <ContextBudgetTooltipContent
          stats={stats}
          isHighUtilization={isHighUtilization}
        />
      }
      placement={TOOLTIP_CONFIG.COLLAPSED.placement}
      slotProps={{
        tooltip: { sx: styles.tooltipWrapper },
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: { offset: TOOLTIP_CONFIG.COLLAPSED.offset },
            },
          ],
        },
      }}
    >
      <Box sx={styles.container}>
        <Box sx={styles.percentageWrapper}>
          <Typography
            variant="caption"
            sx={styles.percentageText}
          >
            {stats.utilizationPercentage}%
          </Typography>
        </Box>
        <Box sx={styles.lineContainer}>
          <Box sx={styles.lineIndicator} />
        </Box>
      </Box>
    </Tooltip>
  );
});

ContextBudgetCollapsed.displayName = 'ContextBudgetCollapsed';

/** @type {MuiSx} */
const contextBudgetCollapsedStyles = isHighUtilization => {
  // Use the same color as the progress bar
  const indicatorColor = isHighUtilization ? '#FFC107' : '#0FA52D';

  return {
    tooltipWrapper: ({ palette }) => ({
      backgroundColor: palette.background.tooltip.default,
      color: palette.text.tooltip,
      padding: '0.3rem 0.4rem',
      borderRadius: '0.25rem',
      maxWidth: TOOLTIP_CONFIG.COLLAPSED.maxWidth,
    }),
    container: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.2rem',
      cursor: 'pointer',
    },
    percentageWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentageText: ({ palette }) => ({
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: '1rem',
      color: palette.text.secondary,
    }),
    lineContainer: {
      width: '2.25rem',
      height: '0.1875rem',
    },
    lineIndicator: {
      width: '100%',
      height: '100%',
      borderRadius: '0.25rem',
      backgroundColor: indicatorColor,
      opacity: 1,
    },
  };
};

export default ContextBudgetCollapsed;

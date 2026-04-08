import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { CONTEXT_MESSAGES, TOOLTIP_CONFIG } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import { useTheme } from '@emotion/react';

/**
 * Progress bar section showing token usage and utilization percentage
 */
const ContextBudgetProgress = memo(props => {
  const { tokensDisplay, utilizationPercentage, isHighUtilization } = props;

  const theme = useTheme();
  const progressPercentage = Math.min(utilizationPercentage, 100); // Cap progress bar at 100%
  const styles = contextBudgetProgressStyles(theme, isHighUtilization);

  return (
    <Box sx={styles.progressSection}>
      <Box sx={styles.progressHeader}>
        <Typography
          variant="bodySmall2"
          sx={styles.tokensText}
        >
          {tokensDisplay} tokens
        </Typography>
        <Box sx={styles.percentageWrapper}>
          <Typography
            variant="bodySmall2"
            sx={styles.percentageText}
          >
            {utilizationPercentage}%
          </Typography>
          {isHighUtilization && (
            <Tooltip
              placement={TOOLTIP_CONFIG.ATTENTION.placement}
              title={CONTEXT_MESSAGES.HIGH_USAGE_WARNING}
              slotProps={{
                tooltip: { sx: styles.attentionTooltip },
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: { offset: TOOLTIP_CONFIG.ATTENTION.offset },
                    },
                  ],
                },
              }}
            >
              <Box sx={styles.attentionIconWrapper}>
                <AttentionIcon
                  width={16}
                  height={16}
                  fill={theme.palette.warning.yellow}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box sx={styles.progressBarWrapper}>
        <Box sx={styles.progressBarBackground}>
          <Box sx={styles.progressBarFill(progressPercentage)} />
        </Box>
      </Box>
    </Box>
  );
});

ContextBudgetProgress.displayName = 'ContextBudgetProgress';

/** @type {MuiSx} */
const contextBudgetProgressStyles = (theme, isHighUtilization) => {
  const isDarkMode = theme.palette.mode === 'dark';

  // Define gradient colors based on utilization
  const progressGradient = isHighUtilization
    ? 'linear-gradient(90deg, rgba(255, 193, 7, 0) 0%, #FFC107 100%)'
    : 'linear-gradient(90deg, rgba(19, 225, 60, 0) 0%, #0FA52D 100%)';

  // Background color for progress bar
  const backgroundColor = isDarkMode ? theme.palette.border.lines : '#3D44561A';

  return {
    progressSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '0.5rem 1rem',
      gap: '0.25rem',
      alignSelf: 'stretch',
    },
    progressHeader: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 0,
      alignSelf: 'stretch',
    },
    tokensText: ({ palette }) => ({
      color: palette.text.secondary,
    }),
    percentageWrapper: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 0,
      gap: '0.25rem',
      height: '1.25rem',
    },
    percentageText: ({ palette }) => ({
      color: palette.text.secondary,
    }),
    attentionIconWrapper: {
      display: 'flex',
    },
    attentionTooltip: ({ palette }) => ({
      backgroundColor: palette.background.tooltip.default,
      color: palette.text.tooltip,
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      maxWidth: TOOLTIP_CONFIG.ATTENTION.maxWidth,
      fontSize: '0.75rem',
      lineHeight: '1.25rem',
    }),
    progressBarWrapper: {
      height: '0.375rem',
      alignSelf: 'stretch',
      position: 'relative',
    },
    progressBarBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor,
      borderRadius: '0.3125rem',
    },
    progressBarFill: percentage => ({
      position: 'absolute',
      width: `${percentage}%`,
      left: 0,
      top: 0,
      bottom: 0,
      background: progressGradient,
      borderRadius: '0.3125rem',
    }),
  };
};

export default ContextBudgetProgress;

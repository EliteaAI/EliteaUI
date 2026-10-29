import { memo } from 'react';

import { Box, Typography, alpha, useTheme } from '@mui/material';

import { CONTEXT_BUDGET_COLORS } from '@/[fsd]/shared/config/theme';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Progress section: used tokens out of the available window (centered, with the reserve explained
 * in a tooltip), the utilization percentage and the bar.
 */
const ContextBudgetProgress = memo(props => {
  const { stats, utilizationPercentage, isHighUtilization } = props;
  const { currentTokensDisplay, maxTokensDisplay, effectiveWindow, safetyMargin, manualMaxContextTokens } =
    stats;

  const theme = useTheme();
  const progressPercentage = Math.min(utilizationPercentage, 100); // Cap progress bar at 100%
  const styles = contextBudgetProgressStyles(theme, isHighUtilization);

  const hasWindowBreakdown = effectiveWindow > 0 && safetyMargin > 0;

  return (
    <Box sx={styles.progressSection}>
      <Box sx={styles.progressHeader}>
        <Box
          sx={styles.tokensWrapper}
          data-testid="context-budget-tokens"
        >
          <Typography
            variant="headingSmall"
            sx={styles.tokensUsed}
          >
            {currentTokensDisplay}
          </Typography>
          <Typography
            variant="labelSmall"
            sx={styles.tokensText}
          >
            of {maxTokensDisplay} tokens{manualMaxContextTokens ? ' (manual)' : ''}
          </Typography>
          {hasWindowBreakdown && (
            <InfoTooltip
              infoTooltip={CONTEXT_WINDOW_COPY.AVAILABLE_TOKENS_TOOLTIP}
              testId="context-budget-available-tokens-info"
            />
          )}
        </Box>
        <Typography
          variant="headingSmall"
          sx={styles.percentageText}
          data-testid="context-budget-percentage"
        >
          {utilizationPercentage}%
        </Typography>
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
  const endColor = isHighUtilization
    ? CONTEXT_BUDGET_COLORS.highUtilization
    : CONTEXT_BUDGET_COLORS.normalUtilization;
  const startRgba = alpha(endColor, 0);

  const progressGradient = `linear-gradient(90deg, ${startRgba} 0%, ${endColor} 100%)`;
  const backgroundColor = theme.palette.border.lines;

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
    tokensWrapper: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '0.375rem',
    },
    tokensUsed: ({ palette }) => ({
      color: palette.text.secondary,
    }),
    tokensText: ({ palette }) => ({
      color: palette.text.primary,
    }),
    percentageText: ({ palette }) => ({
      color: palette.text.secondary,
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

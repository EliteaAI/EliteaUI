import { memo, useMemo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/context-budget/lib/constants';
import { formatApproxCost, formatTokens } from '@/[fsd]/widgets/context-budget/lib/utils';
import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Custom output allowance and cumulative usage totals.
 */
const ContextBudgetDetails = memo(props => {
  const { stats } = props;
  const styles = contextBudgetDetailsStyles();

  const { chatUsage } = stats;
  const cost = formatApproxCost(chatUsage);

  // The window size and the safety margin live in the tokens tooltip; an auto output allowance is a constant
  const customOutputRow = useMemo(
    () =>
      stats.reservedOutputSource === 'custom'
        ? { label: 'Minimum output allowance (Custom)', value: formatTokens(stats.reservedOutput) }
        : null,
    [stats.reservedOutputSource, stats.reservedOutput],
  );

  const costTooltip = !cost.tracked
    ? CONTEXT_MESSAGES.NOT_TRACKED_TOOLTIP
    : cost.partial
      ? CONTEXT_MESSAGES.PARTIAL_COST_TOOLTIP
      : CONTEXT_MESSAGES.COST_TOOLTIP;

  return (
    <Box sx={styles.root}>
      {customOutputRow && (
        <Box sx={styles.row}>
          <Typography
            variant="bodySmall2"
            sx={styles.label}
          >
            {customOutputRow.label}:
          </Typography>
          <Typography
            variant="bodySmall2"
            sx={styles.value}
          >
            {customOutputRow.value}
          </Typography>
        </Box>
      )}

      <Divider sx={styles.divider} />

      <Box sx={styles.row}>
        <Typography
          variant="labelSmall"
          sx={styles.title}
        >
          Usage totals
        </Typography>
      </Box>
      <Box sx={styles.row}>
        <Typography
          variant="bodySmall2"
          sx={styles.label}
        >
          Input tokens used:
        </Typography>
        <Typography
          variant="bodySmall2"
          sx={styles.value}
          data-testid="context-budget-chat-input-tokens"
        >
          {formatTokens(chatUsage?.input_tokens)}
        </Typography>
      </Box>
      <Box sx={styles.row}>
        <Typography
          variant="bodySmall2"
          sx={styles.label}
        >
          Output tokens used:
        </Typography>
        <Typography
          variant="bodySmall2"
          sx={styles.value}
          data-testid="context-budget-chat-output-tokens"
        >
          {formatTokens(chatUsage?.output_tokens)}
        </Typography>
      </Box>
      <Box sx={styles.row}>
        <Box sx={styles.labelWithIcon}>
          <Typography variant="bodySmall2">Approx. cost:</Typography>
          <Tooltip
            title={costTooltip}
            placement="top"
          >
            <Box sx={styles.infoIcon}>
              <InfoIcon
                width={14}
                height={14}
              />
            </Box>
          </Tooltip>
        </Box>
        <Typography
          variant="bodySmall2"
          sx={styles.value}
          data-testid="context-budget-chat-cost"
        >
          {cost.text}
        </Typography>
      </Box>
    </Box>
  );
});

ContextBudgetDetails.displayName = 'ContextBudgetDetails';

/** @type {MuiSx} */
const contextBudgetDetailsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    minHeight: '1.5rem',
  },
  label: ({ palette }) => ({
    flex: 1,
    color: palette.text.primary,
  }),
  labelWithIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    color: palette.text.primary,
  }),
  infoIcon: {
    display: 'flex',
  },
  value: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  divider: ({ palette }) => ({
    margin: '0.25rem 1rem',
    borderColor: palette.border.lines,
  }),
});

export default ContextBudgetDetails;

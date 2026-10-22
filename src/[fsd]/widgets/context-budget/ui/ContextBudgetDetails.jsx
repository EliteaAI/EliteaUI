import { memo, useMemo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';
import { formatApproxCost, formatTokens } from '@/[fsd]/widgets/context-budget/lib/utils';
import InfoIcon from '@/components/Icons/InfoIcon';

import ContextWindowModeSelector from './ContextWindowModeSelector';

const COST_TOOLTIP =
  'Estimated from catalog prices for every model call in this chat, including tool loops, sub-agents and summarization. Deleting messages does not reduce it.';
const PARTIAL_COST_TOOLTIP = 'Some models have no price in the catalog.';
const NOT_TRACKED_TOOLTIP = 'Usage tracking started with this release; earlier messages are not counted.';

/**
 * Window rows (mode + quick switch, sizes, reserves) and cumulative chat totals.
 */
const ContextBudgetDetails = memo(props => {
  const { stats, canEdit, onSwitchMode, isSwitching } = props;
  const styles = contextBudgetDetailsStyles();

  const { chatUsage } = stats;
  const cost = formatApproxCost(chatUsage);

  const windowRows = useMemo(
    () =>
      [
        {
          label: 'Total window',
          value: `${formatTokens(stats.modelWindowPreview ?? stats.effectiveWindow)}${stats.windowSource === 'default' ? ' (default)' : ''}`,
          testId: 'context-budget-total-window',
        },
        // Auto allowance is a constant, so only the custom one is worth showing
        stats.reservedOutputSource === 'custom' && {
          label: 'Minimum output allowance (Custom)',
          value: formatTokens(stats.reservedOutput),
        },
        { label: 'Safety margin', value: formatTokens(stats.safetyMargin) },
      ].filter(Boolean),
    [stats],
  );

  const costTooltip = !cost.tracked
    ? NOT_TRACKED_TOOLTIP
    : cost.partial
      ? PARTIAL_COST_TOOLTIP
      : COST_TOOLTIP;

  return (
    <Box sx={styles.root}>
      <Box sx={styles.row}>
        <Typography
          variant="bodySmall2"
          sx={styles.label}
        >
          Window:
        </Typography>
        <ContextWindowModeSelector
          variant="segmented"
          value={stats.windowMode}
          onChange={onSwitchMode}
          disabled={!canEdit || isSwitching}
          disabledReason={!canEdit ? CONTEXT_WINDOW_COPY.NO_PERMISSION : undefined}
        />
      </Box>
      {windowRows.map(row => (
        <Box
          key={row.label}
          sx={styles.row}
        >
          <Typography
            variant="bodySmall2"
            sx={styles.label}
          >
            {row.label}:
          </Typography>
          <Typography
            variant="bodySmall2"
            sx={styles.value}
            data-testid={row.testId}
          >
            {row.value}
          </Typography>
        </Box>
      ))}

      <Divider sx={styles.divider} />

      <Box sx={styles.row}>
        <Typography
          variant="labelSmall"
          sx={styles.title}
        >
          Chat totals
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

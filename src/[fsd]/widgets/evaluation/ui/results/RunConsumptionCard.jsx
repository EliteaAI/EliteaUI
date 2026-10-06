import { memo, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import {
  EVAL_BUDGET_VERDICT,
  buildBudgetVerdictRows,
  buildRunConsumptionRows,
  getSettlementInfo,
} from '../../lib/helpers';

const USAGE_COLUMNS = [
  { key: 'label', label: 'Role' },
  { key: 'inputTokens', label: 'Input tokens' },
  { key: 'outputTokens', label: 'Output tokens' },
  { key: 'totalTokens', label: 'Total tokens' },
  { key: 'cost', label: 'Cost' },
];

/**
 * What a run spent (#6716): agent and judge tokens and cost, how the run did against the suite's
 * budget, and whether the figures were settled against the usage ledger. Renders nothing for a run
 * that predates usage recording.
 */
const RunConsumptionCard = memo(props => {
  const { meta } = props;

  const usageRows = useMemo(() => buildRunConsumptionRows(meta), [meta]);
  const verdictRows = useMemo(() => buildBudgetVerdictRows(meta?.budget_verdict), [meta?.budget_verdict]);
  const settlement = getSettlementInfo(meta?.settlement);

  const styles = runConsumptionCardStyles();

  if (!usageRows.length && !verdictRows.length) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-consumption"
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodySmall2"
          sx={styles.title}
        >
          Consumption
        </Typography>
        {settlement && (
          <Tooltip
            title={settlement.description}
            placement="top"
            arrow
          >
            <Box
              component="span"
              sx={styles.settlementBadge}
              data-testid={`evaluation-settlement-${settlement.state}`}
            >
              {settlement.label}
            </Box>
          </Tooltip>
        )}
      </Box>

      {usageRows.length > 0 && (
        <Box sx={styles.table}>
          {USAGE_COLUMNS.map(({ key, label }) => (
            <Typography
              key={key}
              variant="labelSmall"
              sx={styles.columnLabel}
            >
              {label}
            </Typography>
          ))}
          {usageRows.map(row => (
            <Box
              key={row.role}
              sx={styles.row}
              data-testid={`evaluation-consumption-${row.role}`}
            >
              {USAGE_COLUMNS.map(({ key }) => (
                <Typography
                  key={key}
                  variant="bodySmall"
                  sx={[styles.cell, key === 'cost' && row.isUnpriced && styles.muted]}
                >
                  {row[key]}
                </Typography>
              ))}
              {row.coverage && (
                <Typography
                  variant="bodySmall"
                  sx={styles.coverage}
                >
                  {row.coverage}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {verdictRows.length > 0 && (
        <Box sx={styles.verdicts}>
          {verdictRows.map(row => (
            <Box
              key={row.key}
              sx={styles.verdict}
              data-testid={`evaluation-budget-${row.key}`}
            >
              <Typography
                variant="labelSmall"
                sx={styles.columnLabel}
              >
                {row.label}
              </Typography>
              <Typography variant="bodySmall">
                {row.limit} · {row.detail}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={[
                  styles.verdictLabel,
                  row.verdict === EVAL_BUDGET_VERDICT.pass && styles.pass,
                  row.verdict === EVAL_BUDGET_VERDICT.breached && styles.breached,
                  row.verdict === EVAL_BUDGET_VERDICT.unknown && styles.unknown,
                ]}
              >
                {row.verdictLabel}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
});

RunConsumptionCard.displayName = 'RunConsumptionCard';

/** @type {MuiSx} */
const runConsumptionCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '0.75rem 1.5rem 0',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: palette.text.primary,
  }),
  settlementBadge: ({ palette }) => ({
    padding: '0 0.5rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    color: palette.text.secondary,
    cursor: 'default',
  }),
  table: {
    display: 'grid',
    gridTemplateColumns: 'minmax(4rem, 1fr) repeat(4, minmax(0, 1fr))',
    columnGap: '1rem',
    rowGap: '0.25rem',
  },
  row: {
    display: 'contents',
  },
  columnLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  cell: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  muted: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  coverage: ({ palette }) => ({
    gridColumn: '1 / -1',
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  verdicts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 2rem',
  },
  verdict: {
    display: 'flex',
    flexDirection: 'column',
  },
  verdictLabel: {
    fontWeight: 600,
  },
  pass: ({ palette }) => ({
    color: palette.status.published,
  }),
  breached: ({ palette }) => ({
    color: palette.error.main,
  }),
  unknown: ({ palette }) => ({
    color: palette.text.attention,
  }),
});

export default RunConsumptionCard;

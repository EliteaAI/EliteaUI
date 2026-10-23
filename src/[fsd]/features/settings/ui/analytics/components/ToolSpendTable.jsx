import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';

const COLUMNS = [
  {
    key: 'feature',
    header: 'TOOL',
    flex: 2,
    // The backend sends each feature's label from toolkit metadata
    render: row => row.label || row.feature || '—',
  },
  { key: 'backend', header: 'PROVIDER', flex: 1.5, render: row => row.backend || '—' },
  { key: 'calls', header: 'CALLS', flex: 1, render: row => AnalyticCommonHelpers.fmtNum(row.calls) },
  {
    key: 'failed_calls',
    header: 'FAILED',
    flex: 1,
    render: row => AnalyticCommonHelpers.fmtNum(row.failed_calls),
  },
  {
    key: 'total_cost',
    header: 'TOTAL COST',
    flex: 1.5,
    render: row => AnalyticCommonHelpers.fmtCost(row.total_cost),
  },
];

// Paid tool spend (web search etc.); never part of the LLM totals shown above it
const ToolSpendTable = memo(props => {
  const { rows = [], emptyState } = props;

  const styles = toolSpendTableStyles();

  return (
    <Box
      sx={styles.card}
      data-testid="analytics-costs-tool-spend"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Cost by Paid Tool
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.subtitle}
      >
        Separate from model costs. Platform key only: calls made with your own provider key are not included.
      </Typography>
      {rows.length > 0 ? (
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            {COLUMNS.map(col => (
              <Typography
                key={col.key}
                sx={[styles.headerCell, { flex: col.flex }]}
              >
                {col.header}
              </Typography>
            ))}
          </Box>
          {rows.map(row => (
            <Box
              key={`${row.feature}-${row.backend}`}
              sx={styles.row}
            >
              {COLUMNS.map(col => (
                <Typography
                  key={col.key}
                  sx={[styles.cell, { flex: col.flex }]}
                >
                  {col.render(row)}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.empty}
        >
          {emptyState}
        </Typography>
      )}
    </Box>
  );
});

ToolSpendTable.displayName = 'ToolSpendTable';

/** @type {MuiSx} */
const toolSpendTableStyles = () => ({
  card: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  title: ({ palette }) => ({ color: palette.text.secondary, display: 'block' }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginBottom: '0.5rem',
  }),
  empty: ({ palette }) => ({ padding: '1rem', color: palette.text.secondary }),
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  headerCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics || palette.text.disabled,
    textTransform: 'uppercase',
  }),
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  cell: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default ToolSpendTable;

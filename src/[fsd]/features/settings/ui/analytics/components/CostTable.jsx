import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

const COST_COLUMNS = [
  { header: 'TOTAL COST', key: 'cost', belowKey: 'total_cost' },
  { header: 'INPUT TOKEN COST', key: 'input_cost', belowKey: 'input_cost' },
  { header: 'OUTPUT TOKEN COST', key: 'output_cost', belowKey: 'output_cost' },
  { header: 'CACHE READ COST', key: 'cache_read_cost', belowKey: 'cache_read_cost' },
  { header: 'CACHE WRITE COST', key: 'cache_creation_cost', belowKey: 'cache_creation_cost' },
];

const CostTable = memo(props => {
  const { title, tooltip, nameHeader, rows, emptyState, extraColumns = [], testId } = props;

  const styles = costTableStyles();

  return (
    <Box
      sx={styles.chartCard}
      data-testid={testId}
    >
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          {title}
        </Typography>
        {tooltip && (
          <InfoTooltip
            infoTooltip={{
              title: tooltip,
              icon: { width: 12, height: 12 },
            }}
          />
        )}
      </Box>
      {rows.length > 0 ? (
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, styles.nameCell]}>{nameHeader}</Typography>
            {extraColumns.map(col => (
              <Typography
                key={col.key}
                sx={[styles.tableCell, { flex: col.flex ?? 1 }]}
              >
                {col.header}
              </Typography>
            ))}
            {COST_COLUMNS.map(col => (
              <Typography
                key={col.key}
                sx={[styles.tableCell, styles.costCell]}
              >
                {col.header}
              </Typography>
            ))}
            <Typography sx={[styles.tableCell, styles.shareCell]}>SHARE</Typography>
          </Box>
          {rows.map((row, index) => (
            <Box
              key={`${row.name}-${index}`}
              sx={styles.tableRow}
            >
              <Typography
                sx={[styles.tableCellValue, styles.nameCell]}
                noWrap
              >
                {row.name}
              </Typography>
              {extraColumns.map(col => (
                <Box
                  key={col.key}
                  sx={[styles.tableCellValue, styles.extraCell, { flex: col.flex ?? 1 }]}
                >
                  {col.render(row)}
                </Box>
              ))}
              {COST_COLUMNS.map(col => (
                <Typography
                  key={col.key}
                  sx={[styles.tableCellValue, styles.costCell]}
                >
                  {AnalyticCommonHelpers.fmtCost(row[col.key], row.below?.[col.belowKey])}
                </Typography>
              ))}
              <Typography sx={[styles.tableCellValue, styles.shareCell]}>
                {row.share != null ? `${row.share.toFixed(1)}%` : '—'}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={styles.noDataText}
        >
          {emptyState}
        </Typography>
      )}
    </Box>
  );
});

CostTable.displayName = 'CostTable';

/** @type {MuiSx} */
const costTableStyles = () => ({
  noDataText: { padding: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, display: 'block' }),
  subtitleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics || palette.text.disabled,
    textTransform: 'uppercase',
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  extraCell: { display: 'flex', alignItems: 'center', minWidth: 0 },
  nameCell: { flex: 3 },
  costCell: { flex: 1.5 },
  shareCell: { flex: 1 },
});

export default CostTable;

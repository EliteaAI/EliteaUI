import { memo, useMemo } from 'react';

import { Box, TableSortLabel, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import UserLabel from './UserLabel';
import {
  analyticsColumnSx,
  analyticsHeaderCellSx,
  analyticsRowMinWidthSx,
  analyticsTableSortLabelSx,
  analyticsTableWrapperSx,
} from './analyticsTable.styles';

const COST_COLUMNS = [
  { header: 'TOTAL COST', key: 'cost', belowKey: 'total_cost' },
  { header: 'INPUT TOKEN COST', key: 'input_cost', belowKey: 'input_cost' },
  { header: 'OUTPUT TOKEN COST', key: 'output_cost', belowKey: 'output_cost' },
  { header: 'CACHE READ COST', key: 'cache_read_cost', belowKey: 'cache_read_cost' },
  { header: 'CACHE WRITE COST', key: 'cache_creation_cost', belowKey: 'cache_creation_cost' },
];

const NAME_FLEX = 3;
const COST_FLEX = 1.5;
const SHARE_FLEX = 1;

const CostTable = memo(props => {
  const {
    title,
    tooltip,
    nameHeader,
    rows,
    emptyState,
    extraColumns = [],
    testId,
    sortBy,
    sortOrder,
    onSort,
  } = props;

  const styles = costTableStyles();
  const rowMinWidth = useMemo(
    () =>
      analyticsRowMinWidthSx([NAME_FLEX, ...extraColumns, ...COST_COLUMNS.map(() => COST_FLEX), SHARE_FLEX]),
    [extraColumns],
  );

  const renderHeaderCell = (key, label, sx) => {
    if (onSort) {
      return (
        <Box sx={sx}>
          <TableSortLabel
            active={sortBy === key}
            direction={sortBy === key ? sortOrder : 'desc'}
            onClick={() => onSort(key)}
            sx={analyticsTableSortLabelSx}
          >
            {label}
          </TableSortLabel>
        </Box>
      );
    }
    return <Typography sx={sx}>{label}</Typography>;
  };

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
          <Box sx={[styles.tableHeader, rowMinWidth]}>
            {renderHeaderCell('name', nameHeader, [styles.tableCell, analyticsHeaderCellSx, styles.nameCell])}
            {extraColumns.map(col =>
              renderHeaderCell(col.key, col.header, [
                styles.tableCell,
                analyticsHeaderCellSx,
                analyticsColumnSx(col),
              ]),
            )}
            {COST_COLUMNS.map(col =>
              renderHeaderCell(col.key, col.header, [
                styles.tableCell,
                analyticsHeaderCellSx,
                styles.costCell,
              ]),
            )}
            {renderHeaderCell('share', 'SHARE', [styles.tableCell, analyticsHeaderCellSx, styles.shareCell])}
          </Box>
          {rows.map((row, index) => (
            <Box
              key={`${row.name}-${index}`}
              sx={[styles.tableRow, rowMinWidth]}
            >
              <Box sx={[styles.tableCellValue, styles.nameCell]}>
                <UserLabel
                  user={{ user_email: row.name, user_deleted: row.userDeleted }}
                  testId="analytics-cost-user-deleted-chip"
                />
              </Box>
              {extraColumns.map(col => (
                <Box
                  key={col.key}
                  sx={[styles.tableCellValue, styles.extraCell, analyticsColumnSx(col)]}
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
  tableWrapper: analyticsTableWrapperSx,
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
  extraCell: { display: 'flex', alignItems: 'center' },
  nameCell: analyticsColumnSx(NAME_FLEX),
  costCell: analyticsColumnSx(COST_FLEX),
  shareCell: analyticsColumnSx(SHARE_FLEX),
});

export default CostTable;

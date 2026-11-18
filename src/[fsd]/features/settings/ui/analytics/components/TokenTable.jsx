import { memo } from 'react';

import { Box, TableSortLabel, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import {
  analyticsColumnSx,
  analyticsHeaderCellSx,
  analyticsRowMinWidthSx,
  analyticsTableSortLabelEndSx,
  analyticsTableSortLabelSx,
  analyticsTableWrapperSx,
} from './analyticsTable.styles';

const TOKEN_COLUMNS = [
  { key: 'total', label: 'TOTAL TOKENS' },
  { key: 'input', label: 'INPUT TOKENS' },
  { key: 'output', label: 'OUTPUT TOKENS' },
  { key: 'cacheRead', label: 'CACHE READ' },
  { key: 'cacheWrite', label: 'CACHE WRITE' },
  { key: 'share', label: 'SHARE' },
];

const NAME_FLEX = 3;
const VALUE_FLEX = 1.25;
const TOKEN_ROW_MIN_WIDTH = analyticsRowMinWidthSx([NAME_FLEX, ...TOKEN_COLUMNS.map(() => VALUE_FLEX)]);

const TokenTable = memo(props => {
  const { title, subtitleTooltip, nameHeader, rows, emptyState, testId, sortBy, sortOrder, onSort } = props;

  const renderHeaderCell = (key, label) => {
    const sx = [styles.tableCell, analyticsHeaderCellSx, styles.rightAlignedCell];
    if (onSort) {
      return (
        <Box
          key={key}
          sx={sx}
        >
          <TableSortLabel
            active={sortBy === key}
            direction={sortBy === key ? sortOrder : 'desc'}
            onClick={() => onSort(key)}
            sx={analyticsTableSortLabelEndSx}
          >
            {label}
          </TableSortLabel>
        </Box>
      );
    }
    return (
      <Typography
        key={key}
        sx={sx}
      >
        {label}
      </Typography>
    );
  };

  const renderNameHeader = () => {
    const sx = [styles.tableCell, analyticsHeaderCellSx, styles.nameCell];
    if (onSort) {
      return (
        <Box sx={sx}>
          <TableSortLabel
            active={sortBy === 'name'}
            direction={sortBy === 'name' ? sortOrder : 'desc'}
            onClick={() => onSort('name')}
            sx={analyticsTableSortLabelSx}
          >
            {nameHeader}
          </TableSortLabel>
        </Box>
      );
    }
    return <Typography sx={sx}>{nameHeader}</Typography>;
  };

  return (
    <Box
      sx={styles.chartCard}
      data-testid={testId}
    >
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="labelMedium"
          sx={[styles.chartTitle, { marginBottom: 0 }]}
        >
          {title}
        </Typography>
        <InfoTooltip
          infoTooltip={{
            title: subtitleTooltip,
            icon: { width: 12, height: 12 },
          }}
        />
      </Box>
      {rows.length > 0 ? (
        <Box sx={styles.tableWrapper}>
          <Box sx={[styles.tableHeader, TOKEN_ROW_MIN_WIDTH]}>
            {renderNameHeader()}
            {TOKEN_COLUMNS.map(col => renderHeaderCell(col.key, col.label))}
          </Box>
          {rows.map((row, index) => (
            <Box
              key={`${row.name}-${index}`}
              sx={[styles.tableRow, TOKEN_ROW_MIN_WIDTH]}
            >
              <Typography
                sx={[styles.tableCellValue, styles.nameCell]}
                noWrap
              >
                {row.name}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.total)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.input)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.output)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.cacheRead)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.cacheWrite)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {`${row.share.toFixed(1)}%`}
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

TokenTable.displayName = 'TokenTable';

const styles = {
  noDataText: { p: 2 },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.5rem', display: 'block' }),
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
  nameCell: { ...analyticsColumnSx(NAME_FLEX), textAlign: 'left' },
  rightAlignedCell: { ...analyticsColumnSx(VALUE_FLEX), textAlign: 'right' },
};

export default TokenTable;

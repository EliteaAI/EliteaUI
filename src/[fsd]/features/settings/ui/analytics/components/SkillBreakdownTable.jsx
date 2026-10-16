import { memo } from 'react';

import { Box, CircularProgress, TableSortLabel, Typography } from '@mui/material';

import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import { analyticsTableSortLabelSx, analyticsTableStyles as styles } from './analyticsTable.styles';

const rowKey = (row, index) => row.key ?? index;

const columnSortKey = column => column.sortKey ?? column.key;

const SkillBreakdownTable = memo(props => {
  const {
    title,
    tooltip,
    subtitle,
    columns,
    rows = [],
    emptyText = 'No data',
    testId,
    sortBy,
    sortOrder,
    onSort,
    loading = false,
    footer,
  } = props;

  const tableStyles = skillBreakdownTableStyles();

  return (
    <Box
      sx={styles.chartCard}
      data-testid={testId}
    >
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        {title}
      </Typography>
      <Box sx={styles.subtitleRow}>
        {subtitle && (
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {subtitle}
          </Typography>
        )}
        {tooltip && (
          <InfoTooltip
            infoTooltip={{
              title: tooltip,
              icon: { width: 12, height: 12 },
            }}
          />
        )}
      </Box>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          {columns.map(column =>
            onSort ? (
              <Box
                key={column.key}
                sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
              >
                <TableSortLabel
                  active={sortBy === columnSortKey(column)}
                  direction={sortBy === columnSortKey(column) ? sortOrder : 'desc'}
                  onClick={() => onSort(columnSortKey(column))}
                  sx={analyticsTableSortLabelSx}
                  data-testid={testId ? `${testId}-sort-${column.key}` : undefined}
                >
                  {column.label}
                </TableSortLabel>
              </Box>
            ) : (
              <Typography
                key={column.key}
                sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
              >
                {column.label}
              </Typography>
            ),
          )}
        </Box>
        <Box sx={tableStyles.scrollList}>
          {loading && (
            <Box
              sx={tableStyles.loadingState}
              data-testid={testId ? `${testId}-loading` : undefined}
            >
              <CircularProgress size={24} />
            </Box>
          )}
          {!loading &&
            rows.map((row, index) => (
              <Box
                key={rowKey(row, index)}
                sx={styles.tableRow}
                data-testid={testId ? `${testId}-row` : undefined}
              >
                {columns.map(column => (
                  <Box
                    key={column.key}
                    sx={[styles.tableCellValue, { flex: column.flex ?? 1 }]}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </Box>
                ))}
              </Box>
            ))}
          {!loading && !rows.length && (
            <Typography
              variant="bodySmall"
              sx={tableStyles.emptyText}
              data-testid={testId ? `${testId}-empty` : undefined}
            >
              {emptyText}
            </Typography>
          )}
        </Box>
      </Box>
      {footer}
    </Box>
  );
});

SkillBreakdownTable.displayName = 'SkillBreakdownTable';

/** @type {MuiSx} */
const skillBreakdownTableStyles = () => ({
  scrollList: { maxHeight: '18.75rem', overflowY: 'auto', overflowX: 'hidden' },
  emptyText: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    padding: '0.5rem 0.75rem',
  }),
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
});

export default SkillBreakdownTable;

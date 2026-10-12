import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import { analyticsTableStyles as styles } from './analyticsTable.styles';

const rowKey = (row, index) => row.key ?? index;

const SkillBreakdownTable = memo(props => {
  const { title, tooltip, subtitle, columns, rows = [], emptyText = 'No data', testId } = props;

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
          {columns.map(column => (
            <Typography
              key={column.key}
              sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
            >
              {column.label}
            </Typography>
          ))}
        </Box>
        <Box sx={tableStyles.scrollList}>
          {rows.map((row, index) => (
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
          {!rows.length && (
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
});

export default SkillBreakdownTable;

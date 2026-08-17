import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

const TokenTable = memo(props => {
  const { title, subtitleTooltip, nameHeader, rows, emptyState } = props;

  return (
    <Box sx={styles.chartCard}>
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
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, styles.nameCell]}>{nameHeader}</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>TOTAL TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>INPUT TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>OUTPUT TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>SHARE</Typography>
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
    backgroundColor: palette.background.userInputBackground,
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
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${palette.border.table}`,
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
    borderBottom: `1px solid ${palette.border.table}`,
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
  nameCell: { flex: 3, textAlign: 'left' },
  rightAlignedCell: { flex: 1.25, textAlign: 'right' },
};

export default TokenTable;

import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/analytics/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';

const ModelUsageTable = memo(props => {
  const { models = [], totalCalls } = props;

  const styles = modelUsageTableStyles();

  if (!models.length) return null;

  const maxCalls = models[0]?.calls || 1;

  return (
    <Box sx={styles.chartCard}>
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        Model Usage Breakdown
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.chartSubtitle}
      >
        LLM calls per model
      </Typography>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Typography sx={[styles.tableCell, { flex: '0 0 2rem' }]}>#</Typography>
          <Typography sx={[styles.tableCell, { flex: 3 }]}>Model</Typography>
          <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Calls</Typography>
          <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Users</Typography>
          <Typography sx={[styles.tableCell, { flex: 2 }]}>Share</Typography>
        </Box>
        {models.map((model, index) => {
          const share = totalCalls > 0 ? (model.calls / totalCalls) * 100 : 0;
          const color =
            AnalyticsCommonConstants.CHART_COLORS[index % AnalyticsCommonConstants.CHART_COLORS.length];

          return (
            <Box
              key={index}
              sx={styles.tableRow}
            >
              <Typography
                sx={[
                  styles.tableCellValue,
                  { flex: '0 0 2rem' },
                  ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
                ]}
              >
                {index + 1}
              </Typography>
              <Box
                sx={[
                  styles.tableCellValue,
                  { flex: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' },
                ]}
              >
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
                />
                <Typography
                  variant="bodySmall"
                  noWrap
                >
                  {model.display_name || model.model_name || 'Unknown Model'}
                </Typography>
              </Box>
              <Typography sx={[styles.tableCellValue, { flex: 1, textAlign: 'right' }]}>
                {AnalyticCommonHelpers.fmtNum(model.calls)}
              </Typography>
              <Typography sx={[styles.tableCellValue, { flex: 1, textAlign: 'right' }]}>
                {model.users}
              </Typography>
              <Box
                sx={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}
              >
                <Box sx={styles.shareBarBg}>
                  <Box
                    sx={[
                      styles.shareBarFill,
                      { width: `${(model.calls / maxCalls) * 100}%`, backgroundColor: color },
                    ]}
                  />
                </Box>
                <Typography
                  variant="bodySmall"
                  sx={({ palette }) => ({
                    color: palette.text.metrics || palette.text.disabled,
                    minWidth: '2.5rem',
                    textAlign: 'right',
                  })}
                >
                  {share.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

ModelUsageTable.displayName = 'ModelUsageTable';

/** @type {MuiSx} */
const modelUsageTableStyles = () => ({
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginBottom: '0.5rem',
    display: 'block',
  }),
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
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.conversation?.hover || 'rgba(255,255,255,0.02)' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  shareBarBg: ({ palette }) => ({
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.background.conversation?.normal || 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }),
  shareBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
});

export default ModelUsageTable;

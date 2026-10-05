import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import { analyticsTableStyles } from './analyticsTable.styles';

const ModelUsageTable = memo(props => {
  const { models = [], totalCalls, isPersonalProject = false } = props;

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
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="bodySmall"
          sx={styles.chartSubtitle}
        >
          LLM calls/runs per model
        </Typography>
        <InfoTooltip
          infoTooltip={{
            title: isPersonalProject
              ? AnalyticsCommonConstants.TOOLTIP_TEXTS.overview.MODEL_USAGE_PRIVATE
              : AnalyticsCommonConstants.TOOLTIP_TEXTS.overview.MODEL_USAGE,
            icon: { width: 12, height: 12 },
          }}
        />
      </Box>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Typography sx={[styles.tableCell, { flex: '0 0 2rem', textAlign: 'right' }]}>#</Typography>
          <Typography sx={[styles.tableCell, { flex: 3 }]}>Model</Typography>
          <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Calls/Runs</Typography>
          {!isPersonalProject && (
            <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Users</Typography>
          )}
          <Typography sx={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>Share</Typography>
        </Box>
        {models.map((model, index) => {
          const share = totalCalls > 0 ? (model.calls / totalCalls) * 100 : 0;
          const color = CHART_COLORS[index % CHART_COLORS.length];

          return (
            <Box
              key={index}
              sx={styles.tableRow}
            >
              <Typography
                sx={[
                  styles.tableCellValue,
                  { flex: '0 0 2rem', textAlign: 'right' },
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
                <Box sx={styles.colorDot(color)} />
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
              {!isPersonalProject && (
                <Typography sx={[styles.tableCellValue, { flex: 1, textAlign: 'right' }]}>
                  {model.users}
                </Typography>
              )}
              <Box sx={styles.modelCell}>
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
  ...analyticsTableStyles,
  modelCell: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingLeft: '0.5rem',
  },
  shareBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  shareBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
});

export default ModelUsageTable;

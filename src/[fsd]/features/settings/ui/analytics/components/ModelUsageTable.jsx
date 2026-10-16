import { memo, useCallback } from 'react';

import { Box, TableSortLabel, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useClientSort, useSortedRows } from '@/[fsd]/shared/lib/hooks';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import { analyticsTableSortLabelSx, analyticsTableStyles } from './analyticsTable.styles';

const MODEL_COLUMNS = [
  { key: 'model_name', label: 'Model', flex: 3 },
  { key: 'calls', label: 'Calls/Runs', flex: 1, align: 'right' },
  { key: 'users', label: 'Users', flex: 1, align: 'right', personalHide: true },
  { key: 'share', label: 'Share', flex: 2, align: 'right' },
];

const ModelUsageTable = memo(props => {
  const { models = [], totalCalls, isPersonalProject = false } = props;

  const styles = modelUsageTableStyles();

  const { sort: modelSort, handleSort: handleModelSort } = useClientSort('calls');
  const getModelValue = useCallback(
    (row, key) => {
      if (key === 'model_name') return row.display_name || row.model_name || '';
      if (key === 'share') return totalCalls > 0 ? row.calls / totalCalls : 0;
      return row[key];
    },
    [totalCalls],
  );
  const sortedModels = useSortedRows(models, modelSort, getModelValue);

  if (!models.length) return null;

  const maxCalls = sortedModels[0] ? Math.max(...sortedModels.map(m => m.calls || 0)) || 1 : 1;

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
          {MODEL_COLUMNS.filter(col => !col.personalHide || !isPersonalProject).map(col => (
            <Box
              key={col.key}
              sx={[
                styles.tableCell,
                {
                  flex: col.flex,
                  display: 'flex',
                  justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                },
              ]}
            >
              <TableSortLabel
                active={modelSort.sortBy === col.key}
                direction={modelSort.sortBy === col.key ? modelSort.sortOrder : 'desc'}
                onClick={() => handleModelSort(col.key)}
                sx={analyticsTableSortLabelSx}
              >
                {col.label}
              </TableSortLabel>
            </Box>
          ))}
        </Box>
        {sortedModels.map((model, index) => {
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

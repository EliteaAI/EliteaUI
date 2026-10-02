import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import { analyticsTableStyles } from './analyticsTable.styles';

const COLUMNS = [
  { key: 'runs', label: 'Runs', format: AnalyticCommonHelpers.fmtNum },
  { key: 'llm_calls', label: 'LLM Calls', format: AnalyticCommonHelpers.fmtNum },
  { key: 'tool_runs', label: 'Tool Runs', format: AnalyticCommonHelpers.fmtNum },
  { key: 'llm_cost', label: 'Cost', format: AnalyticCommonHelpers.fmtCost },
];

const AutomatedActivityTable = memo(props => {
  const { items = [] } = props;

  const styles = automatedActivityTableStyles();

  const totals = useMemo(
    () =>
      COLUMNS.reduce((acc, { key }) => {
        acc[key] = items.reduce((sum, item) => sum + (item[key] || 0), 0);
        return acc;
      }, {}),
    [items],
  );

  if (!items.length) return null;

  const { TOOLTIP_TEXTS } = AnalyticsCommonConstants;

  return (
    <Box
      sx={[styles.chartCard, styles.dashedCard]}
      data-testid="analytics-overview-automated-activity"
    >
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        Automated Activity
      </Typography>
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="bodySmall"
          sx={styles.chartSubtitle}
        >
          Scheduled, webhook and index runs — included in project totals, not counted as user activity
        </Typography>
        <InfoTooltip
          infoTooltip={{
            title: TOOLTIP_TEXTS.overview.AUTOMATED_ACTIVITY,
            icon: { width: 12, height: 12 },
          }}
        />
      </Box>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Typography sx={[styles.tableCell, styles.sourceCol]}>Trigger Source</Typography>
          {COLUMNS.map(({ key, label }) => (
            <Typography
              key={key}
              sx={[styles.tableCell, styles.valueCol]}
            >
              {label}
            </Typography>
          ))}
        </Box>
        {items.map((item, index) => (
          <Box
            key={item.trigger_source || index}
            sx={styles.tableRow}
            data-testid={`analytics-automated-row-${item.trigger_source}`}
          >
            <Box sx={[styles.tableCellValue, styles.sourceCol, styles.sourceCell]}>
              <Box sx={styles.colorDot(CHART_COLORS[index % CHART_COLORS.length])} />
              <Typography
                variant="bodySmall"
                noWrap
              >
                {AnalyticCommonHelpers.triggerSourceLabel(item.trigger_source)}
              </Typography>
            </Box>
            {COLUMNS.map(({ key, format }) => (
              <Typography
                key={key}
                sx={[styles.tableCellValue, styles.valueCol]}
              >
                {format(item[key])}
              </Typography>
            ))}
          </Box>
        ))}
        {items.length > 1 && (
          <Box sx={[styles.tableRow, styles.totalRow]}>
            <Typography sx={[styles.tableCellValue, styles.sourceCol, styles.totalText]}>Total</Typography>
            {COLUMNS.map(({ key, format }) => (
              <Typography
                key={key}
                sx={[styles.tableCellValue, styles.valueCol, styles.totalText]}
              >
                {format(totals[key])}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
});

AutomatedActivityTable.displayName = 'AutomatedActivityTable';

/** @type {MuiSx} */
const automatedActivityTableStyles = () => ({
  ...analyticsTableStyles,
  // Dashed so the automated bucket reads as separate from the user-driven cards
  dashedCard: { borderStyle: 'dashed' },
  totalRow: { borderBottom: 'none' },
  totalText: { fontWeight: 600 },
  sourceCol: { flex: 3 },
  sourceCell: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  valueCol: { flex: 1, textAlign: 'right' },
});

export default AutomatedActivityTable;

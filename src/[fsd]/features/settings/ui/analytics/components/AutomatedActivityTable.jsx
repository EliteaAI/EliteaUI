import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

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

  const { TRIGGER_SOURCE_LABELS, TOOLTIP_TEXTS } = AnalyticsCommonConstants;

  return (
    <Box
      sx={styles.chartCard}
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
                {TRIGGER_SOURCE_LABELS[item.trigger_source] || item.trigger_source || 'Unknown'}
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
  colorDot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem dashed ${palette.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  subtitleRow: {
    display: 'flex',
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
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  totalRow: { borderBottom: 'none' },
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  totalText: { fontWeight: 600 },
  sourceCol: { flex: 3 },
  sourceCell: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  valueCol: { flex: 1, textAlign: 'right' },
});

export default AutomatedActivityTable;

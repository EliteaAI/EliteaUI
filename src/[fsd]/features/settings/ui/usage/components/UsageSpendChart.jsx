import { memo, useCallback, useState } from 'react';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, FormControlLabel, Typography, useTheme } from '@mui/material';

import { PeriodConstants, UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useUsageChartData } from '@/[fsd]/features/settings/lib/hooks';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { Checkbox } from '@/[fsd]/shared/ui';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';

import UsageTooltip from './UsageTooltip';

const { USAGE_GROUP_BY_BUTTONS } = UsageConstants;

const GRANULARITY_BUTTONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const UsageSpendChart = memo(props => {
  const {
    daily = [],
    models = [],
    bySource = [],
    canSeeAmounts,
    currency,
    periodStart,
    periodEnd,
    initialGroupBy = 'model',
    compData,
    compareEnabled = false,
    onCompareChange,
    isAdmin = false,
    selectedSource = null,
    scope = 'project',
  } = props;

  const groupByButtons =
    scope === 'user' || !canSeeAmounts
      ? USAGE_GROUP_BY_BUTTONS.filter(b => b.value !== 'member')
      : USAGE_GROUP_BY_BUTTONS;

  const { palette } = useTheme();
  const styles = usageSpendChartStyles();

  const [groupBy, setGroupBy] = useState(initialGroupBy);
  const [granularity, setGranularity] = useState('daily');
  const [hiddenKeys, setHiddenKeys] = useState(new Set());

  // Non-admin users have spend stripped from the response; use total_tokens as fallback metric
  const metricKey = canSeeAmounts ? 'spend' : 'total_tokens';

  const { seriesKeys, chartData, mergedChartData, compChartData, hasData } = useUsageChartData({
    daily,
    models,
    bySource,
    periodStart,
    periodEnd,
    compData,
    groupBy,
    granularity,
    compareEnabled,
    metricKey,
  });

  const handleCompareToggle = useCallback(
    (_, checked) => {
      onCompareChange?.(checked);
    },
    [onCompareChange],
  );

  const axisStroke = palette.text.hint || palette.border?.lines;
  const axisTickStyle = { fill: palette.text.hint || palette.text.primary, fontSize: 11 };

  const getSeriesColor = useCallback(
    key => {
      if (key === '__other') return palette.text.disabled;

      return UsageHelpers.stableSeriesColor(key, CHART_COLORS);
    },
    [palette],
  );

  const toggleKey = useCallback(key => {
    setHiddenKeys(prev => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }, []);

  const formatAxisTick = value => {
    if (canSeeAmounts) return `$${Number(value).toFixed(2)}`;

    return UsageHelpers.formatTokens(value);
  };

  // Format a date string "YYYY-MM-DD" to "Oct 1" abbreviated label
  const formatXLabel = useCallback(date => {
    if (!date || date.length < 10) return '';
    const month = parseInt(date.slice(5, 7), 10);
    const day = parseInt(date.slice(8, 10), 10);

    return `${PeriodConstants.MONTH_NAMES[month - 1].slice(0, 3)} ${day}`;
  }, []);

  // Sparse tick formatter: only show label for every-other tick when many bars
  const makeXAxisTick = useCallback(
    n => (date, index) => {
      if (n > 16 && index % 2 === 1 && index !== n - 1) return '';

      return formatXLabel(date);
    },
    [formatXLabel],
  );

  const xTickFormatter = makeXAxisTick(chartData.length);

  return (
    <Box sx={styles.card}>
      <Box sx={styles.header}>
        <Box sx={styles.titleBlock}>
          <Typography
            variant="labelMedium"
            sx={styles.title}
          >
            {isAdmin || canSeeAmounts ? 'Spend over time' : 'Tokens over time'}
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.subtitle}
          >
            {`Dates in UTC${granularity === 'weekly' ? ' · Weeks start on Monday, clipped to the month' : ''}`}
          </Typography>
        </Box>

        <Box sx={styles.controls}>
          <Typography
            component="span"
            variant="bodySmall"
            sx={styles.groupByLabel}
          >
            Group by
          </Typography>
          <TabGroupButton
            arrayBtn={groupByButtons}
            value={groupBy}
            onChange={(_, newValue) => setGroupBy(newValue)}
            disableTooltip
            variant="elitea"
            data-testid="usage-groupby-select"
          />

          <TabGroupButton
            arrayBtn={GRANULARITY_BUTTONS}
            value={granularity}
            onChange={(_, newValue) => setGranularity(newValue)}
            disableTooltip
            variant="elitea"
            data-testid="usage-granularity-toggle"
          />

          <FormControlLabel
            label="Compare to previous period"
            data-testid="usage-compare-toggle"
            disabled={!compData}
            sx={styles.compareLabel}
            control={
              <Checkbox.BaseCheckbox
                checked={compareEnabled}
                onChange={handleCompareToggle}
                size="small"
                disabled={!compData}
              />
            }
          />
        </Box>
      </Box>

      {hasData ? (
        <>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={mergedChartData}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={palette.border.lines}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={xTickFormatter}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                  tickFormatter={formatAxisTick}
                  width={60}
                />
                <RechartsTooltip
                  content={
                    <UsageTooltip
                      canSeeAmounts={canSeeAmounts}
                      currency={currency}
                    />
                  }
                />
                {seriesKeys.map(key => {
                  const isDimmed = groupBy === 'source' && selectedSource && selectedSource !== key;
                  const baseColor = getSeriesColor(key);

                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={key === '__other' ? 'Other' : key}
                      stackId="stack"
                      fill={hiddenKeys.has(key) ? 'transparent' : baseColor}
                      fillOpacity={hiddenKeys.has(key) ? 0 : isDimmed ? 0.2 : 1}
                      hide={hiddenKeys.has(key)}
                    />
                  );
                })}
                {compareEnabled && compChartData.length > 0 && (
                  <Line
                    dataKey="__prev"
                    name="Previous period"
                    dot={false}
                    strokeDasharray="6 5"
                    stroke={axisStroke}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </Box>

          {(seriesKeys.length > 1 || (compareEnabled && compChartData.length > 0)) && (
            <Box sx={styles.legendRow}>
              {seriesKeys.map(key => (
                <Box
                  key={key}
                  component="button"
                  onClick={() => toggleKey(key)}
                  aria-pressed={!hiddenKeys.has(key)}
                  sx={styles.legendPill(hiddenKeys.has(key), getSeriesColor(key))}
                >
                  <Box
                    sx={styles.legendDot(hiddenKeys.has(key) ? palette.text.disabled : getSeriesColor(key))}
                  />
                  <Typography
                    variant="bodySmall"
                    sx={styles.legendLabel(hiddenKeys.has(key))}
                  >
                    {key === '__other' ? 'Other' : key}
                  </Typography>
                </Box>
              ))}
              {compareEnabled && compChartData.length > 0 && (
                <Box sx={styles.legendPrevPeriod(axisStroke)}>
                  <Box sx={styles.legendDash(axisStroke)} />
                  <Typography
                    variant="bodySmall"
                    sx={styles.legendLabel(false)}
                  >
                    {`Previous period${compData?.period_start ? ` (${PeriodConstants.MONTH_NAMES[new Date(compData.period_start + 'T00:00:00Z').getUTCMonth()].slice(0, 3)})` : ''}`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.empty}
        >
          No usage recorded for this period yet.
        </Typography>
      )}
    </Box>
  );
});

UsageSpendChart.displayName = 'UsageSpendChart';

/** @type {MuiSx} */
const usageSpendChartStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: palette.background.surface.interactive.default,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.hint,
    marginTop: '0.1875rem',
  }),
  controls: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  groupByLabel: ({ palette }) => ({
    color: palette.text.hint || palette.text.disabled,
    padding: '0 0.375rem 0 0.5rem',
    flexShrink: 0,
    alignSelf: 'center',
  }),
  chartWrapper: {
    height: '13rem',
    width: '100%',
  },
  legendRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  legendPill:
    (isHidden, color) =>
    ({ palette }) => ({
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '0.4375rem',
      padding: '0.25rem 0.625rem',
      borderRadius: '0.875rem',
      cursor: 'pointer',
      border: `0.0625rem solid ${palette.border.lines}`,
      backgroundColor: 'transparent',
      outline: 'none',
      color: isHidden ? palette.text.disabled : color,
    }),
  legendDot: color => ({
    width: '0.5625rem',
    height: '0.5625rem',
    borderRadius: '0.125rem',
    backgroundColor: color,
    flexShrink: 0,
  }),
  legendLabel:
    isHidden =>
    ({ palette }) => ({
      color: isHidden ? palette.text.disabled : 'inherit',
    }),
  empty: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginTop: '0.5rem',
  }),
  compareLabel: ({ palette }) => ({
    margin: 0,
    gap: '0.25rem',
    '& .MuiFormControlLabel-label': {
      fontSize: '0.8125rem',
      color: palette.text.hint || palette.text.disabled,
    },
  }),
  legendPrevPeriod:
    color =>
    ({ palette }) => ({
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '0.4375rem',
      padding: '0.25rem 0.625rem',
      borderRadius: '0.875rem',
      border: `0.0625rem solid ${palette.border.lines}`,
      backgroundColor: 'transparent',
      color,
    }),
  legendDash: color => ({
    width: '1.25rem',
    height: '0',
    borderTop: `0.125rem dashed ${color}`,
    flexShrink: 0,
  }),
});

export default UsageSpendChart;

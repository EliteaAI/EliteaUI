import { memo, useMemo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { fillDailyGaps, formatMoney, formatTokens } from '@/[fsd]/features/usage/lib/usage.helpers';

const UsageTooltip = memo(props => {
  const { active, payload, label, canSeeAmounts, currency } = props;

  const styles = usageDailyChartStyles();

  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};

  return (
    <Box sx={styles.tooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.tooltipLabel}
      >
        {label}
      </Typography>
      {canSeeAmounts && (
        <Typography variant="bodySmall">Cost: {formatMoney(point.spend, currency)}</Typography>
      )}
      <Typography variant="bodySmall">Calls: {point.api_requests || 0}</Typography>
      <Typography variant="bodySmall">Tokens: {formatTokens(point.total_tokens)}</Typography>
    </Box>
  );
});

UsageTooltip.displayName = 'UsageTooltip';

const UsageDailyChart = memo(props => {
  const { daily = [], canSeeAmounts, currency, periodStart, periodEnd } = props;

  const styles = usageDailyChartStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  // Members cannot see cost, so chart call volume for them instead
  const metric = canSeeAmounts ? 'spend' : 'api_requests';

  const series = useMemo(() => fillDailyGaps(daily, periodStart, periodEnd), [daily, periodStart, periodEnd]);

  const hasData = useMemo(() => daily.some(day => (day.api_requests || 0) > 0), [daily]);

  return (
    <Box sx={styles.card}>
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Daily Usage
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.subtitle}
      >
        {canSeeAmounts ? 'Cost per day this period' : 'Calls per day this period'}
      </Typography>

      {hasData ? (
        <Box sx={styles.chartWrapper}>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={series}>
              <XAxis
                dataKey="date"
                tick={axisTickStyle}
                tickFormatter={date => date?.slice(5)}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <YAxis
                tick={axisTickStyle}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <RechartsTooltip
                content={
                  <UsageTooltip
                    canSeeAmounts={canSeeAmounts}
                    currency={currency}
                  />
                }
              />
              <Area
                type="linear"
                dataKey={metric}
                name={canSeeAmounts ? 'Cost' : 'Calls'}
                stroke={palette.status.draft}
                fill={palette.status.draft}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
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

UsageDailyChart.displayName = 'UsageDailyChart';

/** @type {MuiSx} */
const usageDailyChartStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
    flex: 1,
    minWidth: 0,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginBottom: '0.75rem',
  }),
  chartWrapper: {
    height: '13rem',
    width: '100%',
  },
  empty: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginTop: '0.5rem',
  }),
  tooltip: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.secondary,
    border: `1px solid ${palette.border.table}`,
  }),
  tooltipLabel: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.25rem',
  }),
});

export default UsageDailyChart;

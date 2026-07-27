import { memo, useMemo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

import UsageTooltip from './UsageTooltip';

const UsageDailyChart = memo(props => {
  const { daily = [], canSeeAmounts, currency, periodStart, periodEnd } = props;

  const { palette } = useTheme();
  const styles = usageDailyChartStyles();

  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const metric = canSeeAmounts ? 'spend' : 'api_requests';

  const series = useMemo(
    () => UsageHelpers.fillDailyGaps(daily, periodStart, periodEnd),
    [daily, periodStart, periodEnd],
  );

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
    border: 'none',
    backgroundColor: palette.background.userInputBackground,
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
});

export default UsageDailyChart;

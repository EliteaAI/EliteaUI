import { memo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useInViewOnce } from '@/[fsd]/shared/lib/hooks/useInViewOnce.hooks';
import { useAnalyticsChatsSummaryQuery } from '@/api';

const ChatDailyUsage = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const { ref, hasBeenVisible } = useInViewOnce();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { data } = useAnalyticsChatsSummaryQuery(
    { projectId, dateFrom, dateTo, includeDaily: true },
    { skip: !projectId || !hasBeenVisible },
  );

  const dailyUsage = data?.daily || [];

  const styles = chatDailyUsageStyles();

  return (
    <Box
      ref={ref}
      sx={styles.card}
      data-testid="analytics-chats-daily-chart"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Daily Chat Usage
      </Typography>
      <Box sx={styles.chartWrapper}>
        {!hasBeenVisible && (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              Scroll to load
            </Typography>
          </Box>
        )}
        {hasBeenVisible && dailyUsage.length > 0 && (
          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <AreaChart data={dailyUsage}>
              <XAxis
                dataKey="date"
                tick={axisTickStyle}
                tickFormatter={d => d?.slice(5)}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <YAxis
                tick={axisTickStyle}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="llm_cost"
                name="Cost"
                stroke={palette.text.accent}
                fill={palette.text.accent}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="total_tokens"
                name="Tokens"
                stroke={palette.status.draft}
                fill={palette.status.draft}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="responses"
                name="Responses"
                stroke={CHART_COLORS[2]}
                fill={CHART_COLORS[2]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {hasBeenVisible && dailyUsage.length === 0 && (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No daily data for this period
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

ChatDailyUsage.displayName = 'ChatDailyUsage';

/** @type {MuiSx} */
const chatDailyUsageStyles = () => ({
  card: ({ palette }) => ({
    flex: 1,
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  title: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: '12.5rem' },
  emptyState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default ChatDailyUsage;

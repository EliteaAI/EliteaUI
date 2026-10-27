import { memo, useCallback, useMemo, useState } from 'react';

import { Bar, BarChart, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { AnalyticsChatsConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useAnalyticsChatsQuery } from '@/api';

const { CHAT_ACTIVITY_TOP_N } = AnalyticsChatsConstants;

const METRIC_BUTTONS = [
  { label: 'Cost', value: 'cost' },
  { label: 'Tokens', value: 'tokens' },
  { label: 'Responses', value: 'responses' },
];

const ChatTopChart = memo(props => {
  const { projectId, dateFrom, dateTo, onBarClick } = props;

  const [metric, setMetric] = useState('cost');
  const sortBy = metric === 'cost' ? 'llm_cost' : metric === 'tokens' ? 'total_tokens' : 'responses';

  const { data } = useAnalyticsChatsQuery(
    { projectId, dateFrom, dateTo, limit: CHAT_ACTIVITY_TOP_N, offset: 0, sortBy, sortOrder: 'desc' },
    { skip: !projectId },
  );
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const chartRows = useMemo(
    () =>
      (data?.rows || []).slice(0, CHAT_ACTIVITY_TOP_N).map((r, i) => ({
        name: r.chat_name || 'Private chat',
        llm_cost: r.llm_cost || 0,
        total_tokens: r.total_tokens || 0,
        responses: r.responses || 0,
        conversation_uuid: r.conversation_uuid,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data?.rows],
  );

  const dataKey = metric === 'cost' ? 'llm_cost' : metric === 'tokens' ? 'total_tokens' : 'responses';
  const barName = metric === 'cost' ? 'Cost' : metric === 'tokens' ? 'Tokens' : 'Responses';

  const handleBarClick = useCallback(
    barData => {
      if (barData?.activePayload?.[0]?.payload?.conversation_uuid) {
        onBarClick?.(barData.activePayload[0].payload.conversation_uuid);
      }
    },
    [onBarClick],
  );

  const styles = chatTopChartStyles();

  return (
    <Box
      sx={styles.card}
      data-testid="analytics-chats-top-chart"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Top Chats
      </Typography>
      <TabGroupButton
        exclusive
        disableTooltip
        arrayBtn={METRIC_BUTTONS}
        value={metric}
        onChange={(_, val) => val && setMetric(val)}
      />
      <Box sx={styles.chartWrapper}>
        {chartRows.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={chartRows}
              margin={{ left: 5, right: 20, top: 5, bottom: 50 }}
              onClick={handleBarClick}
            >
              <XAxis
                dataKey="name"
                tick={{ ...axisTickStyle, fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={60}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <YAxis
                tick={axisTickStyle}
                axisLine={{ stroke: axisStroke }}
                tickLine={{ stroke: axisStroke }}
              />
              <RechartsTooltip
                cursor={AnalyticCommonHelpers.barChartCursor(palette)}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey={dataKey}
                name={barName}
                radius={[4, 4, 0, 0]}
              >
                {chartRows.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No data for this period
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

ChatTopChart.displayName = 'ChatTopChart';

/** @type {MuiSx} */
const chatTopChartStyles = () => ({
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

export default ChatTopChart;

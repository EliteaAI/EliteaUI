import { memo, useMemo } from 'react';

import { Bar, BarChart, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/analytics/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/analytics/ui';
import { useAnalyticsCostsQuery } from '@/api';

const AnalyticsCosts = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = styles.axisTickStyle(axisStroke);

  const { data, isFetching, isError } = useAnalyticsCostsQuery(
    { projectId, dateFrom, dateTo },
    { skip: !projectId },
  );

  const modelChartData = useMemo(
    () =>
      (data?.by_model || []).slice(0, 15).map((m, i) => ({
        name: m.display_name || m.model_name,
        cost: m.total_cost,
        color: AnalyticsCommonConstants.CHART_COLORS[i % AnalyticsCommonConstants.CHART_COLORS.length],
      })),
    [data?.by_model],
  );

  const dailyChartData = useMemo(
    () => (data?.daily || []).map(d => ({ ...d, date: d.date?.slice(5) })),
    [data?.daily],
  );

  if (isFetching) {
    return (
      <Box sx={styles.centered}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.centered}>
        <Typography color="error">Failed to load cost analytics. Please try again later.</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const kpis = data.kpis ?? {};

  return (
    <Box sx={styles.container}>
      <Box sx={styles.kpiRow}>
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.total_cost)}
          subtitle="LLM spend in period"
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          subtitle="input + output tokens"
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_input_tokens)}
          subtitle="prompt tokens"
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_output_tokens)}
          subtitle="completion tokens"
        />
        <KPICard
          label="AVG COST / CALL"
          value={AnalyticCommonHelpers.fmtCost(kpis.avg_cost_per_call)}
          subtitle="per LLM invocation"
        />
      </Box>

      <Box sx={styles.chartsRow}>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Cost by Model
          </Typography>
          {modelChartData.length ? (
            <Box sx={styles.chartWrapper}>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={modelChartData}
                  layout="vertical"
                >
                  <XAxis
                    type="number"
                    tick={axisTickStyle}
                    tickFormatter={v => AnalyticCommonHelpers.fmtCost(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisTickStyle}
                    width={100}
                  />
                  <RechartsTooltip
                    content={<ChartTooltip formatter={v => AnalyticCommonHelpers.fmtCost(v)} />}
                  />
                  <Bar
                    dataKey="cost"
                    radius={[0, 4, 4, 0]}
                  >
                    {modelChartData.map((entry, i) => (
                      <Cell
                        key={entry.name || i}
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={styles.noDataText}
            >
              No data
            </Typography>
          )}
        </Box>

        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Cost Trend
          </Typography>
          {dailyChartData.length ? (
            <Box sx={styles.chartWrapper}>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={dailyChartData}>
                  <XAxis
                    dataKey="date"
                    tick={axisTickStyle}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    tickFormatter={v => AnalyticCommonHelpers.fmtCost(v)}
                  />
                  <RechartsTooltip
                    content={<ChartTooltip formatter={v => AnalyticCommonHelpers.fmtCost(v)} />}
                  />
                  <Bar
                    dataKey="total_cost"
                    fill={AnalyticsCommonConstants.CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={styles.noDataText}
            >
              No data
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={styles.listsRow}>
        <Box sx={styles.listCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Cost by Agent
          </Typography>
          {(data.by_agent || []).slice(0, AnalyticsCommonConstants.TOP_LIST_SIZE).map((a, i) => (
            <Box
              key={a.entity_id || i}
              sx={styles.listItem}
            >
              <Typography
                variant="body2"
                sx={styles.listLabel}
              >
                {a.entity_name}
              </Typography>
              <Typography
                variant="body2"
                sx={styles.listValue}
              >
                {AnalyticCommonHelpers.fmtCost(a.total_cost)}
              </Typography>
            </Box>
          ))}
          {!data.by_agent?.length && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No data
            </Typography>
          )}
        </Box>

        <Box sx={styles.listCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Cost by User
          </Typography>
          {(data.by_user || []).slice(0, AnalyticsCommonConstants.TOP_LIST_SIZE).map((u, i) => (
            <Box
              key={u.user_id || i}
              sx={styles.listItem}
            >
              <Typography
                variant="body2"
                sx={styles.listLabel}
              >
                {u.user_email}
              </Typography>
              <Typography
                variant="body2"
                sx={styles.listValue}
              >
                {AnalyticCommonHelpers.fmtCost(u.total_cost)}
              </Typography>
            </Box>
          ))}
          {!data.by_user?.length && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No data
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
});

const styles = {
  axisTickStyle: fill => ({ fill, fontSize: 11 }),
  centered: { display: 'flex', justifyContent: 'center', p: 4 },
  noDataText: { p: 2 },
  container: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
  },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: 240 },
  listsRow: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
  },
  listCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  listItem: { display: 'flex', justifyContent: 'space-between', py: 0.5 },
  listLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listValue: { ml: 2, fontVariantNumeric: 'tabular-nums' },
};

AnalyticsCosts.displayName = 'AnalyticsCosts';
export default AnalyticsCosts;

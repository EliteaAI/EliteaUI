import { memo, useMemo } from 'react';

import { Bar, BarChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip, InfoBanner, KPICard, infoBannerTextSx } from '@/[fsd]/features/settings/ui/analytics';
import { useAnalyticsCostsQuery } from '@/api';

const AnalyticsCosts = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = AnalyticCommonHelpers.axisTick(axisStroke);

  const { data, isFetching, isError } = useAnalyticsCostsQuery(
    { projectId, dateFrom, dateTo },
    { skip: !projectId },
  );

  const modelTableData = useMemo(() => {
    const sorted = [...(data?.by_model || [])].sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0));
    const totalCost = sorted.reduce((sum, m) => sum + (m.total_cost ?? 0), 0);
    return sorted.map(m => ({
      name: m.display_name || m.model_name,
      cost: m.total_cost,
      calls: m.calls,
      avgCostPerCall: m.calls > 0 ? m.total_cost / m.calls : null,
      share: totalCost > 0 ? (m.total_cost / totalCost) * 100 : null,
    }));
  }, [data?.by_model]);

  const dailyChartData = useMemo(
    () => (data?.daily || []).map(d => ({ ...d, date: d.date?.slice(5) })),
    [data?.daily],
  );

  // Only blank the whole view on the initial load. On subsequent refetches
  // (e.g. date-range changes) RTK Query keeps the previous `data`, so we keep
  // rendering it instead of flashing a full-view spinner — matching the
  // sibling Analytics tabs.
  if (isFetching && !data) {
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
      <InfoBanner>
        <Typography
          variant="bodyMedium"
          sx={infoBannerTextSx}
        >
          Costs are estimated from a local model-price table; actual provider invoices may differ.
        </Typography>
      </InfoBanner>
      <Box sx={styles.kpiRow}>
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.total_cost)}
          subtitle="estimated LLM spend"
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
          subtitle="estimated per call"
        />
      </Box>

      <Box sx={styles.chartCard}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          Cost by Model
        </Typography>
        {modelTableData.length > 0 ? (
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>Model</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>Cost</Typography>
              <Typography sx={[styles.tableCell, styles.flexOne]}>Calls</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>Avg Cost / Call</Typography>
              <Typography sx={[styles.tableCell, styles.flexOne]}>Share</Typography>
            </Box>
            {modelTableData.map((m, i) => (
              <Box
                key={i}
                sx={styles.tableRow}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {m.name}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(m.cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {m.calls != null ? AnalyticCommonHelpers.fmtNum(m.calls) : '—'}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {m.avgCostPerCall != null ? AnalyticCommonHelpers.fmtCost(m.avgCostPerCall) : '—'}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {m.share != null ? `${m.share.toFixed(1)}%` : '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={styles.noDataText}
          >
            No model cost data is available for the selected date range.
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
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={v => AnalyticCommonHelpers.fmtCost(v)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip
                  content={<ChartTooltip formatter={v => AnalyticCommonHelpers.fmtCost(v)} />}
                />
                <Bar
                  dataKey="total_cost"
                  name="Cost"
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

      <Box sx={styles.listsRow}>
        <Box sx={styles.listCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Cost by Agent & Pipeline
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
              <Box sx={styles.listValueGroup}>
                <Typography
                  variant="body2"
                  sx={styles.listValue}
                >
                  {AnalyticCommonHelpers.fmtCost(a.total_cost)}
                </Typography>
                {a.calls > 0 && (
                  <Typography
                    variant="caption"
                    sx={styles.listValueCaption}
                  >
                    {a.calls} calls · {AnalyticCommonHelpers.fmtCost(a.avg_cost)} avg
                  </Typography>
                )}
              </Box>
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
  centered: { display: 'flex', justifyContent: 'center', p: 4 },
  noDataText: { p: 2 },
  container: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.5rem', display: 'block' }),
  chartWrapper: { width: '100%', overflow: 'hidden', height: 240 },
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.625rem 1rem',
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '1rem',
  }),
  tableCell: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.75rem 1rem',
    gap: '1rem',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  }),
  flexOne: { flex: 1 },
  flexOneHalf: { flex: 1.5 },
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
  listItem: { display: 'flex', justifyContent: 'space-between', py: 0.5, alignItems: 'flex-start' },
  listLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listValue: { ml: 2, fontVariantNumeric: 'tabular-nums' },
  listValueGroup: { ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  listValueCaption: ({ palette }) => ({
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  }),
};

AnalyticsCosts.displayName = 'AnalyticsCosts';
export default AnalyticsCosts;

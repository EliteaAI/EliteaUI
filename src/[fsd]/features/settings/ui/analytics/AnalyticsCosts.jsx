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
      input_cost: m.input_cost,
      output_cost: m.output_cost,
      share: totalCost > 0 ? (m.total_cost / totalCost) * 100 : null,
    }));
  }, [data?.by_model]);

  const agentTableData = useMemo(() => {
    const sorted = [...(data?.by_agent || [])].sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0));
    const totalCost = sorted.reduce((sum, a) => sum + (a.total_cost ?? 0), 0);
    return sorted.map(a => ({
      name: a.entity_name,
      cost: a.total_cost,
      input_cost: a.input_cost,
      output_cost: a.output_cost,
      share: totalCost > 0 ? (a.total_cost / totalCost) * 100 : null,
    }));
  }, [data?.by_agent]);

  const userTableData = useMemo(() => {
    const sorted = [...(data?.by_user || [])].sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0));
    const totalCost = sorted.reduce((sum, u) => sum + (u.total_cost ?? 0), 0);
    return sorted.map(u => ({
      name: u.user_email,
      cost: u.total_cost,
      input_cost: u.input_cost,
      output_cost: u.output_cost,
      share: totalCost > 0 ? (u.total_cost / totalCost) * 100 : null,
    }));
  }, [data?.by_user]);

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
          subtitle="estimated USD cost"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.TOTAL_COST}
        />
        <KPICard
          label="INPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.total_input_cost)}
          subtitle="estimated USD cost"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.INPUT_TOKEN_COST}
        />
        <KPICard
          label="OUTPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.total_output_cost)}
          subtitle="estimated USD cost"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.OUTPUT_TOKEN_COST}
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          subtitle="input + output tokens"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.TOTAL_TOKENS}
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_input_tokens)}
          subtitle="prompt tokens"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.INPUT_TOKENS}
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_output_tokens)}
          subtitle="completion tokens"
          tooltip={AnalyticsCommonConstants.TOOLTIP_TEXTS.costs.OUTPUT_TOKENS}
        />
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

      <Box sx={styles.chartCard}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          Cost by User
        </Typography>
        {userTableData.length > 0 ? (
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>USER</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>TOTAL COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>INPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>OUTPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOne]}>SHARE</Typography>
            </Box>
            {userTableData.map((u, i) => (
              <Box
                key={i}
                sx={styles.tableRow}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {u.name}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(u.cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(u.input_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(u.output_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {u.share != null ? `${u.share.toFixed(1)}%` : '—'}
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
            No user cost data is available for the selected date range.
          </Typography>
        )}
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
              <Typography sx={[styles.tableCell, { flex: 3 }]}>MODEL</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>TOTAL COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>INPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>OUTPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOne]}>SHARE</Typography>
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
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(m.input_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(m.output_cost)}
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
          Cost by Agent & Pipeline
        </Typography>
        {agentTableData.length > 0 ? (
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>AGENT / PIPELINE</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>TOTAL COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>INPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOneHalf]}>OUTPUT TOKEN COST</Typography>
              <Typography sx={[styles.tableCell, styles.flexOne]}>SHARE</Typography>
            </Box>
            {agentTableData.map((a, i) => (
              <Box
                key={i}
                sx={styles.tableRow}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {a.name}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(a.cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(a.input_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOneHalf]}>
                  {AnalyticCommonHelpers.fmtCost(a.output_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {a.share != null ? `${a.share.toFixed(1)}%` : '—'}
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
            No agent & pipeline cost data is available for the selected date range.
          </Typography>
        )}
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
    padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${palette.border.table}`,
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
    gap: '0.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  flexOne: { flex: 1 },
  flexOneHalf: { flex: 1.5 },
};

AnalyticsCosts.displayName = 'AnalyticsCosts';
export default AnalyticsCosts;

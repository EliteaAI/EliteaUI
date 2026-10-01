import { memo, useMemo } from 'react';

import { Bar, BarChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip, InfoBanner, KPICard, infoBannerTextSx } from '@/[fsd]/features/settings/ui/analytics';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useAnalyticsCostsQuery } from '@/api';

import CostTable from './components/CostTable';
import EntityKindChip from './components/EntityKindChip';
import RunAnalyticsEmptyState from './components/RunAnalyticsEmptyState';

const toCostRows = (items, mapRow) => {
  const sorted = [...(items || [])].sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0));
  const totalCost = sorted.reduce((sum, item) => sum + (item.total_cost ?? 0), 0);
  return sorted.map(item => ({
    ...mapRow(item),
    cost: item.total_cost,
    input_cost: item.input_cost,
    output_cost: item.output_cost,
    cache_read_cost: item.cache_read_cost,
    cache_creation_cost: item.cache_creation_cost,
    share: totalCost > 0 ? (item.total_cost / totalCost) * 100 : null,
    below: item.below_resolution || {},
  }));
};

const TYPE_COLUMN = {
  key: 'kind',
  header: 'TYPE',
  flex: 1,
  render: row => <EntityKindChip kind={row.kind} />,
};

const EVALUATION_COLUMNS = [
  TYPE_COLUMN,
  { key: 'version', header: 'VERSION', flex: 1.5, render: row => row.version || '—' },
  { key: 'runs', header: 'RUNS', flex: 1, render: row => AnalyticCommonHelpers.fmtNum(row.runs) },
];

const AnalyticsCosts = memo(props => {
  const { projectId, dateFrom, dateTo, runScope } = props;

  // Run-scoped (Run History → Analytics): no daily trend, no per-Agent breakdown, run wording
  const isRunScope = Boolean(runScope);
  const tooltips = (isRunScope ? runScope.tooltips : AnalyticsCommonConstants.TOOLTIP_TEXTS).costs;
  const scopeText = isRunScope ? runScope.scopeLabel : 'the selected date range';

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = AnalyticCommonHelpers.axisTick(axisStroke);

  const { data, isFetching, isError } = useAnalyticsCostsQuery(
    isRunScope ? { projectId, ...runScope.queryArgs } : { projectId, dateFrom, dateTo },
    { skip: !projectId },
  );

  const modelTableData = useMemo(
    () => toCostRows(data?.by_model, m => ({ name: m.display_name || m.model_name })),
    [data?.by_model],
  );

  const agentTableData = useMemo(
    () => toCostRows(data?.by_agent, a => ({ name: a.entity_name, kind: a.entity_kind })),
    [data?.by_agent],
  );

  const userTableData = useMemo(
    () => toCostRows(data?.by_user, u => ({ name: u.user_email })),
    [data?.by_user],
  );

  const evaluationTableData = useMemo(
    () =>
      toCostRows(data?.by_evaluation, e => ({
        name: e.entity_name,
        kind: e.entity_kind,
        version: e.version_name,
        runs: e.eval_runs,
      })),
    [data?.by_evaluation],
  );

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
  const evaluationShare =
    kpis.total_cost > 0 ? ((kpis.total_evaluation_cost ?? 0) / kpis.total_cost) * 100 : null;

  if (isRunScope && !userTableData.length && !modelTableData.length && !kpis.total_cost) {
    return (
      <RunAnalyticsEmptyState
        message={runScope.noDataMessage}
        testId="run-analytics-costs-empty"
      />
    );
  }

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
          value={AnalyticCommonHelpers.fmtCost(kpis.total_cost, kpis.below_resolution?.total_cost)}
          subtitle="estimated USD cost"
          tooltip={tooltips.TOTAL_COST}
        />
        <KPICard
          label="INPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(
            kpis.total_input_cost,
            kpis.below_resolution?.total_input_cost,
          )}
          subtitle="estimated USD cost"
          tooltip={tooltips.INPUT_TOKEN_COST}
        />
        <KPICard
          label="OUTPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(
            kpis.total_output_cost,
            kpis.below_resolution?.total_output_cost,
          )}
          subtitle="estimated USD cost"
          tooltip={tooltips.OUTPUT_TOKEN_COST}
        />
        <KPICard
          label="CACHE READ COST"
          value={AnalyticCommonHelpers.fmtCost(
            kpis.total_cache_read_cost,
            kpis.below_resolution?.total_cache_read_cost,
          )}
          subtitle="estimated USD cost"
          tooltip={tooltips.CACHE_READ_COST}
        />
        <KPICard
          label="CACHE WRITE COST"
          value={AnalyticCommonHelpers.fmtCost(
            kpis.total_cache_creation_cost,
            kpis.below_resolution?.total_cache_creation_cost,
          )}
          subtitle="estimated USD cost"
          tooltip={tooltips.CACHE_WRITE_COST}
        />
        {!isRunScope && (
          <KPICard
            label="EVALUATION COST"
            value={AnalyticCommonHelpers.fmtCost(
              kpis.total_evaluation_cost,
              kpis.below_resolution?.total_evaluation_cost,
            )}
            subtitle={
              evaluationShare != null ? `${evaluationShare.toFixed(1)}% of total cost` : 'estimated USD cost'
            }
            tooltip={tooltips.EVALUATION_COST}
            testId="analytics-costs-evaluation-kpi"
          />
        )}
      </Box>

      {!isRunScope && (
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
                    cursor={AnalyticCommonHelpers.barChartCursor(palette)}
                    content={<ChartTooltip formatter={v => AnalyticCommonHelpers.fmtCost(v)} />}
                  />
                  <Bar
                    dataKey="total_cost"
                    name="Total Cost"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="input_cost"
                    name="Input Token Cost"
                    fill={CHART_COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="output_cost"
                    name="Output Token Cost"
                    fill={CHART_COLORS[2]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cache_read_cost"
                    name="Cache Read Cost"
                    fill={CHART_COLORS[3]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cache_creation_cost"
                    name="Cache Write Cost"
                    fill={CHART_COLORS[4]}
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
      )}

      <CostTable
        title="Cost by User"
        nameHeader="USER"
        rows={userTableData}
        emptyState={`No user cost data is available for ${scopeText}.`}
      />

      <CostTable
        title="Cost by Model"
        nameHeader="MODEL"
        rows={modelTableData}
        emptyState={`No model cost data is available for ${scopeText}.`}
      />

      {!isRunScope && (
        <CostTable
          title="Cost by Agent & Pipeline"
          tooltip={tooltips.BY_AGENT_PIPELINE}
          nameHeader="AGENT / PIPELINE"
          rows={agentTableData}
          extraColumns={[TYPE_COLUMN]}
          emptyState="No agent & pipeline cost data is available for the selected date range."
        />
      )}

      {!isRunScope && (
        <CostTable
          title="Cost by Evaluation"
          tooltip={tooltips.BY_EVALUATION}
          nameHeader="AGENT / PIPELINE"
          rows={evaluationTableData}
          extraColumns={EVALUATION_COLUMNS}
          emptyState="No evaluation cost data is available for the selected date range."
          testId="analytics-costs-by-evaluation"
        />
      )}
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
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.5rem', display: 'block' }),
  chartWrapper: { width: '100%', overflow: 'hidden', height: 240 },
};

AnalyticsCosts.displayName = 'AnalyticsCosts';
export default AnalyticsCosts;

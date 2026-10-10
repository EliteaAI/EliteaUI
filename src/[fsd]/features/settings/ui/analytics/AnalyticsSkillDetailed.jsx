import { memo, useCallback, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, CircularProgress, IconButton, Link, Tooltip, Typography, useTheme } from '@mui/material';

import { useAnalyticsSkillDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import {
  AnalyticCommonHelpers,
  AnalyticsExportHelpers,
  SkillAnalyticsHelpers,
} from '@/[fsd]/features/settings/lib/helpers';
import ChartTooltip from '@/[fsd]/features/settings/ui/analytics/components/ChartTooltip';
import DeletedChip from '@/[fsd]/features/settings/ui/analytics/components/DeletedChip';
import EntityKindChip from '@/[fsd]/features/settings/ui/analytics/components/EntityKindChip';
import KPICard from '@/[fsd]/features/settings/ui/analytics/components/KpiCard';
import SkillBreakdownTable from '@/[fsd]/features/settings/ui/analytics/components/SkillBreakdownTable';
import { analyticsTableStyles } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import DownloadIcon from '@/assets/download.svg?react';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import { useSelectedProjectName } from '@/hooks/useSelectedProject';

const fmtDateTime = iso => (iso ? new Date(iso).toLocaleString() : '—');

const fmtNum = AnalyticCommonHelpers.fmtNum;
const fmtCost = AnalyticCommonHelpers.fmtCost;

const USAGE_COLUMNS = [
  { key: 'runs', label: 'Runs', render: r => fmtNum(r.runs) },
  { key: 'in_agent_uses', label: 'In-Agent Uses', render: r => fmtNum(r.in_agent_uses) },
  { key: 'total_tokens', label: 'Tokens', render: r => fmtNum(r.total_tokens) },
  { key: 'cost', label: 'Cost', render: r => fmtCost(r.cost) },
];

const usageTable = firstColumn => [{ flex: 2.5, ...firstColumn }, ...USAGE_COLUMNS];

const VERSION_COLUMNS = usageTable({
  key: 'version_name',
  label: 'Version',
  render: r => SkillAnalyticsHelpers.skillVersionLabel(r.version_name),
});

const USER_COLUMNS = usageTable({
  key: 'user_email',
  label: 'User',
  render: r => r.user_email || `User ${r.user_id}`,
});

const TRIGGER_COLUMNS = usageTable({
  key: 'trigger_source',
  label: 'Trigger',
  render: r => SkillAnalyticsHelpers.skillTriggerLabel(r.trigger_source),
});

const MODEL_COLUMNS = [
  { key: 'display_name', label: 'Model', flex: 2.5 },
  { key: 'runs', label: 'Runs', render: r => fmtNum(r.runs) },
  { key: 'calls', label: 'Calls', render: r => fmtNum(r.calls) },
  { key: 'total_tokens', label: 'Tokens', render: r => fmtNum(r.total_tokens) },
  { key: 'cost', label: 'Cost', render: r => fmtCost(r.cost) },
];

const SOURCE_COLUMNS = [
  {
    key: 'source',
    label: 'Activation',
    flex: 2.5,
    render: r => SkillAnalyticsHelpers.skillSourceLabel(r.source),
  },
  { key: 'uses', label: 'Uses', render: r => fmtNum(r.uses) },
];

const AnalyticsSkillDetailed = memo(props => {
  const { projectId, skillId, skillProjectId, dateFrom, dateTo, onBack } = props;

  const styles = analyticsSkillDetailedStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };
  const projectName = useSelectedProjectName();
  const [exporting, setExporting] = useState(false);

  const { data, isFetching, isError } = useAnalyticsSkillDetailQuery(
    { projectId, skillId, skillProjectId, dateFrom, dateTo },
    { skip: !projectId || !skillId },
  );

  const agentColumns = [
    {
      key: 'entity_name',
      label: 'Agent / Pipeline',
      flex: 2.5,
      render: agent => {
        const path = SkillAnalyticsHelpers.skillAgentPath(agent, projectId);
        return path ? (
          <Link
            component={RouterLink}
            to={path}
            sx={styles.link}
            data-testid="analytics-skill-detail-agent-link"
          >
            {agent.entity_name}
          </Link>
        ) : (
          agent.entity_name
        );
      },
    },
    { key: 'kind', label: 'Type', render: agent => <EntityKindChip kind={agent.kind} /> },
    { key: 'uses', label: 'Uses', render: agent => fmtNum(agent.uses) },
    { key: 'runs', label: 'Agent Runs', render: agent => fmtNum(agent.runs) },
    { key: 'last_used', label: 'Last Used', flex: 1.5, render: agent => fmtDateTime(agent.last_used) },
  ];

  const recentRunColumns = [
    {
      key: 'started_at',
      label: 'Started',
      flex: 1.5,
      render: run => {
        const path = SkillAnalyticsHelpers.skillRunAnalyticsPath(data, run, projectId);
        return path ? (
          <Link
            component={RouterLink}
            to={path}
            sx={styles.link}
            data-testid="analytics-skill-detail-run-link"
          >
            {fmtDateTime(run.started_at)}
          </Link>
        ) : (
          fmtDateTime(run.started_at)
        );
      },
    },
    { key: 'user_email', label: 'User', flex: 1.5, render: run => run.user_email || `User ${run.user_id}` },
    {
      key: 'version_name',
      label: 'Version',
      render: run => SkillAnalyticsHelpers.skillVersionLabel(run.version_name),
    },
    { key: 'model_name', label: 'Model', flex: 1.5 },
    { key: 'total_tokens', label: 'Tokens', render: run => fmtNum(run.total_tokens) },
    { key: 'cost', label: 'Cost', render: run => fmtCost(run.cost) },
    {
      key: 'is_error',
      label: 'Status',
      render: run => (
        <Box
          component="span"
          sx={run.is_error ? styles.errorValue : undefined}
        >
          {run.is_error ? 'Error' : 'Success'}
        </Box>
      ),
    },
  ];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await exportToExcel(
        AnalyticsExportHelpers.skillAnalyticsExportFileName({
          projectName,
          skillName: data.skill_name,
          dateFrom,
          dateTo,
        }),
        [AnalyticsExportHelpers.buildSkillDetailSheet(data, { projectName, dateFrom, dateTo, timeZone })],
      );
    } finally {
      setExporting(false);
    }
  }, [data, dateFrom, dateTo, projectName]);

  if (isFetching)
    return (
      <Box
        sx={styles.loadingState}
        data-testid="analytics-skill-detail-loading-indicator"
      >
        <CircularProgress size={32} />
      </Box>
    );

  if (!data)
    return (
      <Box sx={styles.content}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={styles.backButton}
          data-testid="analytics-skill-detail-back-button"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
          data-testid="analytics-skill-detail-empty"
        >
          {isError ? 'No usage of this skill in the selected period.' : 'No data found.'}
        </Typography>
      </Box>
    );

  const {
    kpis = {},
    daily = [],
    by_version = [],
    by_model = [],
    by_user = [],
    by_trigger_source = [],
    agents = [],
    by_source = [],
    recent_runs = [],
  } = data;

  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.skillDetail;

  return (
    <Box sx={styles.content}>
      <Box sx={styles.titleRow}>
        <IconButton
          onClick={onBack}
          size="small"
          data-testid="analytics-skill-detail-back-button"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={analyticsTableStyles.chartTitle}
          data-testid="analytics-skill-detail-title"
        >
          {data.skill_name}
        </Typography>
        {data.deleted && <DeletedChip testId="analytics-skill-detail-deleted" />}
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export skill to Excel'}
          placement="top"
        >
          <Box
            component="span"
            sx={styles.exportButton}
          >
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              color="secondary"
              onClick={handleExport}
              disabled={exporting}
              aria-label="Export skill to Excel"
              data-testid="analytics-skill-detail-export-button"
              startIcon={exporting ? <CircularProgress size="1rem" /> : <DownloadIcon sx={styles.icon} />}
            />
          </Box>
        </Tooltip>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="RUNS"
          value={fmtNum(kpis.runs)}
          tooltip={tt.RUNS}
          testId="analytics-skill-detail-kpi-runs"
          valueTestId="analytics-skill-detail-kpi-runs-value"
        />
        <KPICard
          label="IN-AGENT USES"
          value={fmtNum(kpis.in_agent_uses)}
          tooltip={tt.IN_AGENT_USES}
          testId="analytics-skill-detail-kpi-in-agent-uses"
          valueTestId="analytics-skill-detail-kpi-in-agent-uses-value"
        />
        <KPICard
          label="UNIQUE USERS"
          value={fmtNum(kpis.users)}
          tooltip={tt.UNIQUE_USERS}
          testId="analytics-skill-detail-kpi-users"
          valueTestId="analytics-skill-detail-kpi-users-value"
        />
        <KPICard
          label="AGENTS USING"
          value={fmtNum(kpis.agents_using)}
          tooltip={tt.AGENTS_USING}
          testId="analytics-skill-detail-kpi-agents"
          valueTestId="analytics-skill-detail-kpi-agents-value"
        />
        <KPICard
          label="TOTAL COST"
          value={fmtCost(kpis.cost)}
          subtitle="estimated"
          tooltip={tt.TOTAL_COST}
          testId="analytics-skill-detail-kpi-cost"
          valueTestId="analytics-skill-detail-kpi-cost-value"
        />
        <KPICard
          label="TOTAL TOKENS"
          value={fmtNum(kpis.total_tokens)}
          tooltip={tt.TOTAL_TOKENS}
          testId="analytics-skill-detail-kpi-tokens"
          valueTestId="analytics-skill-detail-kpi-tokens-value"
        />
        <KPICard
          label="AVG LATENCY"
          value={AnalyticCommonHelpers.fmtDuration(kpis.avg_duration_ms)}
          tooltip={tt.AVG_LATENCY}
          testId="analytics-skill-detail-kpi-latency"
          valueTestId="analytics-skill-detail-kpi-latency-value"
        />
        <KPICard
          label="ERRORS"
          value={fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
          tooltip={tt.ERRORS}
          testId="analytics-skill-detail-kpi-errors"
          valueTestId="analytics-skill-detail-kpi-errors-value"
        />
      </Box>

      {daily.length > 0 && (
        <Box sx={analyticsTableStyles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={analyticsTableStyles.chartTitle}
            data-testid="analytics-skill-detail-trend-title"
          >
            Runs and Uses by Day
          </Typography>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-skill-detail-trend"
          >
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={daily}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={d => d?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="count"
                  allowDecimals={false}
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="cost"
                  orientation="right"
                  tick={axisTickStyle}
                  tickFormatter={value => fmtCost(value)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="runs"
                  name="Runs"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="in_agent_uses"
                  name="In-agent uses"
                  stroke={palette.text.accent}
                  fill={palette.text.accent}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="cost"
                  type="monotone"
                  dataKey="cost"
                  name="Cost (USD)"
                  stroke={palette.status.published}
                  fill={palette.status.published}
                  fillOpacity={0.05}
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      <Box sx={styles.grid}>
        <SkillBreakdownTable
          title="Versions"
          tooltip={tt.VERSIONS}
          columns={VERSION_COLUMNS}
          rows={by_version}
          testId="analytics-skill-detail-versions"
        />
        <SkillBreakdownTable
          title="Models"
          tooltip={tt.MODELS}
          columns={MODEL_COLUMNS}
          rows={by_model}
          emptyText="No model calls from skill runs"
          testId="analytics-skill-detail-models"
        />
        <SkillBreakdownTable
          title="Users"
          tooltip={tt.USERS}
          columns={USER_COLUMNS}
          rows={by_user}
          testId="analytics-skill-detail-users"
        />
        <SkillBreakdownTable
          title="Trigger Sources"
          tooltip={tt.TRIGGERS}
          columns={TRIGGER_COLUMNS}
          rows={by_trigger_source}
          testId="analytics-skill-detail-triggers"
        />
        <SkillBreakdownTable
          title="Used by Agents"
          tooltip={tt.AGENTS}
          columns={agentColumns}
          rows={agents}
          emptyText="No agent used this skill in the selected period"
          testId="analytics-skill-detail-agents"
        />
        <SkillBreakdownTable
          title="Load vs Mention"
          tooltip={tt.SOURCES}
          subtitle={
            kpis.avg_est_body_tokens
              ? `~${fmtNum(Math.round(kpis.avg_est_body_tokens))} instruction tokens per use`
              : undefined
          }
          columns={SOURCE_COLUMNS}
          rows={by_source}
          emptyText="No in-agent uses in the selected period"
          testId="analytics-skill-detail-sources"
        />
      </Box>

      <SkillBreakdownTable
        title="Recent Runs"
        tooltip={tt.RECENT_RUNS}
        columns={recentRunColumns}
        rows={recent_runs.map(run => ({ ...run, key: run.run_id }))}
        emptyText="No runs in the selected period"
        testId="analytics-skill-detail-recent-runs"
      />
    </Box>
  );
});

AnalyticsSkillDetailed.displayName = 'AnalyticsSkillDetailed';

/** @type {MuiSx} */
const analyticsSkillDetailedStyles = () => ({
  content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  backButton: { alignSelf: 'flex-start' },
  exportButton: { marginLeft: 'auto' },
  icon: { fontSize: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
    gap: '1rem',
    alignItems: 'stretch',
  },
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: '12.5rem' },
  link: ({ palette }) => ({ color: palette.text.accent, cursor: 'pointer' }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default AnalyticsSkillDetailed;

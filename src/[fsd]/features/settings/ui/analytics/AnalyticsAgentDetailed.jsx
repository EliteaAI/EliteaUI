import { memo, useCallback, useEffect, useState } from 'react';

import { useStore } from 'react-redux';
import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { analyticsApi, useAnalyticsAgentDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import {
  AgentAnalyticsHelpers,
  AnalyticCommonHelpers,
  AnalyticsExportHelpers,
} from '@/[fsd]/features/settings/lib/helpers';
import {
  ChartTooltip,
  DeletedChip,
  KPICard,
  SkillBreakdownTable,
} from '@/[fsd]/features/settings/ui/analytics';
import AgentRecentRunsTable from '@/[fsd]/features/settings/ui/analytics/components/AgentRecentRunsTable';
import { analyticsTableSortLabelSx } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { useClientSort, useSelectedProjectName, useSortedRows } from '@/[fsd]/shared/lib/hooks';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import DownloadIcon from '@/assets/download.svg?react';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

const HTTP_NOT_FOUND = 404;

const { AGENT_DETAIL_EMPTY_MESSAGE } = AnalyticsCommonConstants;

const fmtNum = AnalyticCommonHelpers.fmtNum;
const fmtCost = AnalyticCommonHelpers.fmtCost;

const USAGE_COLUMNS = [
  { key: 'runs', label: 'Runs', render: row => fmtNum(row.runs) },
  { key: 'total_tokens', label: 'Total Tokens', render: row => fmtNum(row.total_tokens) },
  { key: 'cost', label: 'Cost', render: row => fmtCost(row.cost) },
];

const VERSION_COLUMNS = [
  {
    key: 'version_name',
    label: 'Version',
    flex: 2.5,
    sortValue: row => AnalyticCommonHelpers.formatVersionLabel(row.version_name),
    render: row => AnalyticCommonHelpers.formatVersionLabel(row.version_name),
  },
  ...USAGE_COLUMNS,
];

const MODEL_COLUMNS = [
  {
    key: 'display_name',
    label: 'Model',
    flex: 2.5,
    sortValue: AgentAnalyticsHelpers.formatAgentModelLabel,
    render: AgentAnalyticsHelpers.formatAgentModelLabel,
  },
  USAGE_COLUMNS[0],
  { key: 'calls', label: 'LLM Calls', render: row => fmtNum(row.calls) },
  ...USAGE_COLUMNS.slice(1),
];

const TRIGGER_COLUMNS = [
  {
    key: 'trigger_source',
    label: 'Trigger',
    flex: 2.5,
    sortValue: row => AnalyticCommonHelpers.formatTriggerLabel(row.trigger_source),
    render: row => AnalyticCommonHelpers.formatTriggerLabel(row.trigger_source),
  },
  ...USAGE_COLUMNS,
];

const readColumnSortValue = columns => (row, key) => {
  const column = columns.find(candidate => candidate.key === key);
  return column?.sortValue ? column.sortValue(row) : row[key];
};

const readVersionSortValue = readColumnSortValue(VERSION_COLUMNS);
const readModelSortValue = readColumnSortValue(MODEL_COLUMNS);
const readTriggerSortValue = readColumnSortValue(TRIGGER_COLUMNS);

const versionRowsWithKeys = versions =>
  versions.map((version, index) => ({ ...version, key: version.version_id ?? `unknown-${index}` }));

const modelRowsWithKeys = models =>
  models.map((model, index) => ({ ...model, key: model.model_name ?? `unknown-${index}` }));

const triggerRowsWithKeys = triggers =>
  triggers.map((trigger, index) => ({ ...trigger, key: trigger.trigger_source ?? `manual-${index}` }));

const skillNameStyles = {
  cell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  name: { minWidth: 0 },
};

const SKILL_COLUMNS = [
  {
    key: 'skill_name',
    label: 'Skill',
    flex: 3,
    render: skill => (
      <Box sx={skillNameStyles.cell}>
        <Typography
          component="span"
          sx={skillNameStyles.name}
          noWrap
        >
          {skill.skill_name}
        </Typography>
        {skill.deleted && <DeletedChip testId="analytics-agent-detail-skill-deleted" />}
      </Box>
    ),
  },
  { key: 'uses', label: 'Uses', flex: 1, render: skill => AnalyticCommonHelpers.fmtNum(skill.uses) },
];

const USER_COLUMNS = [
  { key: 'user_email', label: 'User', flex: 3 },
  { key: 'events', label: 'Runs', flex: 1 },
  { key: 'avg_duration_ms', label: 'Avg Latency', flex: 1 },
  { key: 'errors', label: 'Errors', flex: 1 },
];

const TOOL_COLUMNS = [
  { key: 'tool_name', label: 'Tool', flex: 3 },
  { key: 'calls', label: 'Calls', flex: 1 },
];

const skillRowsWithKeys = skills =>
  skills.map(skill => ({ ...skill, key: `${skill.skill_project_id}-${skill.skill_id}` }));

const skillsSubtitle = (skills, skillsTotal, skillsTruncated) =>
  skillsTruncated
    ? `Top ${skills.length} of ${skillsTotal} skills used by this agent / pipeline`
    : `${skills.length} skills used by this agent / pipeline`;

const AnalyticAgentDetailed = memo(props => {
  const { projectId, entityId, dateFrom, dateTo, onBack, canViewSkills = false } = props;

  const styles = analyticsAgentDetailedStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };
  const store = useStore();
  const projectName = useSelectedProjectName();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    setExportError(false);
  }, [entityId, dateFrom, dateTo]);

  const { data, isFetching, error } = useAnalyticsAgentDetailQuery(
    { projectId, entityId, dateFrom, dateTo },
    { skip: !projectId || !entityId },
  );

  const {
    entity_name,
    kind,
    kpis,
    evaluation,
    users = [],
    tools = [],
    skills = [],
    skills_total,
    skills_truncated = false,
    daily_usage = [],
    by_version = [],
    by_model = [],
    by_trigger_source = [],
  } = data ?? {};

  const { sort: userSort, handleSort: handleUserSort } = useClientSort('events');
  const { sort: toolSort, handleSort: handleToolSort } = useClientSort('calls');

  const defaultGetValue = useCallback((row, key) => row[key], []);

  const sortedUsers = useSortedRows(users, userSort, defaultGetValue);
  const sortedTools = useSortedRows(tools, toolSort, defaultGetValue);

  const { sort: versionSort, handleSort: handleVersionSort } = useClientSort('runs');
  const { sort: modelSort, handleSort: handleModelSort } = useClientSort('total_tokens');
  const { sort: triggerSort, handleSort: handleTriggerSort } = useClientSort('runs');

  const sortedVersions = useSortedRows(by_version, versionSort, readVersionSortValue);
  const sortedModels = useSortedRows(by_model, modelSort, readModelSortValue);
  const sortedTriggers = useSortedRows(by_trigger_source, triggerSort, readTriggerSortValue);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);
    try {
      const entity = {
        agentId: entityId,
        kind: data.kind,
        projectId,
      };
      const { runs, total, truncated } = await AnalyticsExportHelpers.fetchAllAgentRuns(
        store.dispatch,
        analyticsApi.endpoints,
        {
          projectId,
          entityId,
          dateFrom,
          dateTo,
        },
      );
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await exportToExcel(
        AnalyticsExportHelpers.buildAgentAnalyticsExportFileName({
          projectName,
          entityName: data.entity_name,
          kind: data.kind,
          dateFrom,
          dateTo,
        }),
        [
          AnalyticsExportHelpers.buildAgentDetailSheet(data, {
            runs: runs.map(run => ({
              ...run,
              run_url: AgentAnalyticsHelpers.buildAgentRunAnalyticsUrl(entity, run),
            })),
            runsTotal: total,
            runsTruncated: truncated,
            includeSkills: canViewSkills,
            projectName,
            dateFrom,
            dateTo,
            timeZone,
          }),
        ],
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }, [store, data, entityId, projectId, dateFrom, dateTo, projectName, canViewSkills]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

  if (isFetching)
    return (
      <Box
        sx={styles.loadingState}
        data-testid="analytics-agent-detail-loading-indicator"
      >
        <CircularProgress size={32} />
      </Box>
    );

  if (!data)
    return (
      <Box sx={styles.agentDetailedContent}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={styles.backButton}
          data-testid="analytics-agent-detail-back-button"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
          data-testid="analytics-agent-detail-empty"
        >
          {error?.status === HTTP_NOT_FOUND
            ? AGENT_DETAIL_EMPTY_MESSAGE
            : 'Failed to load Agent or Pipeline analytics.'}
        </Typography>
      </Box>
    );

  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.agentDetail;

  return (
    <Box sx={styles.agentDetailedContent}>
      <Box sx={styles.titleRow}>
        <IconButton
          onClick={onBack}
          size="small"
          data-testid="analytics-agent-detail-back-button"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
          data-testid="analytics-agent-detail-title"
        >
          {entity_name}
        </Typography>
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export Agent or Pipeline to Excel'}
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
              aria-label="Export Agent or Pipeline to Excel"
              data-testid="analytics-agent-detail-export-button"
              startIcon={exporting ? <CircularProgress size="1rem" /> : <DownloadIcon sx={styles.icon} />}
            />
          </Box>
        </Tooltip>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="TOTAL RUNS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_events)}
          tooltip={tt.TOTAL_RUNS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="UNIQUE USERS"
          value={AnalyticCommonHelpers.fmtNum(kpis.unique_users)}
          tooltip={tt.UNIQUE_USERS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.llm_cost)}
          subtitle="estimated"
          tooltip={tt.TOTAL_COST}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="INPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.input_cost)}
          subtitle="estimated"
          tooltip={tt.INPUT_TOKEN_COST}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="OUTPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.output_cost)}
          subtitle="estimated"
          tooltip={tt.OUTPUT_TOKEN_COST}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          tooltip={tt.TOTAL_TOKENS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.input_tokens)}
          tooltip={tt.INPUT_TOKENS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.output_tokens)}
          tooltip={tt.OUTPUT_TOKENS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="CACHE READ TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.cache_read_tokens)}
          tooltip={tt.CACHE_READ_TOKENS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="CACHE WRITE TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.cache_creation_tokens)}
          tooltip={tt.CACHE_WRITE_TOKENS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        {evaluation && (
          <KPICard
            label="EVALUATION TOKENS"
            value={(evaluation.total_tokens ?? 0).toLocaleString()}
            subtitle={`across ${evaluation.runs ?? 0} evaluation run${evaluation.runs === 1 ? '' : 's'}`}
            tooltip={tt.EVALUATION_TOKENS}
            testId="analytics-agent-detail-evaluation-kpi"
          />
        )}
        <KPICard
          label="CACHE READ COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.cache_read_cost)}
          subtitle="estimated"
          tooltip={tt.CACHE_READ_COST}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="CACHE WRITE COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.cache_creation_cost)}
          subtitle="estimated"
          tooltip={tt.CACHE_WRITE_COST}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="AVG LATENCY"
          value={AnalyticCommonHelpers.fmtDuration(kpis.avg_duration_ms)}
          tooltip={tt.AVG_LATENCY}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
        <KPICard
          label="ERRORS"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
          tooltip={tt.ERRORS}
          testId="analytics-agent-detail-kpi-card"
          valueTestId="analytics-agent-detail-kpi-value"
        />
      </Box>

      {daily_usage.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
            data-testid="analytics-agent-detail-chart-title"
          >
            Runs by Day
          </Typography>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-agent-detail-chart-container"
          >
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={daily_usage}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={d => d?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="runs"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="errors"
                  orientation="right"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="runs"
                  type="monotone"
                  dataKey="events"
                  name="Runs"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="errors"
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke={palette.status.rejected}
                  fill={palette.status.rejected}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      <Box sx={styles.chartsGrid}>
        <SkillBreakdownTable
          title="Versions"
          tooltip={tt.VERSIONS_SECTION}
          columns={VERSION_COLUMNS}
          rows={versionRowsWithKeys(sortedVersions)}
          emptyText={AGENT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-agent-detail-versions"
          sortBy={versionSort.sortBy}
          sortOrder={versionSort.sortOrder}
          onSort={handleVersionSort}
        />
        <SkillBreakdownTable
          title="Models"
          tooltip={tt.MODELS_SECTION}
          columns={MODEL_COLUMNS}
          rows={modelRowsWithKeys(sortedModels)}
          emptyText={AGENT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-agent-detail-models"
          sortBy={modelSort.sortBy}
          sortOrder={modelSort.sortOrder}
          onSort={handleModelSort}
        />
        <Box
          sx={styles.chartCard}
          data-testid="analytics-agent-detail-users-panel"
        >
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Users
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {users.length} users used this agent / pipeline
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.USERS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              {USER_COLUMNS.map(col => (
                <Box
                  key={col.key}
                  sx={[styles.tableCell, { flex: col.flex }]}
                >
                  <TableSortLabel
                    active={userSort.sortBy === col.key}
                    direction={userSort.sortBy === col.key ? userSort.sortOrder : 'desc'}
                    onClick={() => handleUserSort(col.key)}
                    sx={analyticsTableSortLabelSx}
                  >
                    {col.label}
                  </TableSortLabel>
                </Box>
              ))}
            </Box>
            <Box sx={styles.fixedScrollList}>
              {sortedUsers.map((u, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {u.user_email || `User ${u.user_id}`}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(u.events)}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtDuration(u.avg_duration_ms)}
                  </Typography>
                  <Typography
                    sx={[
                      styles.tableCellValue,
                      { flex: 1, color: u.errors > 0 ? palette.status.rejected : undefined },
                    ]}
                  >
                    {u.errors}
                  </Typography>
                </Box>
              ))}
              {!users.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No runs recorded
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box
          sx={styles.chartCard}
          data-testid="analytics-agent-detail-tools-panel"
        >
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Tools
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {tools.length} tools used by this agent / pipeline
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.TOOLS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              {TOOL_COLUMNS.map(col => (
                <Box
                  key={col.key}
                  sx={[styles.tableCell, { flex: col.flex }]}
                >
                  <TableSortLabel
                    active={toolSort.sortBy === col.key}
                    direction={toolSort.sortBy === col.key ? toolSort.sortOrder : 'desc'}
                    onClick={() => handleToolSort(col.key)}
                    sx={analyticsTableSortLabelSx}
                  >
                    {col.label}
                  </TableSortLabel>
                </Box>
              ))}
            </Box>
            <Box sx={styles.fixedScrollList}>
              {sortedTools.map((t, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {t.tool_name}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(t.calls)}
                  </Typography>
                </Box>
              ))}
              {!tools.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No tool data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        {canViewSkills && (
          <SkillBreakdownTable
            title="Skills"
            tooltip={tt.SKILLS_SECTION}
            subtitle={skillsSubtitle(skills, skills_total, skills_truncated)}
            columns={SKILL_COLUMNS}
            rows={skillRowsWithKeys(skills)}
            emptyText="No skill data"
            testId="analytics-agent-detail-skills-panel"
          />
        )}
        <SkillBreakdownTable
          title="Trigger Sources"
          tooltip={tt.TRIGGERS_SECTION}
          columns={TRIGGER_COLUMNS}
          rows={triggerRowsWithKeys(sortedTriggers)}
          emptyText={AGENT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-agent-detail-triggers"
          sortBy={triggerSort.sortBy}
          sortOrder={triggerSort.sortOrder}
          onSort={handleTriggerSort}
        />
      </Box>

      <AgentRecentRunsTable
        key={`${entityId}-${dateFrom}-${dateTo}`}
        projectId={projectId}
        entityId={entityId}
        kind={kind}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <Snackbar
        open={exportError}
        autoHideDuration={8000}
        onClose={handleCloseExportError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseExportError}
          severity="error"
          variant="filled"
          data-testid="analytics-agent-detail-export-error"
        >
          Unable to export Agent or Pipeline analytics. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
});

AnalyticAgentDetailed.displayName = 'AnalyticAgentDetailed';

/** @type {MuiSx} */
const analyticsAgentDetailedStyles = () => ({
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  backButton: { alignSelf: 'flex-start' },
  exportButton: { marginLeft: 'auto' },
  icon: { fontSize: '1rem' },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
    gap: '1rem',
    alignItems: 'stretch',
  },
  agentDetailedContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: 200 },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
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
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  fixedScrollList: { height: 300, overflowY: 'auto', overflowX: 'hidden' },
});

export default AnalyticAgentDetailed;

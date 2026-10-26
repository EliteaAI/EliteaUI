import { memo, useCallback, useMemo, useState } from 'react';

import { useStore } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Alert, Box, CircularProgress, Link, Snackbar, Tooltip, Typography, useTheme } from '@mui/material';

import { analyticsApi } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import {
  AnalyticsBreakdownTable,
  ChartTooltip,
  DeletedChip,
  KPICard,
} from '@/[fsd]/features/settings/ui/analytics';
import { useClientSort, useSelectedProjectName, useSortedRows } from '@/[fsd]/shared/lib/hooks';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { useAnalyticsChatDetailQuery } from '@/api';
import DownloadIcon from '@/assets/download.svg?react';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

import AnalyticsLazySection from './components/AnalyticsLazySection';
import ChatRecentRunsTable from './components/ChatRecentRunsTable';

const HTTP_NOT_FOUND = 404;

const { CHAT_DETAIL_EMPTY_MESSAGE, CHAT_PARTICIPANT_TYPE_LABELS } = AnalyticsCommonConstants;

const PARTICIPANT_COLUMNS = [
  { key: 'participant_type', label: 'Participant Type', flex: 2 },
  { key: 'responses', label: 'Responses', flex: 1 },
  { key: 'total_tokens', label: 'Tokens', flex: 1 },
  { key: 'llm_cost', label: 'Cost', flex: 1 },
  { key: 'errors', label: 'Errors', flex: 1 },
];

const MODEL_COLUMNS = [
  { key: 'model_name', label: 'Model', flex: 2.5 },
  { key: 'calls', label: 'LLM Calls', flex: 1 },
  { key: 'responses', label: 'Responses', flex: 1 },
  { key: 'total_tokens', label: 'Tokens', flex: 1 },
  { key: 'llm_cost', label: 'Cost', flex: 1 },
];

const USER_COLUMNS = [
  { key: 'user_email', label: 'User', flex: 3 },
  { key: 'responses', label: 'Responses', flex: 1 },
  { key: 'total_tokens', label: 'Tokens', flex: 1 },
  { key: 'llm_cost', label: 'Cost', flex: 1 },
];

const TOOL_COLUMNS = [
  { key: 'tool_name', label: 'Tool', flex: 3 },
  { key: 'calls', label: 'Calls', flex: 1 },
  { key: 'errors', label: 'Errors', flex: 1 },
];

const AnalyticsChatDetailed = memo(props => {
  const { projectId, conversationUuid, dateFrom, dateTo, onBack, isPersonalProject } = props;

  const styles = analyticsChatDetailedStyles();

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const store = useStore();
  const projectName = useSelectedProjectName();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const {
    currentData: data,
    isFetching,
    error,
  } = useAnalyticsChatDetailQuery(
    { projectId, conversationUuid, dateFrom, dateTo },
    { skip: !projectId || !conversationUuid },
  );

  const { sort: participantSort, handleSort: handleParticipantSort } = useClientSort('responses');
  const { sort: modelSort, handleSort: handleModelSort } = useClientSort('total_tokens');
  const { sort: userSort, handleSort: handleUserSort } = useClientSort('responses');
  const { sort: toolSort, handleSort: handleToolSort } = useClientSort('calls');

  const defaultGetValue = useCallback((row, key) => row[key], []);

  const sortedParticipants = useSortedRows(data?.by_participant || [], participantSort, defaultGetValue);
  const sortedModels = useSortedRows(data?.by_model || [], modelSort, defaultGetValue);
  const sortedUsers = useSortedRows(data?.by_user || [], userSort, defaultGetValue);
  const sortedTools = useSortedRows(data?.tools || [], toolSort, defaultGetValue);

  const participantRowsWithKeys = useMemo(
    () => sortedParticipants.map((row, i) => ({ ...row, key: row.participant_type ?? i })),
    [sortedParticipants],
  );

  const modelRowsWithKeys = useMemo(
    () => sortedModels.map((row, i) => ({ ...row, key: row.model_name ?? i })),
    [sortedModels],
  );

  const userRowsWithKeys = useMemo(
    () => sortedUsers.map((row, i) => ({ ...row, key: row.user_id ?? i })),
    [sortedUsers],
  );

  const toolRowsWithKeys = useMemo(
    () => sortedTools.map((row, i) => ({ ...row, key: row.tool_name ?? i })),
    [sortedTools],
  );

  const participantColumns = useMemo(
    () =>
      PARTICIPANT_COLUMNS.map(col => ({
        ...col,
        render: row => {
          if (col.key === 'participant_type') {
            return CHAT_PARTICIPANT_TYPE_LABELS[row.participant_type] || row.participant_type || '-';
          }
          if (col.key === 'responses') return AnalyticCommonHelpers.fmtNum(row.responses);
          if (col.key === 'total_tokens') return AnalyticCommonHelpers.fmtNum(row.total_tokens);
          if (col.key === 'llm_cost') return AnalyticCommonHelpers.fmtCost(row.llm_cost);
          if (col.key === 'errors') {
            return (
              <Box
                component="span"
                sx={row.errors > 0 ? { color: palette.status.rejected } : undefined}
              >
                {row.errors ?? 0}
              </Box>
            );
          }
          return row[col.key] ?? '-';
        },
      })),
    [palette],
  );

  const modelColumns = useMemo(
    () =>
      MODEL_COLUMNS.map(col => ({
        ...col,
        render: row => {
          if (col.key === 'model_name') return row.display_name || row.model_name || '-';
          if (col.key === 'calls') return AnalyticCommonHelpers.fmtNum(row.calls);
          if (col.key === 'responses') return AnalyticCommonHelpers.fmtNum(row.responses);
          if (col.key === 'total_tokens') return AnalyticCommonHelpers.fmtNum(row.total_tokens);
          if (col.key === 'llm_cost') return AnalyticCommonHelpers.fmtCost(row.llm_cost);
          return row[col.key] ?? '-';
        },
      })),
    [],
  );

  const userColumns = useMemo(
    () =>
      USER_COLUMNS.map(col => ({
        ...col,
        render: row => {
          if (col.key === 'user_email') return row.user_email || `User ${row.user_id}`;
          if (col.key === 'responses') return AnalyticCommonHelpers.fmtNum(row.responses);
          if (col.key === 'total_tokens') return AnalyticCommonHelpers.fmtNum(row.total_tokens);
          if (col.key === 'llm_cost') return AnalyticCommonHelpers.fmtCost(row.llm_cost);
          return row[col.key] ?? '-';
        },
      })),
    [],
  );

  const toolColumns = useMemo(
    () =>
      TOOL_COLUMNS.map(col => ({
        ...col,
        render: row => {
          if (col.key === 'tool_name') return row.tool_name || '-';
          if (col.key === 'calls') return AnalyticCommonHelpers.fmtNum(row.calls);
          if (col.key === 'errors') {
            return (
              <Box
                component="span"
                sx={row.errors > 0 ? { color: palette.status.rejected } : undefined}
              >
                {row.errors ?? 0}
              </Box>
            );
          }
          return row[col.key] ?? '-';
        },
      })),
    [palette],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);
    try {
      const { runs, total, truncated } = await AnalyticsExportHelpers.fetchAllChatRuns(
        store.dispatch,
        analyticsApi.endpoints,
        { projectId, conversationUuid, dateFrom, dateTo },
      );
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await exportToExcel(
        AnalyticsExportHelpers.buildChatAnalyticsExportFileName({
          projectName,
          chatName: data?.chat_name,
          dateFrom,
          dateTo,
        }),
        [
          AnalyticsExportHelpers.buildChatDetailSheet(data, {
            runs,
            runsTotal: total,
            runsTruncated: truncated,
            isPersonalProject,
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
  }, [store, data, conversationUuid, projectId, dateFrom, dateTo, projectName, isPersonalProject]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

  if (isFetching) {
    return (
      <Box
        sx={styles.loadingState}
        data-testid="analytics-chat-detail-loading"
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={styles.content}>
        <BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          aria-label="Back"
          sx={styles.backButton}
          data-testid="analytics-chat-detail-back-button"
        />
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
          data-testid="analytics-chat-detail-empty"
        >
          {error?.status === HTTP_NOT_FOUND ? CHAT_DETAIL_EMPTY_MESSAGE : 'Failed to load chat analytics.'}
        </Typography>
      </Box>
    );
  }

  const { kpis = {}, daily_usage = [], all_time, can_open, conversation_id } = data;

  const allTimeSuffix =
    all_time?.unpriced_models?.length > 0 ? `${AnalyticCommonHelpers.fmtCost(all_time?.cost)}+` : null;

  return (
    <Box
      sx={styles.content}
      data-testid="analytics-tab-chat-detail"
    >
      {/* Header row */}
      <Box sx={styles.titleRow}>
        <BaseBtn
          variant={BUTTON_VARIANTS.icon}
          onClick={onBack}
          aria-label="Back"
          data-testid="analytics-chat-detail-back-button"
        >
          <ArrowBackIcon />
        </BaseBtn>
        <Typography
          variant="labelMedium"
          sx={styles.chatTitle}
          data-testid="analytics-chat-detail-title"
        >
          {data.chat_name || 'Private chat'}
        </Typography>
        {data.is_deleted && <DeletedChip testId="analytics-chat-detail-deleted-chip" />}
        {!isPersonalProject && data.owner_email && (
          <Typography
            variant="bodySmall"
            sx={styles.ownerText}
          >
            {data.owner_email}
          </Typography>
        )}
        {can_open && conversation_id && (
          <Link
            component={RouterLink}
            to={`/chat/${conversation_id}`}
            sx={styles.openChatLink}
          >
            Open chat
          </Link>
        )}
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export chat analytics to Excel'}
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
              startIcon={<DownloadIcon />}
              aria-label="Export chat analytics to Excel"
              data-testid="analytics-chat-detail-export-button"
            />
          </Box>
        </Tooltip>
      </Box>

      {/* KPI cards */}
      <Box
        sx={styles.kpiRow}
        data-testid="analytics-chat-detail-kpi-card"
      >
        <KPICard
          label="AI RESPONSES"
          value={AnalyticCommonHelpers.fmtNum(kpis.responses)}
          testId="analytics-chat-detail-kpi-responses"
        />
        {!isPersonalProject && (
          <KPICard
            label="UNIQUE USERS"
            value={AnalyticCommonHelpers.fmtNum(kpis.users)}
            testId="analytics-chat-detail-kpi-users"
          />
        )}
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.llm_cost)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-total-cost"
        />
        <KPICard
          label="INPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.input_cost)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-input-cost"
        />
        <KPICard
          label="OUTPUT TOKEN COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.output_cost)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-output-cost"
        />
        <KPICard
          label="CACHE READ COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.cache_read_cost)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-cache-read-cost"
        />
        <KPICard
          label="CACHE WRITE COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.cache_creation_cost)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-cache-write-cost"
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          testId="analytics-chat-detail-kpi-total-tokens"
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.input_tokens)}
          testId="analytics-chat-detail-kpi-input-tokens"
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.output_tokens)}
          testId="analytics-chat-detail-kpi-output-tokens"
        />
        <KPICard
          label="CACHE READ TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.cache_read_tokens)}
          testId="analytics-chat-detail-kpi-cache-read-tokens"
        />
        <KPICard
          label="CACHE WRITE TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.cache_creation_tokens)}
          testId="analytics-chat-detail-kpi-cache-write-tokens"
        />
        <KPICard
          label="LLM CALLS"
          value={AnalyticCommonHelpers.fmtNum(kpis.llm_calls)}
          testId="analytics-chat-detail-kpi-llm-calls"
        />
        <KPICard
          label="TOOL CALLS"
          value={AnalyticCommonHelpers.fmtNum(kpis.tool_calls)}
          testId="analytics-chat-detail-kpi-tool-calls"
        />
        <KPICard
          label="AVG COST / RESPONSE"
          value={AnalyticCommonHelpers.fmtCost(kpis.avg_cost_per_response)}
          subtitle="estimated"
          testId="analytics-chat-detail-kpi-avg-cost-per-response"
        />
        <KPICard
          label="AVG LATENCY"
          value={AnalyticCommonHelpers.fmtDuration(kpis.avg_duration_ms)}
          testId="analytics-chat-detail-kpi-avg-latency"
        />
        <KPICard
          label="ERRORS"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
          testId="analytics-chat-detail-kpi-errors"
        />
        {kpis.first_activity && (
          <KPICard
            label="FIRST ACTIVITY"
            value={new Date(kpis.first_activity).toLocaleString()}
            testId="analytics-chat-detail-kpi-first-activity"
          />
        )}
        {kpis.last_activity && (
          <KPICard
            label="LAST ACTIVITY"
            value={new Date(kpis.last_activity).toLocaleString()}
            testId="analytics-chat-detail-kpi-last-activity"
          />
        )}
        {all_time?.cost != null && (
          <KPICard
            label="ALL-TIME COST"
            value={allTimeSuffix || AnalyticCommonHelpers.fmtCost(all_time.cost)}
            subtitle={
              all_time.tracking_started_at
                ? `since ${new Date(all_time.tracking_started_at).toLocaleDateString()}`
                : undefined
            }
            testId="analytics-chat-detail-kpi-all-time-cost"
          />
        )}
      </Box>

      {/* Usage by Day — shown only when daily data available, lazy loaded */}
      {daily_usage.length > 0 && (
        <AnalyticsLazySection title="Usage by Day">
          <Box sx={styles.chartCard}>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
            >
              Usage by Day
            </Typography>
            <Box sx={styles.chartWrapper}>
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
                    stroke={palette.status.published}
                    fill={palette.status.published}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </AnalyticsLazySection>
      )}

      {/* Participants */}
      <AnalyticsLazySection title="Participants">
        <AnalyticsBreakdownTable
          title="Participants"
          tooltip="Breakdown by participant type in this chat."
          columns={participantColumns}
          rows={participantRowsWithKeys}
          emptyText={CHAT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-chat-detail-participants"
          sortBy={participantSort.sortBy}
          sortOrder={participantSort.sortOrder}
          onSort={handleParticipantSort}
        />
      </AnalyticsLazySection>

      {/* Models */}
      <AnalyticsLazySection title="Models">
        <AnalyticsBreakdownTable
          title="Models"
          tooltip="Models used in this chat."
          columns={modelColumns}
          rows={modelRowsWithKeys}
          emptyText={CHAT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-chat-detail-models"
          sortBy={modelSort.sortBy}
          sortOrder={modelSort.sortOrder}
          onSort={handleModelSort}
        />
      </AnalyticsLazySection>

      {/* Users — team only */}
      {!isPersonalProject && (
        <AnalyticsLazySection title="Users">
          <AnalyticsBreakdownTable
            title="Users"
            tooltip="Users who participated in this chat."
            columns={userColumns}
            rows={userRowsWithKeys}
            emptyText={CHAT_DETAIL_EMPTY_MESSAGE}
            testId="analytics-chat-detail-users"
            sortBy={userSort.sortBy}
            sortOrder={userSort.sortOrder}
            onSort={handleUserSort}
          />
        </AnalyticsLazySection>
      )}

      {/* Tools */}
      <AnalyticsLazySection title="Tools">
        <AnalyticsBreakdownTable
          title="Tools"
          tooltip="Tools called during this chat."
          columns={toolColumns}
          rows={toolRowsWithKeys}
          emptyText={CHAT_DETAIL_EMPTY_MESSAGE}
          testId="analytics-chat-detail-tools"
          sortBy={toolSort.sortBy}
          sortOrder={toolSort.sortOrder}
          onSort={handleToolSort}
        />
      </AnalyticsLazySection>

      {/* Recent Responses */}
      <AnalyticsLazySection title="Recent Responses">
        <ChatRecentRunsTable
          key={`${conversationUuid}-${dateFrom}-${dateTo}`}
          projectId={projectId}
          conversationUuid={conversationUuid}
          dateFrom={dateFrom}
          dateTo={dateTo}
          isPersonalProject={isPersonalProject}
        />
      </AnalyticsLazySection>

      <Snackbar
        open={exportError}
        autoHideDuration={6000}
        onClose={handleCloseExportError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={handleCloseExportError}
        >
          Export failed. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
});

AnalyticsChatDetailed.displayName = 'AnalyticsChatDetailed';

/** @type {MuiSx} */
const analyticsChatDetailedStyles = () => ({
  content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
  titleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
    flexWrap: 'wrap',
    position: 'sticky',
    top: '-1.5rem',
    zIndex: 10,
    backgroundColor: palette.background.default.primary,
    padding: '0.75rem 0',
    marginTop: '-0.75rem',
  }),
  backButton: { alignSelf: 'flex-start' },
  chatTitle: ({ palette }) => ({ color: palette.text.secondary }),
  ownerText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
  openChatLink: ({ palette }) => ({
    color: palette.text.accent,
    fontSize: '0.8125rem',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  }),
  exportButton: { marginLeft: 'auto' },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
    gap: '1rem',
  },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: '12.5rem' },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default AnalyticsChatDetailed;

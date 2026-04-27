import { memo, useCallback, useMemo, useState } from 'react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, CircularProgress, IconButton, Tab, TablePagination, Tabs, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import {
  useAnalyticsAgentDetailQuery,
  useAnalyticsAgentsQuery,
  useAnalyticsToolDetailQuery,
  useAnalyticsToolsQuery,
  useAnalyticsUserDetailQuery,
  useAnalyticsUsersQuery,
  useProjectAnalyticsQuery,
} from '@/api/analytics';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import StyledSearchInput from '@/components/SearchInput';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

// ── Date presets ──
const DATE_PRESETS = [
  { label: 'Last 24h', days: 1 },
  { label: 'Last 7d', days: 7 },
  { label: 'Last 30d', days: 30 },
  { label: 'Last 90d', days: 90 },
];

const TAB_LABELS = ['Overview', 'Agents', 'Tools', 'Users', 'Health', 'Guide'];

// ── Color palette ──
const CHART_COLORS = [
  '#10A37F',
  '#4285F4',
  '#D4A574',
  '#FF9900',
  '#58A6FF',
  '#3FB950',
  '#D29922',
  '#BC8CFF',
  '#39D2C0',
  '#F0883E',
];

const EVENT_TYPE_COLORS = {
  api: '#58A6FF',
  socketio: '#39D2C0',
  llm: '#BC8CFF',
  tool: '#F0883E',
  agent: '#3FB950',
  rpc: '#D29922',
  chat: '#79C0FF',
};

// ── Utility ──
const fmtNum = n => {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const fmtDuration = ms => {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// ── KPI Card ──
const KpiCard = memo(({ label, value, valueSuffix, subtitle, color, badge }) => (
  <Box sx={styles.kpiCard}>
    <Typography
      variant="labelSmall"
      sx={styles.kpiLabel}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <Typography
        variant="headingMedium"
        sx={[styles.kpiValue, color ? { color } : {}]}
      >
        {value}
      </Typography>
      {valueSuffix && (
        <Typography
          variant="bodySmall"
          sx={styles.kpiValueSuffix}
        >
          {valueSuffix}
        </Typography>
      )}
      {badge && (
        <Typography
          variant="bodySmall"
          sx={{ color: '#3FB950', fontWeight: 600, fontSize: '0.75rem' }}
        >
          {badge}
        </Typography>
      )}
    </Box>
    {subtitle && (
      <Typography
        variant="bodySmall"
        sx={styles.kpiSubtitle}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
));
KpiCard.displayName = 'KpiCard';

// ── Custom Tooltip ──
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={styles.chartTooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.tooltipLabel}
      >
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Typography
          key={i}
          variant="bodySmall"
          sx={{ color: entry.color }}
        >
          {entry.name}: {typeof entry.value === 'number' ? fmtNum(entry.value) : entry.value}
        </Typography>
      ))}
    </Box>
  );
};

// ── Model Usage Table (redesigned) ──
const ModelUsageTable = memo(({ models = [], totalCalls }) => {
  if (!models.length) return null;
  const maxCalls = models[0]?.calls || 1;

  return (
    <Box sx={styles.chartCard}>
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        Model Usage Breakdown
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.chartSubtitle}
      >
        LLM calls per model
      </Typography>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Typography sx={[styles.tableCell, { flex: '0 0 2rem' }]}>#</Typography>
          <Typography sx={[styles.tableCell, { flex: 3 }]}>Model</Typography>
          <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Calls</Typography>
          <Typography sx={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Users</Typography>
          <Typography sx={[styles.tableCell, { flex: 2 }]}>Share</Typography>
        </Box>
        {models.map((m, i) => {
          const share = totalCalls > 0 ? (m.calls / totalCalls) * 100 : 0;
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Box
              key={i}
              sx={styles.tableRow}
            >
              <Typography sx={[styles.tableCellValue, { flex: '0 0 2rem', color: '#8B949E' }]}>
                {i + 1}
              </Typography>
              <Box
                sx={[
                  styles.tableCellValue,
                  { flex: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' },
                ]}
              >
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
                />
                <Typography
                  variant="bodySmall"
                  noWrap
                >
                  {m.display_name || m.model_name || 'Unknown Model'}
                </Typography>
              </Box>
              <Typography sx={[styles.tableCellValue, { flex: 1, textAlign: 'right' }]}>
                {fmtNum(m.calls)}
              </Typography>
              <Typography sx={[styles.tableCellValue, { flex: 1, textAlign: 'right' }]}>{m.users}</Typography>
              <Box
                sx={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}
              >
                <Box sx={styles.shareBarBg}>
                  <Box
                    sx={[
                      styles.shareBarFill,
                      { width: `${(m.calls / maxCalls) * 100}%`, backgroundColor: color },
                    ]}
                  />
                </Box>
                <Typography
                  variant="bodySmall"
                  sx={{ color: '#8B949E', minWidth: '2.5rem', textAlign: 'right' }}
                >
                  {share.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
ModelUsageTable.displayName = 'ModelUsageTable';

// ── Leaderboard colors (medal-style for top 3) ──
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

// ── Overview Tab ──
const OverviewTab = memo(({ data, onUserClick }) => {
  const { kpis, top_ai_users = [], daily_activity = [], models = [] } = data;

  const totalModelCalls = useMemo(() => models.reduce((s, m) => s + m.calls, 0), [models]);

  return (
    <Box sx={styles.tabContent}>
      <Box sx={styles.kpiRow}>
        <KpiCard
          label="TEAM"
          value={fmtNum(kpis.unique_users)}
          valueSuffix={`of ${fmtNum(kpis.total_project_users)}`}
          subtitle="active members"
        />
        <KpiCard
          label="AI ACTIVE"
          value={fmtNum(kpis.ai_active_users)}
          badge={kpis.adoption_rate > 0 ? `↑${kpis.adoption_rate}%` : undefined}
          subtitle={`${kpis.adoption_rate}% adoption`}
        />
        <KpiCard
          label="LLM CALLS"
          value={fmtNum(kpis.llm_calls)}
          subtitle="event_type = llm"
        />
        <KpiCard
          label="TOOL RUNS"
          value={fmtNum(kpis.tool_runs)}
          subtitle="event_type = tool"
        />
        <KpiCard
          label="CHAT MSG"
          value={fmtNum(kpis.chat_msgs)}
          subtitle="user messages sent"
        />
        <KpiCard
          label="AGENT RUNS"
          value={fmtNum(kpis.agent_runs)}
          subtitle="agents and pipelines interactions"
        />
      </Box>

      <Box sx={styles.chartsRowEqual}>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Activity
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={daily_activity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Events"
                  stroke="#58A6FF"
                  fill="rgba(88,166,255,0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke="#3FB950"
                  fill="rgba(63,185,80,0.10)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Top 5 AI Adopters
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Leaderboard by AI events (LLM + Tool + Agent)
          </Typography>
          {top_ai_users.length > 0 ? (
            <Box sx={styles.tableWrapper}>
              {top_ai_users.map((u, i) => {
                const initial = (u.user_email || '?')[0].toUpperCase();
                const avatarColor = i < 3 ? MEDAL_COLORS[i] : CHART_COLORS[(i - 3) % CHART_COLORS.length];
                return (
                  <Box
                    key={i}
                    sx={[
                      styles.leaderboardRow,
                      onUserClick && {
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'hsla(0, 0%, 100%, 0.04)' },
                      },
                    ]}
                    onClick={() => onUserClick?.(u.user_id)}
                  >
                    <Typography sx={styles.leaderboardRank}>{i + 1}</Typography>
                    <Box sx={[styles.leaderboardAvatar, { backgroundColor: avatarColor }]}>
                      <Typography sx={styles.leaderboardInitial}>{initial}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="bodySmall"
                        noWrap
                        sx={[
                          styles.leaderboardEmail,
                          onUserClick && { '&:hover': { textDecoration: 'underline' } },
                        ]}
                      >
                        {u.user_email}
                      </Typography>
                      <Typography
                        variant="bodySmall"
                        sx={styles.leaderboardStats}
                      >
                        {fmtNum(u.llm_calls)} LLM &middot; {fmtNum(u.tool_runs)} Tool &middot;{' '}
                        {fmtNum(u.agent_runs)} Agent
                      </Typography>
                    </Box>
                    <Typography
                      variant="bodyMedium"
                      sx={styles.leaderboardScore}
                    >
                      {fmtNum(u.ai_events)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No AI activity data.
            </Typography>
          )}
        </Box>
      </Box>

      <ModelUsageTable
        models={models}
        totalCalls={totalModelCalls}
      />
    </Box>
  );
});
OverviewTab.displayName = 'OverviewTab';

// ── Agents Tab ──
// ── Agent Detail View ──
const AgentDetailView = memo(({ projectId, entityId, dateFrom, dateTo, onBack }) => {
  const { data, isFetching } = useAnalyticsAgentDetailQuery(
    { projectId, entityId, dateFrom, dateTo },
    { skip: !projectId || !entityId },
  );

  if (isFetching)
    return (
      <Box sx={styles.loadingState}>
        <CircularProgress size={32} />
      </Box>
    );
  if (!data)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No data found.
        </Typography>
      </Box>
    );

  const { entity_name, kpis, users = [], tools = [], daily_usage = [] } = data;

  return (
    <Box sx={styles.tabContent}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <IconButton
          onClick={onBack}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          {entity_name}
        </Typography>
      </Box>

      <Box sx={styles.kpiRow}>
        <KpiCard
          label="Total Events"
          value={fmtNum(kpis.total_events)}
        />
        <KpiCard
          label="Unique Users"
          value={fmtNum(kpis.unique_users)}
        />
        <KpiCard
          label="Avg Latency"
          value={fmtDuration(kpis.avg_duration_ms)}
        />
        <KpiCard
          label="Errors"
          value={fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? '#F85149' : undefined}
        />
        <KpiCard
          label="Error Rate"
          value={`${kpis.error_rate}%`}
          color={kpis.error_rate > 5 ? '#F85149' : undefined}
        />
      </Box>

      {daily_usage.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Usage
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={daily_usage}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Events"
                  stroke="#58A6FF"
                  fill="rgba(88,166,255,0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#F85149"
                  fill="rgba(248,81,73,0.10)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Users
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {users.length} users used this agent
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Events</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {users.map((u, i) => (
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
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.events)}</Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {fmtDuration(u.avg_duration_ms)}
                  </Typography>
                  <Typography
                    sx={[styles.tableCellValue, { flex: 1, color: u.errors > 0 ? '#F85149' : undefined }]}
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
                  No user data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Tools
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {tools.length} tools used by this agent
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>Tool</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {tools.map((t, i) => (
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
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(t.calls)}</Typography>
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
      </Box>
    </Box>
  );
});
AgentDetailView.displayName = 'AgentDetailView';

// ── Agents Tab ──
const AgentsTab = memo(({ projectId, dateFrom, dateTo }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { data, isFetching } = useAnalyticsAgentsQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
    },
    { skip: !projectId },
  );

  const agentChartData = useMemo(
    () =>
      (data?.rows || []).slice(0, 20).map((a, i) => ({
        name: a.entity_name || `Agent #${a.entity_id}`,
        events: a.events,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data?.rows],
  );

  const chatDaily = data?.chat_daily || [];

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleAgentClick = useCallback(entityId => setSelectedAgent(entityId), []);
  const handleBack = useCallback(() => setSelectedAgent(null), []);

  if (selectedAgent) {
    return (
      <AgentDetailView
        projectId={projectId}
        entityId={selectedAgent}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  return (
    <Box sx={styles.tabContent}>
      {/* Daily Chat Messages chart */}
      {chatDaily.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Chat Messages
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            User messages per day
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={chatDaily}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="messages"
                  name="Messages"
                  stroke="#D2A8FF"
                  fill="rgba(210,168,255,0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Top agents chart */}
      {agentChartData.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Most Active Agents
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Top {agentChartData.length} by events
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={agentChartData}
                margin={{ left: 5, right: 20, top: 5, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ ...styles.axisTick, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="events"
                  name="Events"
                  radius={[4, 4, 0, 0]}
                >
                  {agentChartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Paginated agent table */}
      <Box sx={styles.chartCard}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
            >
              Agent Activity
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {total} agents
            </Typography>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by agent name"
            sx={styles.userSearch}
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, { flex: 3 }]}>Agent</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Events</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Users</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
          </Box>
          {isFetching && (
            <Box sx={styles.loadingState}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((a, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleAgentClick(a.entity_id)}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {a.entity_name}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(a.events)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{a.users}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {fmtDuration(a.avg_duration_ms)}
                </Typography>
                <Typography
                  sx={[styles.tableCellValue, { flex: 1, color: a.errors > 0 ? '#F85149' : undefined }]}
                >
                  {a.errors}
                </Typography>
              </Box>
            ))}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50]}
          sx={styles.pagination}
        />
      </Box>
    </Box>
  );
});
AgentsTab.displayName = 'AgentsTab';

// ── Tools Tab ──
// ── Tool Detail View ──
const ToolDetailView = memo(({ projectId, toolName, dateFrom, dateTo, onBack }) => {
  const { data, isFetching } = useAnalyticsToolDetailQuery(
    { projectId, toolName, dateFrom, dateTo },
    { skip: !projectId || !toolName },
  );

  if (isFetching)
    return (
      <Box sx={styles.loadingState}>
        <CircularProgress size={32} />
      </Box>
    );
  if (!data)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No data found.
        </Typography>
      </Box>
    );

  const { kpis, users = [], agents = [], daily_usage = [] } = data;

  return (
    <Box sx={styles.tabContent}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <IconButton
          onClick={onBack}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          {toolName}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={styles.kpiRow}>
        <KpiCard
          label="Total Calls"
          value={fmtNum(kpis.total_calls)}
        />
        <KpiCard
          label="Unique Users"
          value={fmtNum(kpis.unique_users)}
        />
        <KpiCard
          label="Avg Latency"
          value={fmtDuration(kpis.avg_duration_ms)}
        />
        <KpiCard
          label="Errors"
          value={fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? '#F85149' : undefined}
        />
        <KpiCard
          label="Error Rate"
          value={`${kpis.error_rate}%`}
          color={kpis.error_rate > 5 ? '#F85149' : undefined}
        />
      </Box>

      {/* Daily Usage Chart */}
      {daily_usage.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Usage
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={daily_usage}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="Calls"
                  stroke="#58A6FF"
                  fill="rgba(88,166,255,0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#F85149"
                  fill="rgba(248,81,73,0.10)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Two columns: Users and Agents */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Users
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {users.length} users called this tool
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {users.map((u, i) => (
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
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.calls)}</Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {fmtDuration(u.avg_duration_ms)}
                  </Typography>
                  <Typography
                    sx={[styles.tableCellValue, { flex: 1, color: u.errors > 0 ? '#F85149' : undefined }]}
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
                  No user data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Agents
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {agents.length} agents used this tool
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>Agent</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {agents.map((a, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {a.entity_name}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(a.calls)}</Typography>
                </Box>
              ))}
              {!agents.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No agent data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});
ToolDetailView.displayName = 'ToolDetailView';

// ── Tools Tab ──
const ToolsTab = memo(({ projectId, dateFrom, dateTo }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);

  const { data, isFetching } = useAnalyticsToolsQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
    },
    { skip: !projectId },
  );

  const toolChartData = useMemo(
    () =>
      (data?.rows || []).slice(0, 20).map((t, i) => ({
        tool_name: t.tool_name,
        calls: t.calls,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data?.rows],
  );

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleToolClick = useCallback(toolName => setSelectedTool(toolName), []);
  const handleBack = useCallback(() => setSelectedTool(null), []);

  if (selectedTool) {
    return (
      <ToolDetailView
        projectId={projectId}
        toolName={selectedTool}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  return (
    <Box sx={styles.tabContent}>
      {/* Top tools chart */}
      {toolChartData.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Most Popular Tools
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Top {toolChartData.length} by usage
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={toolChartData}
                margin={{ left: 5, right: 20, top: 5, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="tool_name"
                  tick={{ ...styles.axisTick, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  radius={[4, 4, 0, 0]}
                >
                  {toolChartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Paginated tool table */}
      <Box sx={styles.chartCard}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
            >
              Tool Details
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {total} tools
            </Typography>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by tool name"
            sx={styles.userSearch}
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, { flex: 3 }]}>Tool</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Users</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
          </Box>
          {isFetching && (
            <Box sx={styles.loadingState}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((t, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleToolClick(t.tool_name)}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {t.tool_name}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(t.calls)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{t.users}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {fmtDuration(t.avg_duration_ms)}
                </Typography>
                <Typography
                  sx={[styles.tableCellValue, { flex: 1, color: t.errors > 0 ? '#F85149' : undefined }]}
                >
                  {t.errors}
                </Typography>
              </Box>
            ))}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50]}
          sx={styles.pagination}
        />
      </Box>
    </Box>
  );
});
ToolsTab.displayName = 'ToolsTab';

// ── User Detail View ──
const UserDetailView = memo(({ projectId, userId, dateFrom, dateTo, onBack }) => {
  const { data, isFetching } = useAnalyticsUserDetailQuery(
    { projectId, userId, dateFrom, dateTo },
    { skip: !projectId || !userId },
  );

  if (isFetching)
    return (
      <Box sx={styles.loadingState}>
        <CircularProgress size={32} />
      </Box>
    );
  if (!data)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No data found.
        </Typography>
      </Box>
    );

  const { kpis, models = [], tools = [], agents = [], daily_activity = [] } = data;

  return (
    <Box sx={styles.tabContent}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <IconButton
          variant="alita"
          color="tertiary"
          onClick={onBack}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          {data.user_email}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={styles.kpiRow}>
        <KpiCard
          label="LLM Calls"
          value={fmtNum(kpis.llm_events)}
        />
        <KpiCard
          label="Tool Calls"
          value={fmtNum(kpis.tool_events)}
        />
        <KpiCard
          label="Chat Msg"
          value={fmtNum(kpis.chat_events)}
        />
        <KpiCard
          label="Agent Runs"
          value={fmtNum(kpis.agent_events)}
        />
        <KpiCard
          label="Active Days"
          value={String(kpis.active_days)}
        />
        <KpiCard
          label="Errors"
          value={fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? '#F85149' : undefined}
        />
      </Box>

      {/* Daily Activity Chart */}
      {daily_activity.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Activity
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Events by type per day
          </Typography>
          <Box sx={{ width: '100%' }}>
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <AreaChart data={daily_activity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="chat"
                  name="Chat Msg"
                  stroke="#D2A8FF"
                  fill="rgba(210,168,255,0.10)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="llm"
                  name="LLM"
                  stroke="#58A6FF"
                  fill="rgba(88,166,255,0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tool"
                  name="Tool"
                  stroke="#3FB950"
                  fill="rgba(63,185,80,0.10)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="agent"
                  name="Agent"
                  stroke="#F0883E"
                  fill="rgba(240,136,62,0.10)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Three columns: Models, Tools, Agents */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' },
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Models Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {models.length} models
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {models.length > 0 ? (
              models.map((m, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {m.display_name || m.model_name || 'Uknown Model'}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={{ color: '#8B949E' }}
                  >
                    {fmtNum(m.calls)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No model usage
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Tools Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {tools.length} tools
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {tools.length > 0 ? (
              tools.map((t, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {t.tool_name}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={{ color: '#8B949E' }}
                  >
                    {fmtNum(t.calls)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No tool usage
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Agents Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {agents.length} agents
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {agents.length > 0 ? (
              agents.map((a, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {a.entity_name}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={{ color: '#8B949E' }}
                  >
                    {a.runs}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No agent activity
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});
UserDetailView.displayName = 'UserDetailView';

// ── Users Tab (server-side pagination) ──
const UsersTab = memo(({ projectId, dateFrom, dateTo, initialUserId, onBackToSource }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || null);
  const [cameFromExternal] = useState(() => !!initialUserId);

  const { data, isFetching } = useAnalyticsUsersQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
    },
    { skip: !projectId },
  );

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleUserClick = useCallback(userId => setSelectedUserId(userId), []);
  const handleBack = useCallback(() => {
    if (cameFromExternal && onBackToSource) {
      onBackToSource();
    } else {
      setSelectedUserId(null);
    }
  }, [cameFromExternal, onBackToSource]);

  if (selectedUserId) {
    return (
      <UserDetailView
        projectId={projectId}
        userId={selectedUserId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  return (
    <Box sx={styles.tabContent}>
      <Box sx={styles.chartCard}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
            >
              User Activity
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {total} users
            </Typography>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by email"
            sx={styles.userSearch}
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Events</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Days</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>LLM</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Tool</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Agent</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Chat Msg</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
          </Box>
          {isFetching && (
            <Box sx={styles.loadingState}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((u, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleUserClick(u.user_id)}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {u.user_email || `User ${u.user_id}`}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.total_events)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{u.active_days}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.llm_events)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.tool_events)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.agent_events)}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(u.chat_events)}</Typography>
                <Typography
                  sx={[styles.tableCellValue, { flex: 1, color: u.errors > 0 ? '#F85149' : undefined }]}
                >
                  {u.errors}
                </Typography>
              </Box>
            ))}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50]}
          sx={styles.pagination}
        />
      </Box>
    </Box>
  );
});
UsersTab.displayName = 'UsersTab';

// ── Health Tab ──
const HealthTab = memo(({ health = [], daily_activity = [] }) => {
  const errorTrend = useMemo(
    () =>
      daily_activity.map(d => ({
        date: d.date,
        errors: d.errors,
        events: d.events,
        errorRate: d.events > 0 ? Number(((d.errors / d.events) * 100).toFixed(2)) : 0,
      })),
    [daily_activity],
  );

  if (!health.length)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No health data available.
        </Typography>
      </Box>
    );

  return (
    <Box sx={styles.tabContent}>
      {errorTrend.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Requests vs Errors
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Total requests trend with error overlay
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <AreaChart data={errorTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={styles.axisTick}
                  tickFormatter={d => d?.slice(5)}
                />
                <YAxis tick={styles.axisTick} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Total Requests"
                  stroke="#58A6FF"
                  fill="rgba(88,166,255,0.10)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#F85149"
                  fill="rgba(248,81,73,0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
      <Box sx={styles.chartCard}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          Health by Event Type
        </Typography>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, { flex: 2 }]}>Event Type</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Total</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Error Rate</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
          </Box>
          {health.map((h, i) => (
            <Box
              key={i}
              sx={styles.tableRow}
            >
              <Box
                sx={[
                  styles.tableCellValue,
                  { flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' },
                ]}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: EVENT_TYPE_COLORS[h.event_type] || '#58A6FF',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="bodySmall">{h.event_type}</Typography>
              </Box>
              <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{fmtNum(h.total)}</Typography>
              <Typography
                sx={[styles.tableCellValue, { flex: 1, color: h.errors > 0 ? '#F85149' : undefined }]}
              >
                {h.errors}
              </Typography>
              <Typography
                sx={[styles.tableCellValue, { flex: 1, color: h.error_rate > 5 ? '#F85149' : undefined }]}
              >
                {h.error_rate}%
              </Typography>
              <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                {fmtDuration(h.avg_duration_ms)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});
HealthTab.displayName = 'HealthTab';

// ── Guide Tab ──
const GUIDE_SECTIONS = [
  {
    title: 'Overview Tab',
    metrics: [
      {
        name: 'TEAM',
        description:
          'Shown as "X of Y" where X is the number of unique users active during the selected time period, and Y is the total number of users ever seen in this project. This helps understand what portion of your team is currently active.',
        calculation:
          'X = Count of distinct user IDs with at least one event in the date range. Y = Count of distinct user IDs in the project (all time, no date filter).',
        source: 'All event types (api, socketio, llm, tool, agent, rpc).',
      },
      {
        name: 'AI ACTIVE',
        description:
          'Number of users who actually used AI capabilities - meaning they triggered at least one LLM call, tool execution, or application interaction. Users who only browsed the interface without using AI features are not counted here.',
        calculation:
          'Count of distinct user IDs where event_type in ("llm", "tool") or entity_type = "application".',
        source: 'Events with LLM/tool event types or application entity interactions.',
      },
      {
        name: 'Adoption Rate',
        description:
          'The percentage shown next to AI ACTIVE (e.g. "84.2% adoption"). Represents the ratio of AI-active users to total team members. A higher percentage means more of your team is actively leveraging AI features.',
        calculation: 'AI ACTIVE / TEAM x 100%.',
        source: 'Derived from TEAM and AI ACTIVE metrics.',
      },
      {
        name: 'LLM CALLS',
        description:
          'Total number of Large Language Model invocations. Every time the system sends a prompt to an AI model (Claude, GPT, Gemini, etc.) and gets a response, it counts as one LLM call.',
        calculation: 'Count of events where event_type = "llm".',
        source: 'Captured when the SDK calls ChatAnthropic, ChatOpenAI, ChatBedrock, etc.',
      },
      {
        name: 'TOOL RUNS',
        description:
          'Total number of tool executions. When an AI agent uses a tool (e.g. web search, Slack message, Jira query, database lookup), each execution is counted as one tool run.',
        calculation: 'Count of events where event_type = "tool".',
        source: 'Captured when the SDK executes any tool via LangChain tool calling.',
      },
      {
        name: 'CHAT MSG',
        description:
          'Total number of user messages sent in the chat interface. Each time a user sends a message (chat predict request), it counts as one chat message.',
        calculation: 'Count of events where action = "SIO chat_predict".',
        source: 'Captured from the WebSocket chat_predict event when a user sends a message.',
      },
      {
        name: 'AGENT RUNS',
        description:
          'Total number of interactions with agents and pipelines. Each time a user triggers an agent predict or pipeline execution, it counts as one agent run.',
        calculation: 'Count of events where entity_type = "application".',
        source: 'Captured from RPC calls that include an application_id (agent or pipeline predictions).',
      },
    ],
  },
  {
    title: 'Overview Charts',
    metrics: [
      {
        name: 'Daily Activity',
        description:
          'Shows the trend of platform usage over time with two lines: total events per day (blue) and unique users per day (green). Helps identify usage patterns, peak days, and adoption trends.',
      },
      {
        name: 'Event Type Breakdown',
        description:
          'Horizontal bar chart showing the distribution of events by type. Helps understand what the platform is primarily used for - API interactions, chat conversations, LLM calls, tool executions, etc.',
      },
      {
        name: 'Model Usage Breakdown',
        description:
          'Table showing which AI models are used most frequently. Columns include the model name, number of calls, number of distinct users, and the share percentage relative to total LLM calls.',
      },
    ],
  },
  {
    title: 'Agents Tab',
    metrics: [
      {
        name: 'Chat Messages Chart',
        description:
          'Daily line chart showing the number of user messages (SIO chat_predict) per day. Helps track chat engagement trends over time.',
        calculation: 'Count of events where action = "SIO chat_predict", grouped by day.',
      },
      {
        name: 'Most Active Agents',
        description:
          'Bar chart showing the top 20 agents ranked by number of events. Helps identify which agents are used most frequently.',
      },
      {
        name: 'Agent Activity Table',
        description:
          'Server-side paginated table listing all agents (applications). Shows events, users, avg latency, and errors. Click any agent row to drill down.',
        calculation: 'Aggregated from events where entity_type = "application", grouped by entity_id.',
      },
      {
        name: 'Agent Detail View',
        description:
          'Drill-down view for a single agent showing KPIs, daily usage chart, which users interacted with it, and which tools it used (resolved via trace_id correlation).',
      },
    ],
  },
  {
    title: 'Tools Tab',
    metrics: [
      {
        name: 'Most Popular Tools',
        description:
          'Bar chart showing the top 20 tools ranked by number of calls. Tool names on X axis, call count on Y axis.',
      },
      {
        name: 'Tool Details Table',
        description:
          'Server-side paginated table with search. Shows each tool with total calls, distinct users, avg latency, and errors. Click any tool row to drill down.',
        calculation: 'Aggregated from events where event_type = "tool", grouped by tool_name.',
      },
      {
        name: 'Tool Detail View',
        description:
          'Drill-down view for a single tool showing KPIs (calls, users, latency, error rate), daily usage chart, which users called it, and which agents used it (resolved via trace_id correlation).',
      },
    ],
  },
  {
    title: 'Users Tab',
    metrics: [
      {
        name: 'User Activity Table',
        description:
          'Server-side paginated table listing all users in the project. For each user, shows: total events, active days, and per-type breakdown (LLM, Tool, Agent, Chat Msg, Errors). Click on any user row to drill down.',
        calculation: 'Each row is aggregated from all events for that user_id within the date range.',
      },
      {
        name: 'User Detail View',
        description:
          'Drill-down view for a single user showing KPIs, daily activity chart (by event type), models used, tools called, and agents interacted with. Lists are scrollable for users with many items.',
      },
      {
        name: 'Active Days',
        description:
          'Number of distinct calendar days on which the user had at least one event. Higher numbers indicate consistent, regular usage.',
        calculation: 'Count of distinct dates (timestamp cast to date) for the user.',
      },
    ],
  },
  {
    title: 'Health Tab',
    metrics: [
      {
        name: 'Requests vs Errors Chart',
        description:
          'Dual-line area chart showing total requests (blue) and errors (red) per day. The error line at the bottom helps visualize the error volume in context of total traffic. Spikes in the red line indicate potential issues.',
      },
      {
        name: 'Health by Event Type Table',
        description:
          'Breaks down reliability metrics per event type. For each type shows: total events, error count, error rate percentage, and average latency. Use this to identify which parts of the system are experiencing issues.',
      },
      {
        name: 'Error Rate',
        description:
          'Percentage of events that resulted in an error, calculated per event type. An error is flagged when the system detects a failed response (HTTP 5xx, exception, timeout, etc.).',
        calculation: 'Errors / Total x 100% for each event type.',
      },
      {
        name: 'Avg Latency',
        description:
          'Average time it took to complete an operation, measured in milliseconds or seconds. High latency on LLM calls is expected (model inference), but high latency on API or RPC calls may indicate performance issues.',
        calculation: 'Average of duration_ms across all events of that type.',
      },
    ],
  },
  {
    title: 'General Concepts',
    metrics: [
      {
        name: 'Event Types',
        description:
          'Every action on the platform is recorded as an event with a type:\n- api: HTTP API calls (REST endpoints, UI actions)\n- socketio: WebSocket events (chat, real-time features)\n- llm: AI model calls (Claude, GPT, Gemini, etc.)\n- tool: Tool executions (Slack, Jira, search, etc.)\n- agent: Agent workflow runs\n- rpc: Internal service-to-service calls',
      },
      {
        name: 'Date Range',
        description:
          'All metrics are filtered by the selected date range (From/To pickers at the top). Use the preset buttons (Last 24h, 7d, 30d, 90d) for quick selection. The default is the last 7 days.',
      },
      {
        name: 'Project Scope',
        description:
          'All data shown is specific to the currently selected project. Switch projects using the project selector in the sidebar to view analytics for different teams.',
      },
    ],
  },
];

const GuideTab = memo(() => (
  <Box sx={styles.tabContent}>
    {GUIDE_SECTIONS.map((section, si) => (
      <Box
        key={si}
        sx={styles.chartCard}
      >
        <Typography
          variant="labelMedium"
          sx={styles.guideSection}
        >
          {section.title}
        </Typography>
        {section.metrics.map((m, mi) => (
          <Box
            key={mi}
            sx={styles.guideItem}
          >
            <Typography
              variant="bodyMedium"
              sx={styles.guideName}
            >
              {m.name}
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.guideDescription}
            >
              {m.description}
            </Typography>
            {m.calculation && (
              <Box sx={styles.guideCalcRow}>
                <Typography
                  variant="labelSmall"
                  sx={styles.guideCalcLabel}
                >
                  Calculation:
                </Typography>
                <Typography
                  variant="bodySmall"
                  sx={styles.guideCalcValue}
                >
                  {m.calculation}
                </Typography>
              </Box>
            )}
            {m.source && (
              <Box sx={styles.guideCalcRow}>
                <Typography
                  variant="labelSmall"
                  sx={styles.guideCalcLabel}
                >
                  Data source:
                </Typography>
                <Typography
                  variant="bodySmall"
                  sx={styles.guideCalcValue}
                >
                  {m.source}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    ))}
  </Box>
));
GuideTab.displayName = 'GuideTab';

// ── Main Analytics Page ──
const Analytics = memo(() => {
  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();

  const [selectedDays, setSelectedDays] = useState(1);
  const [activeTab, setActiveTab] = useState(0);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date());

  const presetButtons = useMemo(() => DATE_PRESETS.map(p => ({ value: p.days, label: p.label })), []);

  const dateFromISO = useMemo(() => dateFrom?.toISOString(), [dateFrom]);
  const dateToISO = useMemo(() => dateTo?.toISOString(), [dateTo]);

  const queryParams = useMemo(
    () => ({ projectId, dateFrom: dateFromISO, dateTo: dateToISO }),
    [projectId, dateFromISO, dateToISO],
  );

  // Only fetch overview data for Overview (0) and Health (4) tabs
  const needsOverview = activeTab === 0 || activeTab === 4;
  const { data, isFetching, isError } = useProjectAnalyticsQuery(queryParams, {
    skip: !projectId || !needsOverview,
  });

  const handlePreset = useCallback(days => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from);
    setDateTo(to);
  }, []);

  const handlePresetChange = useCallback(
    (event, newDays) => {
      if (newDays !== null) {
        setSelectedDays(newDays);
        handlePreset(newDays);
      }
    },
    [handlePreset],
  );

  const [pendingUserId, setPendingUserId] = useState(null);

  const handleTabChange = useCallback((_, newTab) => {
    setPendingUserId(null);
    setActiveTab(newTab);
  }, []);

  const handleOverviewUserClick = useCallback(userId => {
    setPendingUserId(userId);
    setActiveTab(3);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setPendingUserId(null);
    setActiveTab(0);
  }, []);

  return (
    <DrawerPage>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Analytics
        </Typography>
        {projectName && (
          <Typography
            variant="bodySmall"
            sx={styles.projectLabel}
          >
            Project: {projectName}
          </Typography>
        )}
      </Box>
      <Box sx={styles.filterBar}>
        <Box sx={styles.presets}>
          <TabGroupButton
            arrayBtn={presetButtons}
            value={selectedDays}
            onChange={handlePresetChange}
            exclusive
            disableTooltip
          />
        </Box>
        <Box sx={styles.datePickerRow}>
          <DateTimePicker
            label="From"
            value={dateFrom}
            onChange={setDateFrom}
            maxDateTime={dateTo}
            ampm={false}
            slotProps={{
              textField: { size: 'small', sx: styles.dateInput },
              actionBar: { actions: ['clear', 'accept'] },
            }}
          />
          <DateTimePicker
            label="To"
            value={dateTo}
            onChange={setDateTo}
            minDateTime={dateFrom}
            ampm={false}
            slotProps={{
              textField: { size: 'small', sx: styles.dateInput },
              actionBar: { actions: ['clear', 'accept'] },
            }}
          />
        </Box>
      </Box>
      <Box sx={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={styles.tabs}
        >
          {TAB_LABELS.map(label => (
            <Tab
              key={label}
              label={label}
              sx={styles.tab}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={styles.contentArea}>
        {needsOverview && isFetching && (
          <Box sx={styles.loadingState}>
            <CircularProgress size={32} />
          </Box>
        )}
        {needsOverview && isError && !isFetching && (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodyMedium"
              sx={styles.emptyText}
            >
              Failed to load analytics data.
            </Typography>
          </Box>
        )}
        {data && !isFetching && activeTab === 0 && (
          <OverviewTab
            data={data}
            onUserClick={handleOverviewUserClick}
          />
        )}
        {activeTab === 1 && (
          <AgentsTab
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
          />
        )}
        {activeTab === 2 && (
          <ToolsTab
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
          />
        )}
        {activeTab === 3 && (
          <UsersTab
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
            initialUserId={pendingUserId}
            onBackToSource={handleBackToOverview}
          />
        )}
        {data && !isFetching && activeTab === 4 && (
          <HealthTab
            health={data.health}
            daily_activity={data.daily_activity}
          />
        )}
        {activeTab === 5 && <GuideTab />}
      </Box>
    </DrawerPage>
  );
});

Analytics.displayName = 'Analytics';

/** @type {MuiSx} */
const styles = {
  header: {
    height: '3.8rem',
    minHeight: '3.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
  },
  projectLabel: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.background.userInputBackgroundActive || palette.background.paper,
    border: `1px solid ${palette.border.table}`,
  }),
  filterBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0 1.5rem 0.75rem 1.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  presets: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  presetChip: ({ palette }) => ({
    backgroundColor: palette.background.userInputBackgroundActive,
    color: palette.text.secondary,
    '&:hover': { backgroundColor: palette.background.conversation?.hover || palette.action.hover },
  }),
  datePickerRow: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  dateInput: { width: '13rem' },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  tabs: ({ palette }) => ({
    minHeight: '2.5rem',
    '& .MuiTabs-indicator': { backgroundColor: palette.text.secondary },
  }),
  tab: ({ palette }) => ({
    minHeight: '2.5rem',
    textTransform: 'none',
    color: palette.text.metrics || palette.text.disabled,
    '&.Mui-selected': { color: palette.text.secondary },
  }),
  contentArea: { flex: 1, overflow: 'auto', padding: '1rem 1.5rem' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem' },
  kpiCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackgroundActive || palette.background.paper,
    border: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  kpiLabel: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  kpiValue: ({ palette }) => ({ color: palette.text.secondary }),
  kpiValueSuffix: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.875rem',
  }),
  kpiSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginTop: '-0.125rem',
  }),
  chartsRow: { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '1rem' },
  chartsRowEqual: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
    alignItems: 'stretch',
  },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackgroundActive || palette.background.paper,
    border: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginBottom: '0.5rem',
    display: 'block',
  }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: 200 },
  axisTick: { fill: '#8B949E', fontSize: 11 },
  chartTooltip: ({ palette }) => ({
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.secondary || '#151D2B',
    border: `1px solid ${palette.border.table}`,
  }),
  tooltipLabel: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem' }),
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  emptyState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
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
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.conversation?.hover || 'rgba(255,255,255,0.02)' },
  }),
  clickableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.conversation?.hover || 'rgba(255,255,255,0.04)' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  shareBarBg: ({ palette }) => ({
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.background.conversation?.normal || 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }),
  shareBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  scrollableList: { maxHeight: 280, overflowY: 'auto', overflowX: 'hidden' },
  fixedScrollList: { height: 300, overflowY: 'auto', overflowX: 'hidden' },
  listItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0',
    borderBottom: `1px solid ${palette.border.table}`,
    minWidth: 0,
    '&:last-child': { borderBottom: 'none' },
  }),
  typeBadge: {
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.625rem',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'lowercase',
    lineHeight: 1.4,
  },
  userSearch: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.userInputBackgroundActive,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
  leaderboardRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  leaderboardRank: ({ palette }) => ({
    width: '1.25rem',
    textAlign: 'center',
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: palette.text.metrics || palette.text.disabled,
  }),
  leaderboardAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leaderboardInitial: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  },
  leaderboardEmail: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    display: 'block',
  }),
  leaderboardStats: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    display: 'block',
    marginTop: '0.125rem',
  }),
  leaderboardScore: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 700,
    fontSize: '0.9375rem',
    flexShrink: 0,
  }),
  guideSection: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  guideItem: ({ palette }) => ({
    padding: '0.75rem 0',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  guideName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    marginBottom: '0.375rem',
    display: 'block',
  }),
  guideDescription: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  }),
  guideCalcRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'baseline',
    marginTop: '0.375rem',
  },
  guideCalcLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.6875rem',
    fontWeight: 600,
    flexShrink: 0,
  }),
  guideCalcValue: {
    color: '#58A6FF',
    fontSize: '0.8125rem',
  },
};

export default Analytics;

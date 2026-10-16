import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, CircularProgress, TablePagination, TableSortLabel, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsAgentDetailed, ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { analyticsTableSortLabelSx } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import { useAnalyticsAgentsQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';

const DEFAULT_AGENT_SORT = { sortBy: 'events', sortOrder: 'desc' };

const AGENT_COLUMNS = [
  { key: 'entity_name', label: 'Agent / Pipeline', flex: 3, render: r => r.entity_name },
  { key: 'events', label: 'Runs', render: r => AnalyticCommonHelpers.fmtNum(r.events) },
  { key: 'users', label: 'Users', teamOnly: true, render: r => r.users },
  { key: 'llm_cost', label: 'Total Cost', render: r => AnalyticCommonHelpers.fmtCost(r.llm_cost) },
  { key: 'input_cost', label: 'Input Token Cost', render: r => AnalyticCommonHelpers.fmtCost(r.input_cost) },
  {
    key: 'output_cost',
    label: 'Output Token Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.output_cost),
  },
  { key: 'total_tokens', label: 'Total Tokens', render: r => AnalyticCommonHelpers.fmtNum(r.total_tokens) },
  { key: 'input_tokens', label: 'Input Tokens', render: r => AnalyticCommonHelpers.fmtNum(r.input_tokens) },
  {
    key: 'output_tokens',
    label: 'Output Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.output_tokens),
  },
  {
    key: 'cache_read_tokens',
    label: 'Cache Read Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.cache_read_tokens),
  },
  {
    key: 'cache_creation_tokens',
    label: 'Cache Write Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.cache_creation_tokens),
  },
  {
    key: 'cache_read_cost',
    label: 'Cache Read Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.cache_read_cost),
  },
  {
    key: 'cache_creation_cost',
    label: 'Cache Write Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.cache_creation_cost),
  },
  {
    key: 'avg_duration_ms',
    label: 'Avg Latency',
    render: r => AnalyticCommonHelpers.fmtDuration(r.avg_duration_ms),
  },
  { key: 'errors', label: 'Errors', render: r => r.errors },
];

const AnalyticsAgents = memo(props => {
  const { projectId, dateFrom, dateTo, canViewSkills = false } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_AGENT_SORT);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const selectedProjectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const isPersonalProject = useMemo(
    () => Boolean(personalProjectId) && String(selectedProjectId) === String(personalProjectId),
    [selectedProjectId, personalProjectId],
  );

  const columns = useMemo(
    () => AGENT_COLUMNS.filter(column => !column.teamOnly || !isPersonalProject),
    [isPersonalProject],
  );

  const { data, isFetching } = useAnalyticsAgentsQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    { skip: !projectId },
  );

  const agentChartData = useMemo(
    () =>
      (data?.rows || []).slice(0, 20).map((a, i) => ({
        name: a.entity_name || `Agent #${a.entity_id}`,
        runs: a.events,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data?.rows],
  );

  const chatDaily = data?.chat_daily || [];

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handleSort = useCallback(key => {
    setSort(previous => ({
      sortBy: key,
      sortOrder: previous.sortBy === key && previous.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
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
      <AnalyticsAgentDetailed
        projectId={projectId}
        entityId={selectedAgent}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
        canViewSkills={canViewSkills}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  return (
    <Box sx={styles.agentsContent}>
      {/* Top agents chart */}
      {agentChartData.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
            data-testid="analytics-agents-chart-title"
          >
            Most Active Agents & Pipelines
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
              data-testid="analytics-agents-chart-subtitle"
            >
              Top {agentChartData.length} by runs
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: AnalyticsCommonConstants.TOOLTIP_TEXTS.agents.MOST_ACTIVE,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-agents-chart-container"
          >
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={agentChartData}
                margin={{ left: 5, right: 20, top: 5, bottom: 40 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ ...axisTickStyle, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50}
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
                  dataKey="runs"
                  name="Runs"
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

      {/* Daily Chat Messages chart */}
      {chatDaily.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
            data-testid="analytics-agents-chat-chart-title"
          >
            Chat Messages
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
              data-testid="analytics-agents-chat-chart-subtitle"
            >
              User messages per day
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: AnalyticsCommonConstants.TOOLTIP_TEXTS.agents.CHAT_MESSAGES,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-agents-chat-chart-container"
          >
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={chatDaily}>
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
                  dataKey="messages"
                  name="Messages"
                  stroke={palette.text.accent}
                  fill={palette.text.accent}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Paginated agent table */}
      <Box sx={styles.chartCard}>
        <Box sx={styles.tableHeaderRow}>
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
              data-testid="analytics-agents-activity-title"
            >
              Agent & Pipeline Activity
            </Typography>
            <Box sx={styles.subtitleRow}>
              <Typography
                variant="bodySmall"
                sx={styles.chartSubtitle}
                data-testid="analytics-agents-count"
              >
                {total} agents & pipelines
              </Typography>
              <InfoTooltip
                infoTooltip={{
                  title: AnalyticsCommonConstants.TOOLTIP_TEXTS.agents.ACTIVITY_COUNT,
                  icon: { width: 12, height: 12 },
                }}
              />
            </Box>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by agent or pipeline name"
            sx={styles.userSearch}
            testId="analytics-agents-search-input"
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box
            sx={styles.tableHeader}
            data-testid="analytics-agents-table-header"
          >
            {columns.map(column => (
              <Box
                key={column.key}
                sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
              >
                <TableSortLabel
                  active={sort.sortBy === column.key}
                  direction={sort.sortBy === column.key ? sort.sortOrder : 'desc'}
                  onClick={() => handleSort(column.key)}
                  sx={analyticsTableSortLabelSx}
                  data-testid={`analytics-agents-sort-${column.key}`}
                >
                  {column.label}
                </TableSortLabel>
              </Box>
            ))}
          </Box>
          {isFetching && (
            <Box
              sx={styles.loadingState}
              data-testid="analytics-agents-loading-indicator"
            >
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((a, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleAgentClick(a.entity_id)}
                data-testid="analytics-agents-row"
              >
                {columns.map(column => (
                  <Box
                    key={column.key}
                    sx={[
                      styles.tableCellValue,
                      { flex: column.flex ?? 1 },
                      column.key === 'errors' && a.errors > 0 && styles.errorValue,
                    ]}
                    data-testid={`analytics-agents-row-${column.key}`}
                  >
                    {column.render(a)}
                  </Box>
                ))}
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
          slotProps={{
            select: { 'data-testid': 'analytics-agents-pagination-rows-select' },
            displayedRows: { 'data-testid': 'analytics-agents-pagination-range' },
            actions: {
              previousButton: { 'data-testid': 'analytics-agents-pagination-prev' },
              nextButton: { 'data-testid': 'analytics-agents-pagination-next' },
            },
          }}
        />
      </Box>
    </Box>
  );
});

AnalyticsAgents.displayName = 'AnalyticsAgents';

/** @type {MuiSx} */
const styles = {
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  agentsContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  emptyState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
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
  clickableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  userSearch: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.surface.interactive.default,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
};

export default AnalyticsAgents;

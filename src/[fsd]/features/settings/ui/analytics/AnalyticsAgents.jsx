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

import { Box, CircularProgress, TablePagination, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsAgentDetailed, ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import { useAnalyticsAgentsQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const AnalyticsAgents = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
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
        runs: a.events,
        color: AnalyticsCommonConstants.CHART_COLORS[i % AnalyticsCommonConstants.CHART_COLORS.length],
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
      <AnalyticsAgentDetailed
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
                <RechartsTooltip content={<ChartTooltip testId="analytics-agents-chart-tooltip" />} />
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
            <Typography sx={[styles.tableCell, { flex: 3 }]}>Agent / Pipeline</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Runs</Typography>
            {!isPersonalProject && <Typography sx={[styles.tableCell, { flex: 1 }]}>Users</Typography>}
            <Typography sx={[styles.tableCell, styles.flexOne]}>Total Cost</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Input Token Cost</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Output Token Cost</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Total Tokens</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Input Tokens</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Output Tokens</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Cache Read Tokens</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Cache Write Tokens</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Cache Read Cost</Typography>
            <Typography sx={[styles.tableCell, styles.flexOne]}>Cache Write Cost</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
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
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {a.entity_name}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(a.events)}
                </Typography>
                {!isPersonalProject && (
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{a.users}</Typography>
                )}
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtCost(a.llm_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtCost(a.input_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtCost(a.output_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtNum(a.total_tokens)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtNum(a.input_tokens)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtNum(a.output_tokens)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtNum(a.cache_read_tokens)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtNum(a.cache_creation_tokens)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtCost(a.cache_read_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, styles.flexOne]}>
                  {AnalyticCommonHelpers.fmtCost(a.cache_creation_cost)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtDuration(a.avg_duration_ms)}
                </Typography>
                <Typography
                  sx={[
                    styles.tableCellValue,
                    { flex: 1, color: a.errors > 0 ? palette.status.rejected : undefined },
                  ]}
                  data-testid="analytics-agents-row-errors"
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
  agentsContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
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
    borderBottom: `1px solid ${palette.border.table}`,
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
  userSearch: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.userInputBackground,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
  flexOne: { flex: 1 },
};

export default AnalyticsAgents;

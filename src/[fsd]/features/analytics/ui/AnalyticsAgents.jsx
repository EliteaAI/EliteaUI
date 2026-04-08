import { memo, useCallback, useMemo, useState } from 'react';

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

import { AnalyticsCommonConstants } from '@/[fsd]/features/analytics/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { AnalyticsAgentDetailed, ChartTooltip } from '@/[fsd]/features/analytics/ui';
import { useAnalyticsAgentsQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';

const AnalyticsAgents = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

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
          <Box sx={styles.chartWrapper}>
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
          <Box sx={styles.chartWrapper}>
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
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(a.events)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{a.users}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtDuration(a.avg_duration_ms)}
                </Typography>
                <Typography
                  sx={[
                    styles.tableCellValue,
                    { flex: 1, color: a.errors > 0 ? palette.status.rejected : undefined },
                  ]}
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
    marginBottom: '0.5rem',
    display: 'block',
  }),
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
};

export default AnalyticsAgents;

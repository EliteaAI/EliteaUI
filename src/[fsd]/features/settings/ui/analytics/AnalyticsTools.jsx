import { memo, useCallback, useMemo, useState } from 'react';

import { Bar, BarChart, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, TablePagination, TableSortLabel, Typography, useTheme } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsToolDetailed, ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { analyticsTableSortLabelSx } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useAnalyticsToolsQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';

import RunAnalyticsEmptyState from './components/RunAnalyticsEmptyState';

const DEFAULT_TOOL_SORT = { sortBy: 'calls', sortOrder: 'desc' };

const TOOL_COLUMNS = [
  { key: 'tool_name', label: 'Tool', flex: 3, render: r => r.tool_name },
  { key: 'calls', label: 'Calls', render: r => AnalyticCommonHelpers.fmtNum(r.calls) },
  { key: 'users', label: 'Users', render: r => r.users },
  {
    key: 'avg_duration_ms',
    label: 'Avg Latency',
    render: r => AnalyticCommonHelpers.fmtDuration(r.avg_duration_ms),
  },
  { key: 'errors', label: 'Errors', render: r => r.errors },
];

const AnalyticsTools = memo(props => {
  const { projectId, dateFrom, dateTo, runScope } = props;

  // Run-scoped (Run History → Analytics): only the Tool Details table, no drill-down into a
  // date-range tool detail that would escape the run's scope
  const isRunScope = Boolean(runScope);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_TOOL_SORT);
  const [selectedTool, setSelectedTool] = useState(null);

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { data, isFetching } = useAnalyticsToolsQuery(
    {
      projectId,
      ...(isRunScope ? runScope.queryArgs : { dateFrom, dateTo }),
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    { skip: !projectId },
  );

  const { data: topToolsData } = useAnalyticsToolsQuery(
    { projectId, dateFrom, dateTo, limit: 20, offset: 0, search, ...DEFAULT_TOOL_SORT },
    { skip: !projectId || isRunScope },
  );

  const toolChartData = useMemo(
    () =>
      (topToolsData?.rows || []).map((t, i) => ({
        tool_name: t.tool_name,
        calls: t.calls,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [topToolsData?.rows],
  );

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

  const handleToolClick = useCallback(toolName => setSelectedTool(toolName), []);

  const handleBack = useCallback(() => setSelectedTool(null), []);

  if (selectedTool) {
    return (
      <AnalyticsToolDetailed
        projectId={projectId}
        toolName={selectedTool}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  if (isRunScope && data && !isFetching && !total && !search) {
    return (
      <RunAnalyticsEmptyState
        message={runScope.noDataMessage}
        testId="run-analytics-tools-empty"
      />
    );
  }

  return (
    <Box sx={styles.toolsContent}>
      {/* Top tools chart */}
      {!isRunScope && toolChartData.length > 0 && (
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
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={toolChartData}
                margin={{ left: 5, right: 20, top: 5, bottom: 40 }}
              >
                <XAxis
                  dataKey="tool_name"
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
        <Box sx={styles.tableHeaderRow}>
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
            {TOOL_COLUMNS.map(column => (
              <Box
                key={column.key}
                sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
              >
                <TableSortLabel
                  active={sort.sortBy === column.key}
                  direction={sort.sortBy === column.key ? sort.sortOrder : 'desc'}
                  onClick={() => handleSort(column.key)}
                  sx={analyticsTableSortLabelSx}
                  data-testid={`analytics-tools-sort-${column.key}`}
                >
                  {column.label}
                </TableSortLabel>
              </Box>
            ))}
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
                sx={isRunScope ? styles.tableRow : styles.clickableRow}
                onClick={isRunScope ? undefined : () => handleToolClick(t.tool_name)}
              >
                {TOOL_COLUMNS.map(column => (
                  <Box
                    key={column.key}
                    sx={[
                      styles.tableCellValue,
                      { flex: column.flex ?? 1 },
                      column.key === 'errors' && t.errors > 0 && styles.errorValue,
                    ]}
                  >
                    {column.render(t)}
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
        />
      </Box>
    </Box>
  );
});

AnalyticsTools.displayName = 'AnalyticsTools';

/** @type {MuiSx} */
const styles = {
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  toolsContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
    marginBottom: '0.5rem',
    display: 'block',
  }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: 200 },
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
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

export default AnalyticsTools;

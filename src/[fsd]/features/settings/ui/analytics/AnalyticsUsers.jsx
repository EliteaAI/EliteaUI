import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, TablePagination, TableSortLabel, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsUserDetailed } from '@/[fsd]/features/settings/ui/analytics';
import { analyticsTableSortLabelSx } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { useAnalyticsUsersQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';

const DEFAULT_USER_SORT = { sortBy: 'total_events', sortOrder: 'desc' };

const USER_COLUMNS = [
  { key: 'user_email', label: 'User', flex: 3, render: u => u.user_email || `User ${u.user_id}` },
  { key: 'active_days', label: 'Active Days', render: u => u.active_days },
  { key: 'llm_events', label: 'LLM Calls', render: u => AnalyticCommonHelpers.fmtNum(u.llm_events) },
  { key: 'tool_events', label: 'Tool Calls', render: u => AnalyticCommonHelpers.fmtNum(u.tool_events) },
  {
    key: 'agent_events',
    label: 'Agent/Pipeline Runs',
    render: u => AnalyticCommonHelpers.fmtNum(u.agent_events),
  },
  {
    key: 'skill_events',
    label: 'Skill Runs',
    skillOnly: true,
    render: u => AnalyticCommonHelpers.fmtNum(u.skill_events),
  },
  {
    key: 'chat_events',
    label: 'Chat Msg',
    sortable: false,
    render: u => AnalyticCommonHelpers.fmtNum(u.chat_events),
  },
  { key: 'errors', label: 'Errors', render: u => u.errors },
  { key: 'total_tokens', label: 'Total Tokens', render: u => AnalyticCommonHelpers.fmtNum(u.total_tokens) },
  { key: 'input_tokens', label: 'Input Tokens', render: u => AnalyticCommonHelpers.fmtNum(u.input_tokens) },
  {
    key: 'output_tokens',
    label: 'Output Tokens',
    render: u => AnalyticCommonHelpers.fmtNum(u.output_tokens),
  },
  { key: 'llm_cost', label: 'Total Cost', render: u => AnalyticCommonHelpers.fmtCost(u.llm_cost) },
  { key: 'input_cost', label: 'Input Token Cost', render: u => AnalyticCommonHelpers.fmtCost(u.input_cost) },
  {
    key: 'output_cost',
    label: 'Output Token Cost',
    render: u => AnalyticCommonHelpers.fmtCost(u.output_cost),
  },
  {
    key: 'cache_read_tokens',
    label: 'Cache Read Tokens',
    render: u => AnalyticCommonHelpers.fmtNum(u.cache_read_tokens),
  },
  {
    key: 'cache_creation_tokens',
    label: 'Cache Write Tokens',
    render: u => AnalyticCommonHelpers.fmtNum(u.cache_creation_tokens),
  },
  {
    key: 'cache_read_cost',
    label: 'Cache Read Cost',
    render: u => AnalyticCommonHelpers.fmtCost(u.cache_read_cost),
  },
  {
    key: 'cache_creation_cost',
    label: 'Cache Write Cost',
    render: u => AnalyticCommonHelpers.fmtCost(u.cache_creation_cost),
  },
];

const AnalyticsUsers = memo(props => {
  const { projectId, dateFrom, dateTo, initialUserId, onBackToSource, canViewSkills = false } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_USER_SORT);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || null);
  const [cameFromExternal] = useState(() => !!initialUserId);

  const columns = useMemo(
    () => USER_COLUMNS.filter(column => !column.skillOnly || canViewSkills),
    [canViewSkills],
  );

  const { data, isFetching } = useAnalyticsUsersQuery(
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
      <AnalyticsUserDetailed
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
    <Box sx={styles.usersContent}>
      <Box sx={styles.chartCard}>
        <Box sx={styles.tableHeaderRow}>
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
              data-testid="analytics-users-activity-title"
            >
              User Activity
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
              data-testid="analytics-users-count"
            >
              {total} users
            </Typography>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by email"
            sx={styles.userSearch}
            testId="analytics-users-search-input"
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box
            sx={styles.tableHeader}
            data-testid="analytics-users-table-header"
          >
            {columns.map(column => (
              <Box
                key={column.key}
                sx={[styles.tableCell, { flex: column.flex ?? 1 }]}
              >
                {column.sortable === false ? (
                  column.label
                ) : (
                  <TableSortLabel
                    active={sort.sortBy === column.key}
                    direction={sort.sortBy === column.key ? sort.sortOrder : 'desc'}
                    onClick={() => handleSort(column.key)}
                    sx={analyticsTableSortLabelSx}
                    data-testid={`analytics-users-sort-${column.key}`}
                  >
                    {column.label}
                  </TableSortLabel>
                )}
              </Box>
            ))}
          </Box>
          {isFetching && (
            <Box
              sx={styles.loadingState}
              data-testid="analytics-users-loading-indicator"
            >
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((u, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleUserClick(u.user_id)}
                data-testid="analytics-users-row"
              >
                {columns.map(column => (
                  <Box
                    key={column.key}
                    sx={[
                      styles.tableCellValue,
                      { flex: column.flex ?? 1 },
                      column.key === 'errors' && u.errors > 0 && styles.errorValue,
                    ]}
                    data-testid={column.key === 'errors' ? 'analytics-users-row-errors' : undefined}
                  >
                    {column.render(u)}
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
            select: { 'data-testid': 'analytics-users-pagination-rows-select' },
            displayedRows: { 'data-testid': 'analytics-users-pagination-range' },
            actions: {
              previousButton: { 'data-testid': 'analytics-users-pagination-prev' },
              nextButton: { 'data-testid': 'analytics-users-pagination-next' },
            },
          }}
        />
      </Box>
    </Box>
  );
});

AnalyticsUsers.displayName = 'AnalyticsUsers';

/** @type {MuiSx} */
const styles = {
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  usersContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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

export default AnalyticsUsers;

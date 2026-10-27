import { memo, useCallback, useMemo, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, TablePagination, Tooltip } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useAnalyticsChatRunsQuery } from '@/api';

import AnalyticsBreakdownTable from './AnalyticsBreakdownTable';

const DEFAULT_RUNS_PER_PAGE = 20;

const { CHAT_DETAIL_EMPTY_MESSAGE, CHAT_PARTICIPANT_TYPE_LABELS } = AnalyticsCommonConstants;

const RUNS_COLUMNS_BASE = [
  { key: 'started_at', label: 'Started', flex: 1.5 },
  { key: 'participant_type', label: 'Participant', flex: 1 },
  { key: 'models', label: 'Model(s)', flex: 1.5 },
  { key: 'total_tokens', label: 'Total Tokens', flex: 1 },
  { key: 'cost', label: 'Cost', flex: 1 },
  { key: 'is_error', label: 'Status', flex: 1 },
];

const ChatRecentRunsTable = memo(props => {
  const { projectId, conversationUuid, dateFrom, dateTo, isPersonalProject } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_RUNS_PER_PAGE);
  const [sortBy, setSortBy] = useState('started_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const runsStyles = useMemo(() => chatRecentRunsStyles(), []);

  const { data, isFetching } = useAnalyticsChatRunsQuery(
    {
      projectId,
      conversationUuid,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      sortBy,
      sortOrder,
    },
    { skip: !projectId || !conversationUuid },
  );

  const total = data?.total ?? 0;

  const columns = useMemo(() => {
    const userCol = isPersonalProject ? [] : [{ key: 'user_email', label: 'User', flex: 1.5 }];
    return [...RUNS_COLUMNS_BASE.slice(0, 1), ...userCol, ...RUNS_COLUMNS_BASE.slice(1)];
  }, [isPersonalProject]);

  const handleSort = useCallback(
    key => {
      if (sortBy === key) {
        setSortOrder(previous => (previous === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortBy(key);
        setSortOrder('desc');
      }
      setPage(0);
    },
    [sortBy],
  );

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const renderRunCell = useCallback(
    (column, run) => {
      if (column.key === 'started_at') {
        const startedAt = run.started_at ? new Date(run.started_at).toLocaleString() : '-';
        if (run.run_analytics_path) {
          return (
            <Link
              component={RouterLink}
              to={run.run_analytics_path}
              sx={runsStyles.link}
            >
              {startedAt}
            </Link>
          );
        }
        return startedAt;
      }
      if (column.key === 'participant_type') {
        return CHAT_PARTICIPANT_TYPE_LABELS[run.participant_type] || run.participant_type || '-';
      }
      if (column.key === 'models') {
        const models = run.models || [];
        if (!models.length) return '-';
        const label =
          models
            .map(m => (typeof m === 'object' ? m.display_name || m.model_name : m) || '')
            .filter(Boolean)
            .join(', ') || '-';
        if (label === '-') return '-';
        return (
          <Tooltip
            title={label}
            placement="top"
          >
            <Box
              component="span"
              sx={runsStyles.truncated}
            >
              {label}
            </Box>
          </Tooltip>
        );
      }
      if (column.key === 'total_tokens') return AnalyticCommonHelpers.fmtNum(run.total_tokens);
      if (column.key === 'cost') return AnalyticCommonHelpers.fmtCost(run.cost);
      if (column.key === 'user_email') return run.user_email || `User ${run.user_id}`;
      if (column.key === 'is_error') {
        return (
          <Box
            component="span"
            sx={run.is_error ? runsStyles.errorValue : undefined}
          >
            {run.is_error ? 'Error' : 'Success'}
          </Box>
        );
      }
      return run[column.key] ?? '-';
    },
    [runsStyles],
  );

  const columnsWithRender = useMemo(
    () =>
      columns.map(col => ({
        ...col,
        render: run => renderRunCell(col, run),
        sortKey: col.key,
      })),
    [columns, renderRunCell],
  );

  const pagination = useMemo(
    () => (
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 20, 50]}
        sx={runsStyles.pagination}
        slotProps={{
          select: { 'data-testid': 'analytics-chat-detail-runs-pagination-rows-select' },
          displayedRows: { 'data-testid': 'analytics-chat-detail-runs-pagination-range' },
          actions: {
            previousButton: { 'data-testid': 'analytics-chat-detail-runs-pagination-prev' },
            nextButton: { 'data-testid': 'analytics-chat-detail-runs-pagination-next' },
          },
        }}
      />
    ),
    [total, page, rowsPerPage, handlePageChange, handleRowsPerPageChange, runsStyles],
  );

  const keyedRows = useMemo(
    () => (data?.rows ?? []).map((run, i) => ({ ...run, key: run.run_id ?? i })),
    [data?.rows],
  );

  return (
    <AnalyticsBreakdownTable
      title="Recent Responses"
      tooltip="The latest AI responses in this chat. Select a start time to open Run Analytics."
      columns={columnsWithRender}
      rows={keyedRows}
      emptyText={CHAT_DETAIL_EMPTY_MESSAGE}
      testId="analytics-chat-detail-recent-runs"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      loading={isFetching}
      footer={pagination}
    />
  );
});

ChatRecentRunsTable.displayName = 'ChatRecentRunsTable';

/** @type {MuiSx} */
const chatRecentRunsStyles = () => ({
  link: ({ palette }) => ({ color: palette.text.accent, cursor: 'pointer' }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  truncated: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
});

export default ChatRecentRunsTable;

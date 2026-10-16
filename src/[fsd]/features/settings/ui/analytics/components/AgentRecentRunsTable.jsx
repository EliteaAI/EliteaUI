import { memo, useCallback, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, TablePagination, Tooltip } from '@mui/material';

import { useAnalyticsAgentRunsQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import {
  AgentAnalyticsHelpers,
  AnalyticCommonHelpers,
  AnalyticsExportHelpers,
} from '@/[fsd]/features/settings/lib/helpers';
import { useClientSort } from '@/[fsd]/shared/lib/hooks';

import SkillBreakdownTable from './SkillBreakdownTable';

const DEFAULT_SORT_BY = 'started_at';
const DEFAULT_ROWS_PER_PAGE = 20;

const { AGENT_DETAIL_EMPTY_MESSAGE, TOOLTIP_TEXTS } = AnalyticsCommonConstants;

const AgentRecentRunsTable = memo(props => {
  const { projectId, entityId, kind, dateFrom, dateTo } = props;

  const styles = agentRecentRunsTableStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { sort, handleSort } = useClientSort(DEFAULT_SORT_BY);

  const { data, isFetching } = useAnalyticsAgentRunsQuery(
    {
      projectId,
      entityId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    { skip: !projectId || !entityId },
  );

  const { total = 0, rows = [] } = data || {};

  const entity = { agentId: entityId, kind, projectId };

  const columns = [
    {
      key: 'started_at',
      label: 'Started',
      flex: 1.5,
      render: run => {
        const path = AgentAnalyticsHelpers.buildAgentRunAnalyticsPath(entity, run);
        const startedAt = AnalyticsExportHelpers.fmtRunDateTime(run.started_at);
        return path ? (
          <Link
            component={RouterLink}
            to={path}
            sx={styles.link}
            data-testid="analytics-agent-detail-run-link"
          >
            {startedAt}
          </Link>
        ) : (
          startedAt
        );
      },
    },
    {
      key: 'user_email',
      sortKey: 'user',
      label: 'User',
      flex: 1.5,
      render: AgentAnalyticsHelpers.formatAgentUserLabel,
    },
    {
      key: 'version_name',
      sortKey: 'version',
      label: 'Version',
      render: run => AnalyticCommonHelpers.formatVersionLabel(run.version_name),
    },
    {
      key: 'models',
      sortKey: 'model',
      label: 'Model',
      flex: 1.5,
      render: run => {
        const models = AgentAnalyticsHelpers.formatAgentRunModels(run.models);
        return (
          <Tooltip
            title={models}
            placement="top"
          >
            <Box
              component="span"
              data-testid="analytics-agent-detail-run-models"
            >
              {models}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      key: 'total_tokens',
      label: 'Total Tokens',
      render: run => AnalyticCommonHelpers.fmtNum(run.total_tokens),
    },
    { key: 'cost', label: 'Cost', render: run => AnalyticCommonHelpers.fmtCost(run.cost) },
    {
      key: 'is_error',
      sortKey: 'status',
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

  const handleSortChange = useCallback(
    sortBy => {
      handleSort(sortBy);
      setPage(0);
    },
    [handleSort],
  );

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <SkillBreakdownTable
      title="Recent Runs"
      tooltip={TOOLTIP_TEXTS.agentDetail.RECENT_RUNS_SECTION}
      columns={columns}
      rows={rows.map(run => ({ ...run, key: run.run_id }))}
      emptyText={AGENT_DETAIL_EMPTY_MESSAGE}
      testId="analytics-agent-detail-recent-runs"
      sortBy={sort.sortBy}
      sortOrder={sort.sortOrder}
      onSort={handleSortChange}
      loading={isFetching}
      footer={
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
            select: { 'data-testid': 'analytics-agent-detail-runs-pagination-rows-select' },
            displayedRows: { 'data-testid': 'analytics-agent-detail-runs-pagination-range' },
            actions: {
              previousButton: { 'data-testid': 'analytics-agent-detail-runs-pagination-prev' },
              nextButton: { 'data-testid': 'analytics-agent-detail-runs-pagination-next' },
            },
          }}
        />
      }
    />
  );
});

AgentRecentRunsTable.displayName = 'AgentRecentRunsTable';

/** @type {MuiSx} */
const agentRecentRunsTableStyles = () => ({
  link: ({ palette }) => ({ color: palette.text.accent, cursor: 'pointer' }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
});

export default AgentRecentRunsTable;

import { memo, useCallback, useMemo } from 'react';

import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { Box, Link, TablePagination } from '@mui/material';

import { buildOwnerViewModeParams } from '@/[fsd]/entities/schedule';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsBreakdownTable } from '@/[fsd]/features/settings/ui/analytics';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams } from '@/common/constants';
import RouteDefinitions from '@/routes';

import ComplexityBreakdownBar from './ComplexityBreakdownBar';
import ComplexityLabelChip from './ComplexityLabelChip';

const { ROWS_PER_PAGE_OPTIONS, RUN_ANALYTICS_SEARCH_PARAMS, RUN_ANALYTICS_TAB, RUNS_PAGING } =
  ComplexityConstants;
const { pageKey: PAGE_KEY, rowsKey: ROWS_KEY } = RUNS_PAGING;

// Rows come from the detail page's single query, so the summary is not computed twice
const ComplexityRecentRuns = memo(props => {
  const { entityId, entityProjectId, kind, versions, runs, total = 0, loading, footerInfo } = props;

  const [searchParams, setSearchParams] = useSearchParams();
  const { rowsPerPage, page } = ComplexityHelpers.readRunsPaging(searchParams, RUNS_PAGING);

  const setParams = useCallback(
    updates =>
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          Object.entries(updates).forEach(([key, value]) =>
            value ? next.set(key, String(value)) : next.delete(key),
          );
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  // Opens the run's analytics straight on the Complexity tab
  const runLink = useCallback(
    run => {
      const route =
        kind === 'pipeline'
          ? RouteDefinitions.PipelineRunAnalytics
          : RouteDefinitions.ApplicationsRunAnalytics;
      const params = new URLSearchParams(buildOwnerViewModeParams());
      // The exact run id: one conversation can hold several scored runs
      params.set(SearchParams.UsageRunId, run.run_id || run.conversation_id);
      params.set(RUN_ANALYTICS_SEARCH_PARAMS.tab, RUN_ANALYTICS_TAB);
      if (entityProjectId) params.set(RUN_ANALYTICS_SEARCH_PARAMS.entityProjectId, entityProjectId);
      return `${NavigationHelpers.buildRoute(route, { tab: 'all', agentId: entityId })}?${params.toString()}`;
    },
    [kind, entityId, entityProjectId],
  );

  const columns = useMemo(
    () => [
      {
        key: 'started_at',
        label: 'Start time',
        flex: 1.9,
        render: run => (
          <Link
            component={RouterLink}
            to={runLink(run)}
            variant="bodyMedium"
            data-testid="complexity-run-link"
          >
            {ComplexityHelpers.formatAsOf(run.started_at)}
          </Link>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        flex: 1.1,
        render: run => ComplexityHelpers.versionName(versions, run.version_id),
      },
      { key: 'cu_total', label: 'CU', flex: 0.6, render: run => ComplexityHelpers.formatCu(run.cu_total) },
      {
        key: 'label',
        label: 'Complexity',
        flex: 1,
        render: run => (
          <ComplexityLabelChip
            label={run.label}
            testId="complexity-run-label"
          />
        ),
      },
      {
        key: 'percentile',
        label: 'Percentile',
        flex: 0.8,
        render: run => ComplexityHelpers.formatPercentile(run.percentile),
      },
      { key: 'llm_calls', label: 'LLM calls', flex: 0.7 },
      { key: 'tool_calls', label: 'Tool calls', flex: 0.7 },
      {
        key: 'breakdown',
        label: 'Breakdown',
        flex: 1.6,
        render: run => <ComplexityBreakdownBar breakdown={run.breakdown} />,
      },
    ],
    [runLink, versions],
  );

  const rows = useMemo(() => (runs ?? []).map(run => ({ ...run, key: run.run_id })), [runs]);

  const styles = complexityRecentRunsStyles();

  return (
    <AnalyticsBreakdownTable
      title="Recent Runs"
      tooltip={ComplexityConstants.RECENT_RUNS_INFO}
      columns={columns}
      rows={rows}
      loading={loading}
      emptyText="No scored runs in this period."
      testId="complexity-recent-runs"
      fullHeight
      footer={
        <Box sx={styles.footer}>
          {footerInfo}
          <TablePagination
            component="div"
            count={total}
            page={total ? page : 0}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            onPageChange={(_, next) => setParams({ [PAGE_KEY]: next })}
            onRowsPerPageChange={event =>
              setParams({ [ROWS_KEY]: parseInt(event.target.value, 10), [PAGE_KEY]: null })
            }
            sx={styles.pagination}
            slotProps={{ select: { 'data-testid': 'complexity-runs-rows-select' } }}
          />
        </Box>
      }
    />
  );
});

ComplexityRecentRuns.displayName = 'ComplexityRecentRuns';

/** @type {MuiSx} */
const complexityRecentRunsStyles = () => ({
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
});

export default ComplexityRecentRuns;

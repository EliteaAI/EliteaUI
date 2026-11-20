import { memo, useCallback, useEffect, useMemo } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Alert, Box, Link, Typography } from '@mui/material';

import { useAnalyticsComplexityDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsBreakdownTable } from '@/[fsd]/features/settings/ui/analytics';
import EntityTypeBadge from '@/[fsd]/features/settings/ui/analytics/components/EntityTypeBadge';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useApplicationDetailsQuery } from '@/api/applications';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import RouteDefinitions from '@/routes';

import ComplexityBreakdownBar from './components/ComplexityBreakdownBar';
import ComplexityBreakdownLegend from './components/ComplexityBreakdownLegend';
import ComplexityInfoPopover from './components/ComplexityInfoPopover';
import ComplexityLabelChip from './components/ComplexityLabelChip';
import ComplexityRecentRuns from './components/ComplexityRecentRuns';
import ComplexityRefreshButton from './components/ComplexityRefreshButton';
import ComplexityTableInfo from './components/ComplexityTableInfo';
import { useComplexityListState } from './hooks/useComplexityListState.hooks';

const {
  DEFAULT_THRESHOLDS_NOTE,
  DETAIL_SEARCH_PARAMS,
  LIST_SEARCH_PARAMS,
  PERIOD_OPTIONS,
  RUNS_PAGING,
  STALE_NOTE,
} = ComplexityConstants;

const VERSIONS_INFO = 'Exact median of each version’s scored runs in the selected period.';

const ComplexityDetailContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const { entityId, entityProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const entityType = searchParams.get(DETAIL_SEARCH_PARAMS.entityType) || 'application';
  const kindParam = searchParams.get(DETAIL_SEARCH_PARAMS.kind);

  const { periodDays, update } = useComplexityListState();
  const range = useMemo(() => ComplexityHelpers.periodRange(periodDays), [periodDays]);

  const { rowsPerPage, page } = ComplexityHelpers.readRunsPaging(searchParams, RUNS_PAGING);
  const { data, isFetching, isError, refetch } = useAnalyticsComplexityDetailQuery(
    {
      projectId,
      entityId,
      entityType,
      entityProjectId,
      ...range,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      sortBy: 'ts',
      sortOrder: 'desc',
    },
    { skip: !projectId || !entityId },
  );
  // Version names live on the agent itself; a public agent has no local details to read
  const isLocal = String(entityProjectId) === String(projectId);
  const { data: application } = useApplicationDetailsQuery(
    { projectId, applicationId: entityId },
    { skip: !projectId || !entityId || !isLocal },
  );

  // Same as the list: an out-of-range Recent Runs page resets to the first one
  useEffect(() => {
    if (!isFetching && !isError && data && page > 0 && !data.runs?.length)
      update({ [DETAIL_SEARCH_PARAMS.runsPage]: null }, { resetPage: false });
  }, [data, isFetching, isError, page, update]);

  const summary = data?.summary;
  const meta = data?.meta;
  const versions = application?.versions;
  const kind = summary?.entity_kind ?? kindParam ?? undefined;
  const name = summary?.entity_name ?? application?.name ?? `#${entityId}`;

  const handleBack = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    Object.values(DETAIL_SEARCH_PARAMS).forEach(key => params.delete(key));
    const query = params.toString();
    navigate(`${RouteDefinitions.SettingsComplexity}${query ? `?${query}` : ''}`);
  }, [navigate, searchParams]);

  const handlePeriod = useCallback(
    value =>
      update(
        { [LIST_SEARCH_PARAMS.period]: value, [DETAIL_SEARCH_PARAMS.runsPage]: null },
        { resetPage: false },
      ),
    [update],
  );

  const styles = complexityDetailContainerStyles();

  const versionColumns = useMemo(
    () => [
      {
        key: 'version',
        label: 'Version',
        flex: 1.4,
        render: row => ComplexityHelpers.versionName(versions, row.version_id),
      },
      { key: 'runs', label: 'Runs', flex: 0.6 },
      {
        key: 'cu_median',
        label: 'Median CU',
        flex: 0.9,
        render: row => ComplexityHelpers.formatCu(row.cu_median),
      },
      {
        key: 'cu_max',
        label: 'Max CU',
        flex: 0.8,
        render: row => ComplexityHelpers.formatCu(row.cu_max),
      },
      {
        key: 'label',
        label: 'Complexity',
        flex: 1.1,
        render: row => (
          <ComplexityLabelChip
            label={row.label}
            pending={row.label_pending}
            testId="complexity-version-label"
          />
        ),
      },
      {
        key: 'percentile',
        label: 'Percentile',
        flex: 0.8,
        render: row => ComplexityHelpers.formatPercentile(row.percentile),
      },
      {
        key: 'breakdown',
        label: 'Breakdown',
        flex: 1.6,
        render: row => <ComplexityBreakdownBar breakdown={row.breakdown} />,
      },
    ],
    [versions],
  );
  const versionRows = useMemo(
    () => (data?.versions ?? []).map(row => ({ ...row, key: row.version_id ?? 'none' })),
    [data?.versions],
  );

  return (
    <DrawerPage data-testid="complexity-detail-page">
      <Box sx={styles.header}>
        <BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          aria-label="Back to Complexity"
          data-testid="complexity-detail-back"
        />
        <Link
          component="button"
          variant="headingSmall"
          color="text.secondary"
          underline="hover"
          onClick={handleBack}
          data-testid="complexity-detail-breadcrumb"
        >
          Complexity
        </Link>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          /
        </Typography>
        {kind && <EntityTypeBadge kind={kind} />}
        <Typography
          variant="headingSmall"
          sx={styles.title}
          data-testid="complexity-detail-title"
        >
          {name}
        </Typography>
        <Box sx={styles.headerSpacer} />
        <Box sx={styles.periodSelect}>
          <SingleSelect
            separateLabel
            label=""
            value={periodDays}
            options={PERIOD_OPTIONS}
            onValueChange={handlePeriod}
            data-testid="complexity-detail-period-select"
          />
        </Box>
        <ComplexityRefreshButton
          refetch={refetch}
          disabled={!projectId}
          testId="complexity-detail-refresh-button"
        />
        <ComplexityInfoPopover meta={meta} />
      </Box>

      <Box sx={styles.contentArea}>
        {meta?.stale && <Alert severity="warning">{STALE_NOTE}</Alert>}
        {isError && <Alert severity="error">Failed to load complexity for this agent or pipeline.</Alert>}

        <Box
          sx={styles.summaryCard}
          data-testid="complexity-detail-summary"
        >
          {summary ? (
            <>
              <Box sx={styles.summaryRow}>
                <ComplexityLabelChip
                  label={summary.label}
                  pending={summary.label_pending}
                  testId="complexity-detail-label"
                />
                <Typography variant="bodyMedium">
                  Median {ComplexityHelpers.formatCu(summary.cu_median)} CU · Max{' '}
                  {ComplexityHelpers.formatCu(summary.cu_max)} CU ·{' '}
                  {ComplexityHelpers.formatPercentile(summary.percentile)} · {summary.runs} runs, all versions
                </Typography>
              </Box>
              <Box sx={styles.bar}>
                <ComplexityBreakdownBar breakdown={summary.breakdown} />
              </Box>
              <Typography
                variant="bodySmall"
                component="div"
                sx={styles.note}
              >
                <ComplexityBreakdownLegend />
              </Typography>
            </>
          ) : (
            <Typography
              variant="bodySmall"
              sx={styles.note}
              data-testid="complexity-detail-empty"
            >
              {isFetching ? 'Loading…' : 'No scored runs in this period.'}
            </Typography>
          )}
          {meta && (
            <Typography
              variant="bodySmall"
              sx={styles.note}
              data-testid="complexity-detail-freshness"
            >
              {ComplexityHelpers.dataFreshnessNote(meta)}
              {meta.thresholds_source === 'default' ? ` ${DEFAULT_THRESHOLDS_NOTE}` : ''}
            </Typography>
          )}
        </Box>

        {versionRows.length > 0 && (
          <AnalyticsBreakdownTable
            title="By version"
            tooltip={VERSIONS_INFO}
            subtitle={<ComplexityBreakdownLegend />}
            columns={versionColumns}
            rows={versionRows}
            testId="complexity-versions-table"
          />
        )}

        <ComplexityRecentRuns
          entityId={entityId}
          entityProjectId={entityProjectId}
          kind={kind}
          versions={versions}
          runs={data?.runs}
          total={data?.total}
          loading={isFetching && !data}
          footerInfo={
            <ComplexityTableInfo
              meta={meta}
              text={ComplexityConstants.RECENT_RUNS_INFO}
              testId="complexity-runs-info"
            />
          }
        />
      </Box>
    </DrawerPage>
  );
});

ComplexityDetailContainer.displayName = 'ComplexityDetailContainer';

/** @type {MuiSx} */
const complexityDetailContainerStyles = () => ({
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.5rem 0 0.75rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
  title: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  headerSpacer: { flex: 1 },
  periodSelect: { minWidth: '10rem' },
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  summaryCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  summaryRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  bar: { width: '100%', maxWidth: '24rem' },
  note: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
});

export default ComplexityDetailContainer;

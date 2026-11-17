import { memo, useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Alert, Box, Link, TablePagination, Typography } from '@mui/material';

import { buildOwnerViewModeParams } from '@/[fsd]/entities/schedule';
import { useAnalyticsComplexityQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsBreakdownTable } from '@/[fsd]/features/settings/ui/analytics';
import EntityKindChip from '@/[fsd]/features/settings/ui/analytics/components/EntityKindChip';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import RouteDefinitions from '@/routes';

import ComplexityBreakdownBar from './components/ComplexityBreakdownBar';
import ComplexityBreakdownLegend from './components/ComplexityBreakdownLegend';
import ComplexityInfo from './components/ComplexityInfo';
import ComplexityLabelChip from './components/ComplexityLabelChip';

const {
  DEFAULT_PERIOD_DAYS,
  DEFAULT_THRESHOLDS_NOTE,
  LIST_MEDIAN_TOOLTIP,
  PAGE_SIZE,
  PERIOD_OPTIONS,
  STALE_NOTE,
} = ComplexityConstants;

const ComplexityContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();

  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS);
  const [sort, setSort] = useState({ sortBy: 'cu_median', sortOrder: 'desc' });
  const [page, setPage] = useState(0);

  const range = useMemo(() => ComplexityHelpers.periodRange(periodDays), [periodDays]);
  const { data, isFetching, isError } = useAnalyticsComplexityQuery(
    { projectId, ...range, ...sort, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    { skip: !projectId },
  );
  const meta = data?.meta;

  const handleSort = useCallback(sortBy => {
    setSort(prev => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  }, []);

  const handlePeriod = useCallback(value => {
    setPeriodDays(value);
    setPage(0);
  }, []);

  const openEntity = useCallback(
    row => {
      const route =
        row.entity_kind === 'pipeline'
          ? RouteDefinitions.PipelineRunHistory
          : RouteDefinitions.ApplicationsRunHistory;
      // Without the owner view mode the editor behind the breadcrumb falls back to public mode and 404s
      navigate(
        `${NavigationHelpers.buildRoute(route, { tab: 'all', agentId: row.entity_id })}?${buildOwnerViewModeParams()}`,
      );
    },
    [navigate],
  );

  const styles = complexityContainerStyles();

  const columns = useMemo(
    () => [
      {
        key: 'entity_name',
        label: 'Name',
        sortable: false,
        flex: 2.5,
        render: row => (
          <Box sx={styles.nameCell}>
            <Link
              component="button"
              variant="bodyMedium"
              onClick={() => openEntity(row)}
              sx={styles.nameLink}
              data-testid="complexity-entity-link"
            >
              {row.entity_name}
            </Link>
            <EntityKindChip kind={row.entity_kind} />
          </Box>
        ),
      },
      { key: 'runs', label: 'Runs', flex: 0.7 },
      {
        key: 'cu_median',
        label: (
          <Box
            component="span"
            sx={styles.headerWithInfo}
          >
            Median CU
            <InfoTooltip
              infoTooltip={{ title: LIST_MEDIAN_TOOLTIP, icon: { width: 12, height: 12 } }}
              testId="complexity-median-info"
            />
          </Box>
        ),
        flex: 0.9,
        render: row => ComplexityHelpers.formatCu(row.cu_median),
      },
      { key: 'cu_max', label: 'Max CU', flex: 0.8, render: row => ComplexityHelpers.formatCu(row.cu_max) },
      {
        key: 'label',
        label: 'Complexity',
        // Label and percentile follow the median; sort by Median CU instead
        sortable: false,
        flex: 1.1,
        render: row => (
          <ComplexityLabelChip
            label={row.label}
            pending={row.label_pending}
          />
        ),
      },
      {
        key: 'percentile',
        label: 'Percentile',
        sortable: false,
        flex: 0.8,
        render: row => ComplexityHelpers.formatPercentile(row.percentile),
      },
      {
        key: 'breakdown',
        label: 'Breakdown',
        sortable: false,
        flex: 1.6,
        render: row => <ComplexityBreakdownBar breakdown={row.breakdown} />,
      },
    ],
    [openEntity, styles.headerWithInfo, styles.nameCell, styles.nameLink],
  );

  const rows = useMemo(
    () =>
      (data?.rows ?? []).map(row => ({
        ...row,
        key: `${row.entity_project_id}:${row.entity_type}:${row.entity_id}`,
      })),
    [data?.rows],
  );

  return (
    <DrawerPage data-testid="complexity-page">
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Complexity
        </Typography>
        <InfoTooltip
          pinnable
          label="About complexity"
          infoTooltip={{ title: <ComplexityInfo meta={meta} /> }}
          testId="complexity-info-icon"
        />
        <Box sx={styles.headerSpacer} />
        <Box sx={styles.periodSelect}>
          <SingleSelect
            separateLabel
            label=""
            value={periodDays}
            options={PERIOD_OPTIONS}
            onValueChange={handlePeriod}
            data-testid="complexity-period-select"
          />
        </Box>
      </Box>

      <Box sx={styles.contentArea}>
        <Box sx={styles.notes}>
          <Typography
            variant="bodySmall"
            sx={styles.note}
            data-testid="complexity-freshness"
          >
            {ComplexityHelpers.freshnessNote(meta)}
          </Typography>
          {meta?.thresholds_source === 'default' && (
            <Typography
              variant="bodySmall"
              sx={styles.note}
              data-testid="complexity-default-thresholds"
            >
              {DEFAULT_THRESHOLDS_NOTE}
            </Typography>
          )}
        </Box>
        {meta?.stale && (
          <Alert
            severity="warning"
            data-testid="complexity-stale"
          >
            {STALE_NOTE}
          </Alert>
        )}
        {isError && <Alert severity="error">Failed to load complexity scores.</Alert>}

        <AnalyticsBreakdownTable
          title="Agents and pipelines"
          subtitle={<ComplexityBreakdownLegend />}
          columns={columns}
          rows={rows}
          loading={isFetching && !data}
          emptyText="No scored runs in this period."
          testId="complexity-table"
          sortBy={sort.sortBy}
          sortOrder={sort.sortOrder}
          onSort={handleSort}
          footer={
            data?.total > PAGE_SIZE && (
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                onPageChange={(_, next) => setPage(next)}
              />
            )
          }
        />
      </Box>
    </DrawerPage>
  );
});

ComplexityContainer.displayName = 'ComplexityContainer';

/** @type {MuiSx} */
const complexityContainerStyles = () => ({
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
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
  notes: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  note: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
  headerWithInfo: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  nameLink: {
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default ComplexityContainer;

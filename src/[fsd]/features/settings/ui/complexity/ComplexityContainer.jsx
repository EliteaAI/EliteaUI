import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useStore } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  Alert,
  Box,
  CircularProgress,
  Link,
  Snackbar,
  TablePagination,
  Tooltip,
  Typography,
} from '@mui/material';

import { analyticsApi, useAnalyticsComplexityQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsBreakdownTable } from '@/[fsd]/features/settings/ui/analytics';
import EntityTypeBadge from '@/[fsd]/features/settings/ui/analytics/components/EntityTypeBadge';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useDebounceValue, useSelectedProjectId, useSelectedProjectName } from '@/[fsd]/shared/lib/hooks';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import StyledSearchInput from '@/components/SearchInput';
import RouteDefinitions from '@/routes';

import ComplexityBreakdownBar from './components/ComplexityBreakdownBar';
import ComplexityBreakdownLegend from './components/ComplexityBreakdownLegend';
import ComplexityInfoPopover from './components/ComplexityInfoPopover';
import ComplexityLabelChip from './components/ComplexityLabelChip';
import ComplexityRefreshButton from './components/ComplexityRefreshButton';
import ComplexityTableInfo from './components/ComplexityTableInfo';
import { useComplexityListState } from './hooks/useComplexityListState.hooks';

const {
  DEFAULT_THRESHOLDS_NOTE,
  DETAIL_SEARCH_PARAMS,
  EXPORT_PAGE_SIZE,
  LIST_SEARCH_PARAMS,
  PERIOD_OPTIONS,
  ROWS_PER_PAGE_OPTIONS,
  SEARCH_TRUNCATED_NOTE,
  STALE_NOTE,
} = ComplexityConstants;

const SEARCH_DEBOUNCE_MS = 300;

const fetchAllRows = async (dispatch, args) => {
  const rows = [];
  let total = Infinity;
  while (rows.length < total) {
    const subscription = dispatch(
      analyticsApi.endpoints.analyticsComplexity.initiate(
        { ...args, limit: EXPORT_PAGE_SIZE, offset: rows.length },
        { forceRefetch: true },
      ),
    );
    try {
      const page = await subscription.unwrap();
      total = page?.total ?? 0;
      if (!page?.rows?.length) break;
      rows.push(...page.rows);
    } finally {
      subscription.unsubscribe();
    }
  }
  return rows;
};

const ComplexityContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();
  const navigate = useNavigate();
  const store = useStore();

  const { periodDays, search, sortBy, sortOrder, page, rowsPerPage, searchParams, update } =
    useComplexityListState();
  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounceValue(searchText.trim(), SEARCH_DEBOUNCE_MS);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const mounted = useRef(true);
  // Set on setup too: StrictMode runs setup, cleanup, setup in development
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Back/forward changes the URL search; re-sync the box instead of letting the old text overwrite it.
  // Skipped when only trimming differs, so a trailing space survives while typing
  useEffect(() => {
    setSearchText(previous => (previous.trim() === search ? previous : search));
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== search && debouncedSearch === searchText.trim())
      update({ [LIST_SEARCH_PARAMS.search]: debouncedSearch });
  }, [debouncedSearch, search, searchText, update]);

  const range = useMemo(() => ComplexityHelpers.periodRange(periodDays), [periodDays]);
  const queryArgs = useMemo(
    () => ({ projectId, ...range, sortBy, sortOrder, search }),
    [projectId, range, sortBy, sortOrder, search],
  );
  const { data, isFetching, isError, refetch } = useAnalyticsComplexityQuery(
    { ...queryArgs, limit: rowsPerPage, offset: page * rowsPerPage },
    { skip: !projectId },
  );
  const meta = data?.meta;

  // A bookmarked page past the end returns nothing (and total 0); go back to page one
  useEffect(() => {
    if (!isFetching && !isError && data && page > 0 && !data.rows?.length)
      update({ [LIST_SEARCH_PARAMS.page]: 0 }, { resetPage: false });
  }, [data, isFetching, isError, page, update]);

  const handleSort = useCallback(
    key =>
      update({
        [LIST_SEARCH_PARAMS.sortBy]: key,
        [LIST_SEARCH_PARAMS.sortOrder]: sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc',
      }),
    [sortBy, sortOrder, update],
  );

  const handlePeriod = useCallback(value => update({ [LIST_SEARCH_PARAMS.period]: value }), [update]);

  const handleSearchChange = useCallback(event => setSearchText(event.target.value), []);

  const handlePageChange = useCallback(
    (_, next) => update({ [LIST_SEARCH_PARAMS.page]: next }, { resetPage: false }),
    [update],
  );

  const handleRowsPerPageChange = useCallback(
    event => update({ [LIST_SEARCH_PARAMS.rowsPerPage]: parseInt(event.target.value, 10) }),
    [update],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);
    try {
      const rows = await fetchAllRows(store.dispatch, queryArgs);
      await exportToExcel(ComplexityHelpers.exportFileName(projectName, range), [
        ComplexityHelpers.buildExportSheet({
          rows,
          meta,
          projectName,
          range,
          search,
          searchTruncated: Boolean(data?.search_truncated),
        }),
      ]);
    } catch {
      if (mounted.current) setExportError(true);
    } finally {
      if (mounted.current) setExporting(false);
    }
  }, [store, queryArgs, projectName, range, meta, search, data?.search_truncated]);

  const openEntity = useCallback(
    row => {
      const path = NavigationHelpers.buildRoute(RouteDefinitions.SettingsComplexityDetail, {
        entityProjectId: row.entity_project_id,
        entityId: row.entity_id,
      });
      // The list's own query string rides along so Back restores search, sort and page
      const params = new URLSearchParams(searchParams);
      params.set(DETAIL_SEARCH_PARAMS.entityType, row.entity_type);
      params.set(DETAIL_SEARCH_PARAMS.kind, row.entity_kind);
      navigate(`${path}?${params.toString()}`);
    },
    [navigate, searchParams],
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
            <EntityTypeBadge kind={row.entity_kind} />
            <Link
              component="button"
              variant="bodyMedium"
              onClick={() => openEntity(row)}
              sx={styles.nameLink}
              data-testid="complexity-entity-link"
            >
              {row.entity_name}
            </Link>
          </Box>
        ),
      },
      { key: 'runs', label: 'Runs', flex: 0.7 },
      {
        key: 'cu_median',
        label: 'Median CU',
        flex: 0.9,
        render: row => ComplexityHelpers.formatCu(row.cu_median),
      },
      { key: 'cu_max', label: 'Max CU', flex: 0.8, render: row => ComplexityHelpers.formatCu(row.cu_max) },
      {
        key: 'label',
        label: 'Complexity',
        // Label follows the median; Percentile and Median CU give the same order
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
    [openEntity, styles.nameCell, styles.nameLink],
  );

  const rows = useMemo(
    () =>
      (data?.rows ?? []).map(row => ({
        ...row,
        key: `${row.entity_project_id}:${row.entity_type}:${row.entity_id}`,
      })),
    [data?.rows],
  );
  const total = data?.total ?? 0;

  return (
    <DrawerPage data-testid="complexity-page">
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Complexity
        </Typography>
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
        <ComplexityRefreshButton
          refetch={refetch}
          disabled={!projectId}
        />
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export to Excel'}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.icon}
              color="secondary"
              onClick={handleExport}
              disabled={exporting || !data}
              aria-label="Export to Excel"
              data-testid="complexity-export-button"
            >
              {exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon fontSize="small" />}
            </BaseBtn>
          </Box>
        </Tooltip>
        <ComplexityInfoPopover meta={meta} />
      </Box>

      <Box sx={styles.contentArea}>
        {meta?.thresholds_source === 'default' && (
          <Typography
            variant="bodySmall"
            sx={styles.note}
            data-testid="complexity-default-thresholds"
          >
            {DEFAULT_THRESHOLDS_NOTE}
          </Typography>
        )}
        {meta?.stale && (
          <Alert
            severity="warning"
            data-testid="complexity-stale"
          >
            {STALE_NOTE}
          </Alert>
        )}
        {isError && <Alert severity="error">Failed to load complexity scores.</Alert>}
        {data?.search_truncated && (
          <Alert
            severity="warning"
            data-testid="complexity-search-truncated"
          >
            {SEARCH_TRUNCATED_NOTE}
          </Alert>
        )}

        <AnalyticsBreakdownTable
          title="Agents & Pipelines"
          subtitle={
            <Box sx={styles.subtitle}>
              <Box
                component="span"
                data-testid="complexity-total"
              >
                {total} agents & pipelines
              </Box>
              <ComplexityBreakdownLegend />
            </Box>
          }
          titleAction={
            <StyledSearchInput
              search={searchText}
              onChangeSearch={handleSearchChange}
              placeholder="Search by agent or pipeline"
              sx={styles.search}
              testId="complexity-search-input"
            />
          }
          columns={columns}
          rows={rows}
          loading={isFetching && !data}
          emptyText={search ? 'No agents or pipelines match the search.' : 'No scored runs in this period.'}
          testId="complexity-table"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          fullHeight
          footer={
            <Box sx={styles.footer}>
              <ComplexityTableInfo meta={meta} />
              <TablePagination
                component="div"
                count={total}
                page={total ? page : 0}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                sx={styles.pagination}
                slotProps={{
                  select: { 'data-testid': 'complexity-pagination-rows-select' },
                  displayedRows: { 'data-testid': 'complexity-pagination-range' },
                }}
              />
            </Box>
          }
        />
      </Box>

      <Snackbar
        open={exportError}
        autoHideDuration={8000}
        onClose={() => setExportError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setExportError(false)}
          severity="error"
          variant="filled"
        >
          Unable to export complexity data. Please try again.
        </Alert>
      </Snackbar>
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
  note: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
  subtitle: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  search: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.surface.interactive.default,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
  nameCell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  nameLink: {
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default ComplexityContainer;

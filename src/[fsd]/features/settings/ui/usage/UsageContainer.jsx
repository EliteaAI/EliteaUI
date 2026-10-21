import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Alert, Box, CircularProgress, Snackbar, Tooltip, Typography } from '@mui/material';

import { usePagination } from '@/[fsd]/entities/grid-table';
import { PeriodHelpers, UsageExportHelpers, UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoBanner, infoBannerTextSx } from '@/[fsd]/features/settings/ui/analytics';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { useDebounceValue, useSelectedProject, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import { useLazyUsageMembersQuery, useProjectUsageQuery, useUsageMembersQuery } from '@/api';
import RefreshIcon from '@/assets/refresh-icon.svg?react';

import UsageBudgetHero from './components/UsageBudgetHero';
import UsageKpiRow from './components/UsageKpiRow';
import UsageLastUpdated from './components/UsageLastUpdated';
import UsageMembersTable from './components/UsageMembersTable';
import UsageModelTable from './components/UsageModelTable';
import UsageMomChart from './components/UsageMomChart';
import UsageMonthlyHistory from './components/UsageMonthlyHistory';
import UsagePeriodSelect from './components/UsagePeriodSelect';
import UsageSourcesDonut from './components/UsageSourcesDonut';
import UsageSpendChart from './components/UsageSpendChart';
import UsageTokenMix from './components/UsageTokenMix';
import UsageToolSpend from './components/UsageToolSpend';
import UsageTopAgents from './components/UsageTopAgents';
import UsageTopSkills from './components/UsageTopSkills';
import { usePeriodParam } from './hooks/usePeriodParam.hooks';
import { DEV_MOCK_DEFAULT, MOCK_MEMBERS_DATA, MOCK_USAGE_DATA, getMockDataForPeriod } from './usageMock';

const SCOPE_PROJECT = 'project';
const SCOPE_USER = 'user';

const PRIVATE_PROJECT_INFO =
  'This is your Private project. Requests made without selecting a "Team" project are charged here, including requests made with personal access tokens from external tools such as Claude Code, IDE extensions, and scripts.';

const SHARED_MODELS_INFO =
  'Only requests to platform-managed shared models count toward this budget. Usage of models configured with your own provider credentials is billed by that provider and is not included here.';

const DEGRADED_MEMBERS_INFO =
  'Recorded spend could not be read, so this list shows current members only. Members who have left the project and their spend are missing.';

const SEARCH_DEBOUNCE_MS = 400;

// One page cannot cover a large project, so the export asks for the whole list separately
const EXPORT_MEMBERS_LIMIT = 1000;

const UsageContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const [searchParams] = useSearchParams();

  const styles = usageContainerStyles();

  const isPersonalProject = useMemo(
    () => Boolean(personalProjectId) && String(projectId) === String(personalProjectId),
    [projectId, personalProjectId],
  );

  // DEV mock toggle — declared first so availablePeriods useMemo can reference it
  const [useMockData, setUseMockData] = useState(DEV_MOCK_DEFAULT);
  const [mockNoAmounts, setMockNoAmounts] = useState(false);

  // Budget-exceeded errors deep-link straight to the tab that explains the block
  const [scope, setScope] = useState(() =>
    searchParams.get('scope') === SCOPE_USER ? SCOPE_USER : SCOPE_PROJECT,
  );

  const [scopeToast, setScopeToast] = useState(false);

  const activeScope = isPersonalProject ? SCOPE_PROJECT : scope;

  // Current-period data (no period param → backend returns current month)
  const {
    data: currentData,
    isLoading: isCurrentLoading,
    isError: isCurrentError,
    isFetching: isCurrentFetching,
    refetch: refetchUsage,
  } = useProjectUsageQuery(
    { projectId, scope: activeScope },
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

  // Derive available periods list from the current response (backend may provide history list)
  const availablePeriods = useMemo(() => {
    if (useMockData) return MOCK_USAGE_DATA.available_periods;

    const periods = currentData?.available_periods;

    if (Array.isArray(periods) && periods.length) return periods;

    // Fallback: only current period available
    if (currentData?.period_yyyymm) return [currentData.period_yyyymm];

    return [];
  }, [useMockData, currentData]);

  const { period, setPeriod } = usePeriodParam(availablePeriods);

  const isCurrentPeriod = !period || period === availablePeriods[0];

  const handleScopeChange = useCallback(
    (_, value) => {
      setScope(value);
      setPeriod(null);
      setScopeToast(true);
    },
    [setPeriod],
  );

  const handleCloseScopeToast = useCallback(() => setScopeToast(false), []);

  // Only fetch a historical period when a non-current one is selected
  const {
    data: historicalData,
    isLoading: isHistoricalLoading,
    isFetching: isHistoricalFetching,
  } = useProjectUsageQuery(
    { projectId, scope: activeScope, period },
    {
      skip: !projectId || !period || isCurrentPeriod,
      refetchOnMountOrArgChange: true,
    },
  );

  // Fetch the period immediately before the selected one for deltas/comparison
  const previousPeriod = useMemo(() => {
    if (availablePeriods.length < 2) return null;

    const selectedPeriod = period || availablePeriods[0];
    const idx = availablePeriods.indexOf(selectedPeriod);

    return idx >= 0 && idx + 1 < availablePeriods.length ? availablePeriods[idx + 1] : null;
  }, [period, availablePeriods]);

  const { data: previousData } = useProjectUsageQuery(
    { projectId, scope: activeScope, period: previousPeriod },
    { skip: !projectId || !previousPeriod },
  );

  const data = isCurrentPeriod ? currentData : (historicalData ?? currentData);
  const isLoading = isCurrentLoading || isHistoricalLoading;
  const isFetching = isCurrentFetching || isHistoricalFetching;
  const isError = isCurrentError;

  const showsMembers = !isPersonalProject && activeScope === SCOPE_PROJECT;

  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberSearch = useDebounceValue(memberSearch, SEARCH_DEBOUNCE_MS);

  // Adjusted during render (not in an effect) when a fresh total arrives, so usePagination
  // never computes a page's totalPages/labels off a stale total for even one paint
  const [membersTotal, setMembersTotal] = useState(0);
  const membersPagination = usePagination({ totalRows: membersTotal, defaultPageSize: 10 });
  const { page: membersPage, pageSize: membersPageSize, resetPagination } = membersPagination;

  const membersQueryArgs = useMemo(
    () => ({
      projectId,
      limit: membersPageSize,
      offset: membersPage * membersPageSize,
      search: debouncedMemberSearch.trim() || undefined,
      ...(period && !isCurrentPeriod ? { period } : {}),
    }),
    [projectId, membersPage, membersPageSize, debouncedMemberSearch, period, isCurrentPeriod],
  );

  const {
    data: membersData,
    isFetching: isMembersFetching,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useUsageMembersQuery(membersQueryArgs, { skip: !projectId || !showsMembers });

  if (membersData?.total !== undefined && membersData.total !== membersTotal) {
    setMembersTotal(membersData.total);
  }

  // A narrowed search, or a switch to a project, can leave the current page past the new
  // total -- reset directly rather than through handlePageChange, whose totalPages guard
  // would otherwise drop the very first reset while membersTotal is still 0
  useEffect(() => {
    resetPagination();
  }, [debouncedMemberSearch, projectId, resetPagination]);

  const [fetchAllMembers] = useLazyUsageMembersQuery();

  const memberRows = useMemo(() => membersData?.rows || [], [membersData]);
  const membersWarningPct = membersData?.warning_pct;

  const handleMemberSearchClear = useCallback(() => setMemberSearch(''), []);

  const project = useSelectedProject();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  // The backend caps a single call at EXPORT_MEMBERS_LIMIT rows, so a project with more
  // spenders than that needs several calls, accumulated until the reported total is covered
  const fetchAllMemberRows = useCallback(async () => {
    let offset = 0;
    let total = Infinity;
    const rows = [];
    let warningPct;

    while (rows.length < total) {
      const page = await fetchAllMembers({ projectId, limit: EXPORT_MEMBERS_LIMIT, offset }).unwrap();

      rows.push(...(page.rows || []));
      total = page.total ?? rows.length;
      warningPct = page.warning_pct ?? warningPct;
      offset += EXPORT_MEMBERS_LIMIT;

      if (!page.rows?.length) break;
    }

    return { rows, warning_pct: warningPct };
  }, [fetchAllMembers, projectId]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);

    try {
      const args = {
        projectName: project?.name,
        scope: activeScope,
        isPersonalProject,
      };

      // Fetched in full here, so neither the displayed page nor an active search
      // can narrow what ends up in the file
      const exported = showsMembers ? await fetchAllMemberRows() : null;

      await exportToExcel(
        UsageExportHelpers.usageExportFileName(args),
        UsageExportHelpers.buildUsageSheets({
          ...args,
          data,
          memberRows: exported?.rows || memberRows,
          membersWarningPct: exported?.warning_pct ?? membersWarningPct,
        }),
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }, [
    project,
    activeScope,
    isPersonalProject,
    data,
    memberRows,
    membersWarningPct,
    showsMembers,
    fetchAllMemberRows,
  ]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(false);

    try {
      const results = await Promise.all([refetchUsage(), ...(showsMembers ? [refetchMembers()] : [])]);

      if (results.some(result => result.error)) {
        setRefreshError(true);
      }
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUsage, refetchMembers, showsMembers]);

  const handleCloseRefreshError = useCallback(() => setRefreshError(false), []);

  const exportDisabled = exporting || isLoading || !data;
  const refreshDisabled = refreshing || isLoading || isMembersFetching;

  // When mock mode is on, override live query results with period-aware fixture data
  const activePeriodKey = period || availablePeriods[0];
  const resolvedData = useMockData ? getMockDataForPeriod(activePeriodKey, mockNoAmounts) : data;
  const resolvedPreviousData = useMockData
    ? getMockDataForPeriod(previousPeriod, mockNoAmounts)
    : previousData;
  const resolvedMembersData = useMockData ? MOCK_MEMBERS_DATA : membersData;
  const resolvedIsLoading = useMockData ? false : isLoading;
  const resolvedIsError = useMockData ? false : isError;
  const resolvedIsFetching = useMockData ? false : isFetching;
  const resolvedMemberRows = useMockData ? MOCK_MEMBERS_DATA.rows : memberRows;
  const resolvedMembersWarningPct = useMockData ? MOCK_MEMBERS_DATA.warning_pct : membersWarningPct;
  const resolvedCanSeeAmounts = Boolean(resolvedData?.can_see_amounts);

  useEffect(() => {
    if (!resolvedPreviousData) setCompareEnabled(false);
  }, [resolvedPreviousData]);

  // Forecast values derived from current data for the budget hero
  const { forecast, exceedDay } = useMemo(() => {
    if (!resolvedData || !isCurrentPeriod) return { forecast: null, exceedDay: null };

    const daily = resolvedData.daily || [];
    const periodStart = resolvedData.period_start;

    if (!periodStart) return { forecast: null, exceedDay: null };

    const start = new Date(periodStart + 'T00:00:00Z');
    const today = new Date();
    const elapsedDays = Math.max(0, Math.min(Math.floor((today - start) / 86400000) + 1, daily.length));
    const d = new Date(periodStart + 'T00:00:00Z');
    const daysInMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();

    return {
      forecast: UsageHelpers.forecastSpend(resolvedData.spend, elapsedDays, daysInMonth),
      exceedDay: UsageHelpers.forecastExceedDay(
        resolvedData.spend,
        elapsedDays,
        resolvedData.effective_limit,
        daysInMonth,
      ),
    };
  }, [resolvedData, isCurrentPeriod]);

  return (
    <DrawerPage>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Usage
        </Typography>

        <Box sx={styles.headerSpacer} />

        {availablePeriods.length === 1 && (
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            {PeriodHelpers.formatPeriodLabel(availablePeriods[0])}
          </Typography>
        )}
        {availablePeriods.length > 1 && (
          <UsagePeriodSelect
            availablePeriods={availablePeriods}
            period={period}
            onChange={setPeriod}
            isCurrentPeriod={isCurrentPeriod}
          />
        )}

        <Tooltip
          title="Refresh data"
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.icon}
              color="secondary"
              onClick={handleRefresh}
              disabled={refreshDisabled}
              aria-label="Refresh data"
              data-testid="usage-refresh-button"
            >
              {refreshing ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon
                  width="1rem"
                  height="1rem"
                />
              )}
            </BaseBtn>
          </Box>
        </Tooltip>
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export to Excel'}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.icon}
              color="secondary"
              onClick={handleExport}
              disabled={exportDisabled}
              aria-label="Export to Excel"
              data-testid="usage-export-button"
            >
              {exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon fontSize="small" />}
            </BaseBtn>
          </Box>
        </Tooltip>

        {/* DEV: mock data toggle */}
        <Tooltip
          title={useMockData ? 'Using mock data — click to switch to live' : 'Use mock data (dev only)'}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={useMockData ? BUTTON_VARIANTS.elitea : BUTTON_VARIANTS.tertiary}
              onClick={() => setUseMockData(prev => !prev)}
              data-testid="usage-mock-toggle"
              sx={styles.mockBtn}
            >
              Mock
            </BaseBtn>
          </Box>
        </Tooltip>

        {useMockData && (
          <Tooltip
            title={
              mockNoAmounts
                ? 'Non-admin view (no amounts) — click to toggle'
                : 'Admin view (with amounts) — click to toggle'
            }
            placement="top"
          >
            <Box component="span">
              <BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={() => setMockNoAmounts(prev => !prev)}
                data-testid="usage-mock-amounts-toggle"
                sx={styles.mockBtn}
              >
                {mockNoAmounts ? 'No $' : 'With $'}
              </BaseBtn>
            </Box>
          </Tooltip>
        )}
      </Box>

      {!isPersonalProject && (
        <Box sx={styles.tabsContainer}>
          <BaseTabs
            value={scope}
            onChange={handleScopeChange}
          >
            <BaseTab
              value={SCOPE_PROJECT}
              label="Whole project"
            />
            <BaseTab
              value={SCOPE_USER}
              label="My usage"
            />
          </BaseTabs>
        </Box>
      )}

      <Box sx={styles.contentArea}>
        {resolvedIsLoading && (
          <Box sx={styles.loadingState}>
            <CircularProgress size={32} />
          </Box>
        )}

        {(resolvedIsError || (!resolvedIsLoading && !resolvedData)) && (
          <Alert severity="error">Usage data is currently unavailable. Please try again later.</Alert>
        )}

        {!resolvedIsLoading && resolvedData && (
          <Box sx={styles.dataContent(resolvedIsFetching)}>
            <InfoBanner>
              {isPersonalProject && (
                <Typography
                  variant="bodyMedium"
                  sx={infoBannerTextSx}
                >
                  {PRIVATE_PROJECT_INFO}
                </Typography>
              )}
              <Typography
                variant="bodyMedium"
                sx={infoBannerTextSx}
              >
                {SHARED_MODELS_INFO}
              </Typography>
            </InfoBanner>

            {!resolvedData.spend_available && (
              <Alert severity="info">
                Usage figures are still being collected for this period. They may lag live activity by a short
                time.
              </Alert>
            )}
            <UsageBudgetHero
              data={resolvedData}
              scope={activeScope}
              isCurrentPeriod={isCurrentPeriod}
              canSeeAmounts={resolvedCanSeeAmounts}
              forecast={forecast}
              exceedDay={exceedDay}
            />

            <UsageKpiRow
              data={resolvedData}
              canSeeAmounts={resolvedCanSeeAmounts}
              isCurrentPeriod={isCurrentPeriod}
              comparisonData={resolvedPreviousData}
            />

            <Box sx={styles.row}>
              <UsageSpendChart
                daily={resolvedData.daily}
                models={resolvedData.models}
                bySource={resolvedData.by_source}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                periodStart={resolvedData.period_start}
                periodEnd={resolvedData.period_end}
                isAdmin={resolvedCanSeeAmounts}
                compData={resolvedPreviousData}
                compareEnabled={compareEnabled}
                onCompareChange={setCompareEnabled}
                selectedSource={selectedSource}
                scope={activeScope}
              />
            </Box>

            {/* MoM chart + Sources donut side-by-side */}
            <Box sx={styles.splitRow}>
              <UsageMomChart
                sx={{ flex: 7 }}
                currentDaily={resolvedData.daily}
                prevDaily={resolvedPreviousData?.daily}
                limit={resolvedData.effective_limit}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                isCurrentPeriod={isCurrentPeriod}
                currentPeriodLabel={period || availablePeriods[0]}
                prevPeriodLabel={previousPeriod}
              />
              <UsageSourcesDonut
                sx={{ flex: 5 }}
                bySource={resolvedData.by_source}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                totalSpend={resolvedData.spend}
                periodLabel={period || availablePeriods[0]}
                selectedSource={selectedSource}
                onSourceClick={key => setSelectedSource(prev => (prev === key ? null : key))}
              />
            </Box>

            <UsageModelTable
              models={resolvedData.models}
              canSeeAmounts={resolvedCanSeeAmounts}
              currency={resolvedData.currency}
              comparisonModels={resolvedPreviousData?.models}
              comparisonLabel={isCurrentPeriod ? 'vs last month' : undefined}
            />

            <UsageToolSpend
              features={resolvedData.tool_spend}
              canSeeAmounts={resolvedCanSeeAmounts}
            />
            {/* Top agents + Top skills side-by-side */}
            <Box sx={styles.splitRow}>
              <UsageTopAgents
                sx={{ flex: 1 }}
                topAgents={resolvedData.top_agents}
                comparisonAgents={resolvedPreviousData?.top_agents}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                analyticsUrl="/settings/analytics?tab=agents&range=30"
              />
              <UsageTopSkills
                sx={{ flex: 1 }}
                topSkills={resolvedData.top_skills}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                analyticsUrl="/settings/analytics?tab=skills&range=30"
              />
            </Box>

            {/* Token mix + Monthly history side-by-side */}
            <Box sx={styles.splitRow}>
              <UsageTokenMix
                sx={{ flex: 1 }}
                data={resolvedData.token_mix ?? {}}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                cacheHitRate={resolvedData.cache_hit_rate ?? null}
              />
              <UsageMonthlyHistory
                sx={{ flex: 1 }}
                history={resolvedData.monthly_history}
                limit={resolvedData.effective_limit}
                canSeeAmounts={resolvedCanSeeAmounts}
                currency={resolvedData.currency}
                activePeriod={period || availablePeriods[0]}
                onSelect={setPeriod}
              />
            </Box>

            {showsMembers && (
              <>
                {resolvedMembersData?.degraded && <Alert severity="warning">{DEGRADED_MEMBERS_INFO}</Alert>}
                <UsageMembersTable
                  rows={resolvedMemberRows}
                  systemRow={resolvedMembersData?.system_row}
                  warningPct={resolvedMembersWarningPct}
                  search={memberSearch}
                  onSearchChange={setMemberSearch}
                  onSearchClear={handleMemberSearchClear}
                  pagination={membersPagination}
                  isFetching={useMockData ? false : isMembersFetching}
                  isError={useMockData ? false : isMembersError}
                  onRetry={refetchMembers}
                  comparisonRows={resolvedPreviousData?.members ?? []}
                  isCurrentPeriod={isCurrentPeriod}
                  totalRows={resolvedMembersData?.total}
                />
              </>
            )}

            <UsageLastUpdated
              lastUpdatedAt={resolvedData.generated_at}
              onRefresh={handleRefresh}
              isRefreshing={refreshing}
            />
          </Box>
        )}
      </Box>

      <Snackbar
        open={scopeToast}
        autoHideDuration={4000}
        onClose={handleCloseScopeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseScopeToast}
          severity="info"
          variant="filled"
        >
          Switched view — showing current month. Select a different period above.
        </Alert>
      </Snackbar>

      <Snackbar
        open={exportError}
        autoHideDuration={8000}
        onClose={handleCloseExportError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseExportError}
          severity="error"
          variant="filled"
        >
          Unable to export usage data. Please try again.
        </Alert>
      </Snackbar>

      <Snackbar
        open={refreshError}
        autoHideDuration={8000}
        onClose={handleCloseRefreshError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseRefreshError}
          severity="error"
          variant="filled"
        >
          Unable to refresh usage data. Please try again.
        </Alert>
      </Snackbar>
    </DrawerPage>
  );
});

UsageContainer.displayName = 'UsageContainer';

/** @type {MuiSx} */
const usageContainerStyles = () => ({
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
  headerSpacer: {
    flex: 1,
  },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  dataContent: isFetching => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    opacity: isFetching ? 0.6 : 1,
    pointerEvents: isFetching ? 'none' : 'auto',
    transition: 'opacity 0.2s ease',
  }),
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: '12rem',
  },
  mockBtn: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.625rem',
    minWidth: 0,
    height: '1.75rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  splitRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    alignItems: 'stretch',
    '& > *': { minWidth: 0 },
  },
});

export default UsageContainer;

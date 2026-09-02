import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Alert, Box, CircularProgress, Snackbar, Tooltip, Typography } from '@mui/material';

import { usePagination } from '@/[fsd]/entities/grid-table';
import { UsageExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoBanner, infoBannerTextSx } from '@/[fsd]/features/settings/ui/analytics';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import { useLazyUsageMembersQuery, useProjectUsageQuery, useUsageMembersQuery } from '@/api';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useSelectedProject, useSelectedProjectId } from '@/hooks/useSelectedProject';

import UsageDailyChart from './components/UsageDailyChart';
import UsageMembersTable from './components/UsageMembersTable';
import UsageModelTable from './components/UsageModelTable';
import UsageSummary from './components/UsageSummary';

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

  // Budget-exceeded errors deep-link straight to the tab that explains the block
  const [scope, setScope] = useState(() =>
    searchParams.get('scope') === SCOPE_USER ? SCOPE_USER : SCOPE_PROJECT,
  );

  const activeScope = isPersonalProject ? SCOPE_PROJECT : scope;

  const { data, isLoading, isError } = useProjectUsageQuery(
    { projectId, scope: activeScope },
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

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
    }),
    [projectId, membersPage, membersPageSize, debouncedMemberSearch],
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

  const canSeeAmounts = Boolean(data?.can_see_amounts);
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

  const exportDisabled = exporting || isLoading || !data;

  return (
    <DrawerPage>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Usage
        </Typography>
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export to Excel'}
          placement="top"
        >
          <Box
            component="span"
            sx={styles.exportButtonWrapper}
          >
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
      </Box>

      {!isPersonalProject && (
        <Box sx={styles.tabsContainer}>
          <BaseTabs
            value={scope}
            onChange={(_, value) => setScope(value)}
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
        {isLoading && (
          <Box sx={styles.loadingState}>
            <CircularProgress size={32} />
          </Box>
        )}

        {(isError || (!isLoading && !data)) && (
          <Alert severity="error">Usage data is currently unavailable. Please try again later.</Alert>
        )}

        {!isLoading && data && (
          <>
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

            {!data.spend_available && (
              <Alert severity="info">
                Usage figures are still being collected for this period. They may lag live activity by a short
                time.
              </Alert>
            )}

            <UsageSummary
              data={data}
              scope={activeScope}
            />

            <Box sx={styles.row}>
              <UsageDailyChart
                daily={data.daily}
                canSeeAmounts={canSeeAmounts}
                currency={data.currency}
                periodStart={data.period_start}
                periodEnd={data.period_end}
              />
            </Box>

            <UsageModelTable
              models={data.models}
              canSeeAmounts={canSeeAmounts}
              currency={data.currency}
            />

            {showsMembers && (
              <>
                {membersData?.degraded && <Alert severity="warning">{DEGRADED_MEMBERS_INFO}</Alert>}
                <UsageMembersTable
                  rows={memberRows}
                  systemRow={membersData?.system_row}
                  warningPct={membersWarningPct}
                  search={memberSearch}
                  onSearchChange={setMemberSearch}
                  onSearchClear={handleMemberSearchClear}
                  pagination={membersPagination}
                  isFetching={isMembersFetching}
                  isError={isMembersError}
                  onRetry={refetchMembers}
                />
              </>
            )}
          </>
        )}
      </Box>

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
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  // Keeps the export action at the far edge, away from the page title
  exportButtonWrapper: {
    marginLeft: 'auto',
  },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
    background: palette.background.tabPanel,
  }),
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: '12rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    flexWrap: 'wrap',
  },
});

export default UsageContainer;

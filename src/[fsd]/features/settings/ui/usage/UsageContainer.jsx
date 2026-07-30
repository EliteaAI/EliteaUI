import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Alert, Box, CircularProgress, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';

import { UsageExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import { useProjectUsageQuery, useUsageMembersQuery } from '@/api';
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

  const { data: membersData } = useUsageMembersQuery(
    { projectId },
    { skip: !projectId || isPersonalProject },
  );

  const canSeeAmounts = Boolean(data?.can_see_amounts);
  const memberRows = useMemo(() => membersData?.rows || [], [membersData]);

  const project = useSelectedProject();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);

    try {
      const args = {
        projectName: project?.name,
        scope: activeScope,
        isPersonalProject,
      };

      await exportToExcel(
        UsageExportHelpers.usageExportFileName(args),
        // Member rows come straight from the query, so an active search or the table's
        // own paging cannot narrow what gets exported
        UsageExportHelpers.buildUsageSheets({
          ...args,
          data,
          memberRows,
          membersWarningPct: membersData?.warning_pct,
        }),
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }, [project, activeScope, isPersonalProject, data, memberRows, membersData]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

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
            <IconButton
              size="small"
              onClick={handleExport}
              disabled={exporting || isLoading || !data}
              data-testid="usage-export-button"
            >
              {exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon fontSize="small" />}
            </IconButton>
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
            <Box sx={styles.infoNotes}>
              {isPersonalProject && (
                <Box sx={styles.infoNote}>
                  <InfoOutlinedIcon sx={styles.infoIcon} />
                  <Typography
                    variant="bodySmall"
                    sx={styles.infoText}
                  >
                    {PRIVATE_PROJECT_INFO}
                  </Typography>
                </Box>
              )}
              <Box sx={styles.infoNote}>
                <InfoOutlinedIcon sx={styles.infoIcon} />
                <Typography
                  variant="bodySmall"
                  sx={styles.infoText}
                >
                  {SHARED_MODELS_INFO}
                </Typography>
              </Box>
            </Box>

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

            {!isPersonalProject && activeScope === SCOPE_PROJECT && memberRows.length > 0 && (
              <UsageMembersTable
                rows={memberRows}
                warningPct={membersData?.warning_pct}
              />
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
  infoNotes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoNote: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  infoIcon: ({ palette }) => ({
    fontSize: '1rem',
    // Nudge onto the first line's baseline rather than the top of the text box
    marginTop: '0.125rem',
    flexShrink: 0,
    color: palette.text.metrics || palette.text.disabled,
  }),
  infoText: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
});

export default UsageContainer;

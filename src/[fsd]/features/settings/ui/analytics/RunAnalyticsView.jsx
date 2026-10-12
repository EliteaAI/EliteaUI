import { memo, useCallback, useMemo, useState } from 'react';

import { useStore } from 'react-redux';

import { Alert, Box, CircularProgress, Snackbar, Tooltip, Typography } from '@mui/material';

import {
  TAG_TYPE_ANALYTICS,
  analyticsApi,
  useProjectAnalyticsQuery,
} from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useRunAnalyticsFetching } from '@/[fsd]/features/settings/lib/hooks';
import {
  AnalyticsCosts,
  AnalyticsHealth,
  AnalyticsTokens,
  AnalyticsTools,
  RunFailedCallsTable,
} from '@/[fsd]/features/settings/ui/analytics';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import DownloadIcon from '@/assets/download.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

import RunAnalyticsEmptyState from './components/RunAnalyticsEmptyState';

const TAB = {
  costs: 'costs',
  tokens: 'tokens',
  tools: 'tools',
  health: 'health',
};

// Per-run analytics keeps only the tabs that make sense for one run (#6816, #6817), in this order
const RUN_ANALYTICS_TABS = [
  { value: TAB.costs, label: 'Costs', testid: 'run-analytics-tab-costs' },
  { value: TAB.tokens, label: 'Tokens', testid: 'run-analytics-tab-tokens' },
  { value: TAB.tools, label: 'Tools', testid: 'run-analytics-tab-tools' },
  { value: TAB.health, label: 'Health', testid: 'run-analytics-tab-health' },
];

const NO_QUERY_ARGS = {};

/**
 * Page shell for one run's Analytics, shared by Agent/Pipeline Run History and evaluation Results History.
 * Callers supply the run scope (`AnalyticCommonHelpers.buildRunScope`), their own breadcrumbs, the header
 * lines describing the run, the identity rows written into the Excel export, and the message shown when the
 * run cannot be resolved (spinner while `isRunLoading`).
 */
const RunAnalyticsView = memo(props => {
  const {
    runScope,
    breadcrumbs,
    infoLines = [],
    exportMeta = {},
    missingRunMessage,
    isRunLoading = false,
    showToolsTab = true,
    failedCalls,
  } = props;

  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();
  const store = useStore();

  const styles = runAnalyticsViewStyles();

  const [selectedTab, setSelectedTab] = useState(TAB.costs);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const tabs = useMemo(
    () => RUN_ANALYTICS_TABS.filter(({ value }) => showToolsTab || value !== TAB.tools),
    [showToolsTab],
  );
  const activeTab = tabs.some(({ value }) => value === selectedTab) ? selectedTab : TAB.costs;

  const queryArgs = runScope?.queryArgs ?? NO_QUERY_ARGS;
  const isHealthTab = activeTab === TAB.health;
  const hasFailedCalls = Boolean(failedCalls?.length);

  const {
    data: healthData,
    isFetching: healthFetching,
    isError: healthError,
  } = useProjectAnalyticsQuery(
    { projectId, ...queryArgs },
    { skip: !projectId || !runScope || !isHealthTab },
  );

  const isFetching = useRunAnalyticsFetching(queryArgs);

  const handleTabChange = useCallback((_, newTab) => setSelectedTab(newTab), []);

  const handleRefresh = useCallback(() => {
    if (isFetching) return;

    store.dispatch(analyticsApi.util.invalidateTags([TAG_TYPE_ANALYTICS]));
  }, [store, isFetching]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);

    try {
      const allData = await AnalyticsExportHelpers.fetchRunAnalyticsData(
        store.dispatch,
        analyticsApi.endpoints,
        { projectId, queryArgs },
      );

      const sheets = AnalyticsExportHelpers.buildRunAnalyticsSheets({
        ...allData,
        meta: {
          scopeRows: [['Project', projectName], ...(exportMeta.scopeRows ?? [])],
          noDataMessage: runScope.noDataMessage,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      await exportToExcel(
        AnalyticsExportHelpers.runAnalyticsExportFileName({
          projectName,
          entityName: exportMeta.entityName,
          suffix: exportMeta.fileSuffix,
        }),
        sheets,
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }, [store, projectId, queryArgs, projectName, exportMeta, runScope]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

  return (
    <DrawerPage data-testid="run-analytics-page">
      <Box sx={styles.header}>
        {breadcrumbs}
        <Tooltip
          title="Refresh data"
          placement="top"
        >
          <Box
            component="span"
            sx={styles.refreshButtonWrapper}
          >
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              color="secondary"
              onClick={handleRefresh}
              disabled={!runScope || isFetching}
              aria-label="Refresh data"
              data-testid="run-analytics-refresh-button"
              startIcon={isFetching ? <CircularProgress size="1rem" /> : <RefreshIcon sx={styles.icon} />}
            />
          </Box>
        </Tooltip>
        <Tooltip
          title={exporting ? 'Preparing export…' : 'Export to Excel'}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              color="secondary"
              onClick={handleExport}
              disabled={!runScope || exporting}
              aria-label="Export to Excel"
              data-testid="run-analytics-export-button"
              startIcon={exporting ? <CircularProgress size="1rem" /> : <DownloadIcon sx={styles.icon} />}
            />
          </Box>
        </Tooltip>
      </Box>
      <Box
        sx={styles.runInfoBar}
        data-testid="run-analytics-run-info"
      >
        {infoLines.map(line => (
          <Typography
            key={line}
            variant="bodySmall"
            sx={styles.runInfoText}
          >
            {line}
          </Typography>
        ))}
      </Box>
      <Box sx={styles.tabSection}>
        <Box sx={styles.tabsContainer}>
          <BaseTabs
            value={activeTab}
            onChange={handleTabChange}
          >
            {tabs.map(({ value, label, testid }) => (
              <BaseTab
                key={value}
                value={value}
                label={label}
                data-testid={testid}
              />
            ))}
          </BaseTabs>
        </Box>

        <Box sx={styles.contentArea}>
          {!runScope && isRunLoading && (
            <Box sx={styles.centeredState}>
              <CircularProgress size={32} />
            </Box>
          )}
          {!runScope && !isRunLoading && (
            <RunAnalyticsEmptyState
              message={missingRunMessage}
              testId="run-analytics-empty"
            />
          )}
          {runScope && activeTab === TAB.costs && (
            <AnalyticsCosts
              projectId={projectId}
              runScope={runScope}
            />
          )}
          {runScope && activeTab === TAB.tokens && (
            <AnalyticsTokens
              projectId={projectId}
              runScope={runScope}
            />
          )}
          {runScope && activeTab === TAB.tools && (
            <AnalyticsTools
              projectId={projectId}
              runScope={runScope}
            />
          )}
          {/* A Refresh re-fetch keeps the stale payload, so spin whenever there are no rows to keep showing */}
          {runScope && isHealthTab && healthFetching && !healthData?.health?.length && (
            <Box sx={styles.centeredState}>
              <CircularProgress size={32} />
            </Box>
          )}
          {runScope && isHealthTab && healthError && !healthFetching && (
            <Box sx={hasFailedCalls ? styles.inlineState : styles.centeredState}>
              <Typography
                variant="bodyMedium"
                sx={styles.emptyText}
              >
                Failed to load analytics data.
              </Typography>
            </Box>
          )}
          {runScope &&
            isHealthTab &&
            healthData &&
            !healthError &&
            !healthFetching &&
            !hasFailedCalls &&
            !healthData.health?.length && (
              <RunAnalyticsEmptyState
                message={runScope.noDataMessage}
                testId="run-analytics-health-empty"
              />
            )}
          {runScope && isHealthTab && healthData && !healthError && healthData.health?.length > 0 && (
            <AnalyticsHealth
              health={healthData.health}
              hideTrend
            />
          )}
          {runScope && isHealthTab && !healthFetching && hasFailedCalls && (
            <RunFailedCallsTable
              calls={failedCalls}
              sx={styles.failedCalls}
            />
          )}
        </Box>
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
          Unable to export Analytics data. Please try again.
        </Alert>
      </Snackbar>
    </DrawerPage>
  );
});

RunAnalyticsView.displayName = 'RunAnalyticsView';

/** @type {MuiSx} */
const runAnalyticsViewStyles = () => ({
  header: {
    height: '3.8rem',
    minHeight: '3.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
  },
  icon: {
    fontSize: '1rem',
  },
  refreshButtonWrapper: {
    marginLeft: 'auto',
  },
  runInfoBar: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.25rem',
    minHeight: '3.75rem',
    padding: '1rem 1.5rem',
    boxSizing: 'border-box',
    borderTop: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
  runInfoText: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
  }),
  tabSection: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.tertiary,
  }),
  contentArea: { flex: 1, overflow: 'auto', padding: '1.5rem', position: 'relative' },
  centeredState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  inlineState: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
  },
  failedCalls: {
    marginTop: '1rem',
  },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default RunAnalyticsView;

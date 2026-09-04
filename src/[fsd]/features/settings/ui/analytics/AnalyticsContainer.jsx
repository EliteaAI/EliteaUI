import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector, useStore } from 'react-redux';

import { Alert, Box, CircularProgress, Snackbar, Tooltip, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { ANALYTICS_TOUR_ID, ANALYTICS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { analyticsApi, useProjectAnalyticsQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import {
  AnalyticsAgents,
  AnalyticsCosts,
  AnalyticsGuide,
  AnalyticsHealth,
  AnalyticsOverview,
  AnalyticsTokens,
  AnalyticsTools,
  AnalyticsUsers,
} from '@/[fsd]/features/settings/ui/analytics';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { useInteractiveTour } from '@/[fsd]/shared/lib/context';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import DownloadIcon from '@/assets/download.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import CalendarIcon from '@/components/Icons/CalendarIcon';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

const CUSTOM_PRESET_VALUE = 'custom';

const DEFAULT_PRESETS = [
  { label: 'Last 24h', value: 1, buttonProps: { 'data-testid': 'analytics-date-preset-1' } },
  { label: 'Last 7d', value: 7, buttonProps: { 'data-testid': 'analytics-date-preset-7' } },
  { label: 'Last 30d', value: 30, buttonProps: { 'data-testid': 'analytics-date-preset-30' } },
  { label: 'Last 90d', value: 90, buttonProps: { 'data-testid': 'analytics-date-preset-90' } },
];

const PRESETS_WITH_CUSTOM = [
  ...DEFAULT_PRESETS,
  {
    label: 'Custom',
    value: CUSTOM_PRESET_VALUE,
    buttonProps: { 'data-testid': 'analytics-date-preset-custom' },
  },
];

// {label, testid} pairs for the Analytics tabs (ELITEA-2310) — kept as a
// module-level template so the testid inventory stays greppable, per
// .agents/testing.md § Locator policy (dynamic/derived-list testid pattern).
const ANALYTICS_TABS = [
  { label: 'Overview', testid: 'analytics-tab-overview' },
  { label: 'Costs', testid: 'analytics-tab-costs' },
  { label: 'Tokens', testid: 'analytics-tab-tokens' },
  { label: 'Agents & Pipelines', testid: 'analytics-tab-agents-pipelines' },
  { label: 'Tools', testid: 'analytics-tab-tools' },
  { label: 'Users', testid: 'analytics-tab-users' },
  { label: 'Health', testid: 'analytics-tab-health' },
  { label: 'Guide', testid: 'analytics-tab-guide' },
];

const AnalyticsContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();
  const store = useStore();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const isPersonalProject = useMemo(
    () => Boolean(projectId && personalProjectId && projectId === personalProjectId),
    [projectId, personalProjectId],
  );

  const { currentStep, tourId } = useInteractiveTour() ?? {};

  const styles = analyticsContainerStyles();

  const [selectedDatePreset, setSelectedDatePreset] = useState(1);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date());
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(0);

  const [pendingUserId, setPendingUserId] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dateFromISO = useMemo(() => dateFrom?.toISOString(), [dateFrom]);
  const dateToISO = useMemo(() => dateTo?.toISOString(), [dateTo]);

  const queryParams = useMemo(
    () => ({ projectId, dateFrom: dateFromISO, dateTo: dateToISO }),
    [projectId, dateFromISO, dateToISO],
  );

  // Only fetch overview data for Overview (0) and Health (6) tabs
  const needsOverview = activeTab === 0 || activeTab === 6;

  const { data, isFetching, isError } = useProjectAnalyticsQuery(queryParams, {
    skip: !projectId || !needsOverview,
  });

  const isCustomRange = selectedDatePreset === CUSTOM_PRESET_VALUE;
  const dateFilterPresets = isCustomRange ? PRESETS_WITH_CUSTOM : DEFAULT_PRESETS;

  const handleDatePresetChange = useCallback((_, newDays) => {
    if (newDays === null) return;

    setSelectedDatePreset(newDays);

    if (newDays === CUSTOM_PRESET_VALUE) return;

    const from = new Date();
    from.setDate(from.getDate() - newDays);

    setDateFrom(from);
    setDateTo(new Date());
  }, []);

  const handleDateFromChange = useCallback(value => {
    setDateFrom(value);
    setSelectedDatePreset(CUSTOM_PRESET_VALUE);
  }, []);

  const handleDateToChange = useCallback(value => {
    setDateTo(value);
    setSelectedDatePreset(CUSTOM_PRESET_VALUE);
  }, []);

  const handleTabChange = useCallback((_, newTab) => {
    setPendingUserId(null);
    setActiveTab(newTab);
  }, []);

  const handleOverviewUserClick = useCallback(userId => {
    setPendingUserId(userId);
    setActiveTab(5);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setPendingUserId(null);
    setActiveTab(0);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(false);

    try {
      const allData = await AnalyticsExportHelpers.fetchAllAnalyticsData(
        store.dispatch,
        analyticsApi.endpoints,
        { projectId, dateFrom: dateFromISO, dateTo: dateToISO },
      );

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const sheets = AnalyticsExportHelpers.buildAnalyticsSheets({
        ...allData,
        meta: { projectName, dateFrom: dateFromISO, dateTo: dateToISO, timeZone },
        isPersonalProject,
      });

      await exportToExcel(
        AnalyticsExportHelpers.analyticsExportFileName({
          projectName,
          dateFrom: dateFromISO,
          dateTo: dateToISO,
        }),
        sheets,
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }, [store, projectId, projectName, dateFromISO, dateToISO, isPersonalProject]);

  const handleCloseExportError = useCallback(() => setExportError(false), []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setDateTo(new Date());
  }, []);

  useEffect(() => {
    if (refreshing && !isFetching) {
      setRefreshing(false);
    }
  }, [isFetching, refreshing]);

  useEffect(() => {
    if (tourId !== ANALYTICS_TOUR_ID || !currentStep) return;
    if (typeof currentStep.tabIndex === 'number') {
      setPendingUserId(null);
      setActiveTab(currentStep.tabIndex);
    }
  }, [currentStep, tourId]);

  const datePickerCommonProps = {
    ampm: false,
    format: 'dd/MM/yyyy HH:mm',
    localeText: { okButtonLabel: 'Apply' },
    slots: {
      openPickerIcon: CalendarIcon,
      leftArrowIcon: ArrowLeftIcon,
      rightArrowIcon: ArrowRightIcon,
      switchViewIcon: ArrowDownIcon,
    },
  };

  // Per-field slotProps (From/To need distinct testids on their <input>,
  // so they can no longer share one slotProps object — ELITEA-2310).
  const getDateFieldSlotProps = (testid, openButtonTestid, popperTestid) => ({
    textField: {
      size: 'small',
      sx: styles.dateInput,
      variant: 'standard',
      inputProps: { 'data-testid': testid },
    },
    openPickerButton: { 'data-testid': openButtonTestid },
    actionBar: { actions: ['clear', 'accept'] },
    popper: {
      'data-testid': popperTestid,
      sx: styles.datePickerPopper,
      modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
    },
  });

  return (
    <DrawerPage data-tour={ANALYTICS_TOUR_TARGET_IDS.page}>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
          data-testid="analytics-page-title"
        >
          Analytics
        </Typography>
        {projectName && (
          <Box
            sx={styles.projectLabel}
            data-testid="analytics-project-badge"
          >
            <BriefcaseIcon />
            <Typography variant="bodySmall">Project: {projectName}</Typography>
          </Box>
        )}
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
              disabled={refreshing}
              aria-label="Refresh data"
              data-testid="analytics-refresh-button"
              startIcon={refreshing ? <CircularProgress size="1rem" /> : <RefreshIcon sx={styles.icon} />}
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
              disabled={exporting}
              aria-label="Export to Excel"
              data-testid="analytics-export-button"
              startIcon={exporting ? <CircularProgress size="1rem" /> : <DownloadIcon sx={styles.icon} />}
            />
          </Box>
        </Tooltip>
      </Box>
      <Box
        sx={styles.filterBar}
        data-tour={ANALYTICS_TOUR_TARGET_IDS.dateFilter}
      >
        <TabGroupButton
          exclusive
          disableTooltip
          arrayBtn={dateFilterPresets}
          value={selectedDatePreset}
          onChange={handleDatePresetChange}
        />

        <Box sx={styles.datePickerRow}>
          <Box sx={[styles.datePickerField, fromOpen && styles.datePickerFieldActive]}>
            <Typography sx={styles.datePickerLabel}>From:</Typography>
            <DateTimePicker
              value={dateFrom}
              onChange={handleDateFromChange}
              maxDateTime={dateTo}
              open={fromOpen}
              onOpen={() => setFromOpen(true)}
              onClose={() => setFromOpen(false)}
              {...datePickerCommonProps}
              slotProps={getDateFieldSlotProps(
                'analytics-date-from-input',
                'analytics-date-from-open-button',
                'analytics-date-from-popper',
              )}
            />
          </Box>
          <Box sx={[styles.datePickerField, toOpen && styles.datePickerFieldActive]}>
            <Typography sx={styles.datePickerLabel}>To:</Typography>
            <DateTimePicker
              value={dateTo}
              onChange={handleDateToChange}
              minDateTime={dateFrom}
              open={toOpen}
              onOpen={() => setToOpen(true)}
              onClose={() => setToOpen(false)}
              {...datePickerCommonProps}
              slotProps={getDateFieldSlotProps(
                'analytics-date-to-input',
                'analytics-date-to-open-button',
                'analytics-date-to-popper',
              )}
            />
          </Box>
        </Box>
      </Box>
      <Box
        sx={styles.tabSection}
        data-tour={ANALYTICS_TOUR_TARGET_IDS.tabSection}
      >
        <Box
          sx={styles.tabsContainer}
          data-tour={ANALYTICS_TOUR_TARGET_IDS.tabs}
        >
          <BaseTabs
            value={activeTab}
            onChange={handleTabChange}
          >
            {ANALYTICS_TABS.map(({ label, testid }) => (
              <BaseTab
                key={label}
                label={label}
                data-testid={testid}
              />
            ))}
          </BaseTabs>
        </Box>

        <Box sx={styles.contentArea}>
          {needsOverview && isFetching && (
            <Box
              sx={styles.loadingState}
              data-testid="analytics-loading-indicator"
            >
              <CircularProgress size={32} />
            </Box>
          )}
          {needsOverview && isError && !isFetching && (
            <Box sx={styles.emptyState}>
              <Typography
                variant="bodyMedium"
                sx={styles.emptyText}
              >
                Failed to load analytics data.
              </Typography>
            </Box>
          )}
          {data && !isFetching && activeTab === 0 && (
            <AnalyticsOverview
              data={data}
              onUserClick={handleOverviewUserClick}
              isPersonalProject={isPersonalProject}
            />
          )}
          {activeTab === 1 && (
            <AnalyticsCosts
              projectId={projectId}
              dateFrom={dateFromISO}
              dateTo={dateToISO}
            />
          )}
          {activeTab === 2 && (
            <AnalyticsTokens
              projectId={projectId}
              dateFrom={dateFromISO}
              dateTo={dateToISO}
            />
          )}
          {activeTab === 3 && (
            <AnalyticsAgents
              projectId={projectId}
              dateFrom={dateFromISO}
              dateTo={dateToISO}
            />
          )}
          {activeTab === 4 && (
            <AnalyticsTools
              projectId={projectId}
              dateFrom={dateFromISO}
              dateTo={dateToISO}
            />
          )}
          {activeTab === 5 && (
            <AnalyticsUsers
              projectId={projectId}
              dateFrom={dateFromISO}
              dateTo={dateToISO}
              initialUserId={pendingUserId}
              onBackToSource={handleBackToOverview}
            />
          )}
          {data && !isFetching && activeTab === 6 && (
            <AnalyticsHealth
              health={data.health}
              daily_activity={data.daily_activity}
            />
          )}
          {activeTab === 7 && <AnalyticsGuide />}
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

AnalyticsContainer.displayName = 'AnalyticsContainer';

/** @type {MuiSx} */
const analyticsContainerStyles = () => ({
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
  projectLabel: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    border: `1px solid ${palette.border.lines}`,
    padding: '.25rem .5rem',
    borderRadius: '.75rem',

    span: {
      color: palette.background.tooltip.default,
      fontWeight: 500,
      lineHeight: '1rem',
    },

    svg: {
      fontSize: '.825rem',

      path: { fill: palette.background.button.primary.disabled },
    },
  }),
  filterBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: `1px solid ${palette.border.table}`,
    background: palette.background.tabPanel,
  }),
  datePickerRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  datePickerField: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    padding: '.375rem .75rem',
    height: '1.75rem',
    boxSizing: 'border-box',
  }),
  datePickerFieldActive: ({ palette }) => ({
    borderBottomColor: palette.primary.main,
  }),
  datePickerLabel: ({ palette }) => ({
    color: palette.text.default,
    fontFamily: 'Montserrat',
    fontSize: '.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  dateInput: {
    width: 'auto',

    '& .MuiInput-root': {
      display: 'inline-flex',
      padding: 0,
      alignItems: 'center',

      '&::before': { display: 'none' },
      '&::after': { display: 'none' },
    },
    '& .MuiInput-input': {
      color: 'text.secondary',
      fontFamily: 'Montserrat',
      fontSize: '.75rem',
      fontWeight: 500,
      lineHeight: '1rem',
      height: '1rem',
      padding: 0,
      width: '6.5625rem',
      minWidth: 0,
      flex: 'none',
    },

    '& .MuiInputAdornment-root': ({ palette }) => ({
      display: 'inline-flex',
      alignItems: 'center',
      height: '1rem',
      marginLeft: 0,
      marginRight: '.5rem',
      marginBottom: '.5rem',

      '& .MuiIconButton-root': {
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',

        '& svg': {
          width: '1rem',
          height: '1rem',
          fontSize: '1rem',

          '& path': { fill: palette.background.tooltip.default },
        },
      },
    }),
  },
  datePickerPopper: ({ palette }) => ({
    // Dropdown container
    '& .MuiPaper-root': {
      backgroundColor: palette.background.default.secondary,
      border: `.0625rem solid ${palette.border.lines}`,
      borderRadius: '1rem',
      color: palette.text.secondary,
      backgroundImage: 'none',
      boxShadow: 'none',
    },

    // Month/year header
    '& .MuiPickersCalendarHeader-root': {
      color: palette.text.secondary,
    },
    '& .MuiPickersCalendarHeader-label': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      fontWeight: 500,
    },
    '& .MuiPickersCalendarHeader-switchViewButton': {
      color: palette.text.default,
      '& svg': { fill: palette.text.default },

      '&:hover': {
        color: palette.text.secondary,
        '& svg': { fill: palette.text.secondary },
      },
    },

    // Arrow navigation buttons — tertiary style
    '& .MuiPickersArrowSwitcher-button': {
      color: palette.text.default,
      background: 'transparent',
      borderRadius: '50%',
      width: '1.625rem',
      height: '1.625rem',
      padding: 0,
      '& svg': { fill: palette.text.default },
      '&:hover': {
        background: palette.background.button.tertiary.hover,
        color: palette.text.secondary,
        '& svg': { fill: palette.text.secondary },
      },
      '&:active': {
        background: palette.background.button.tertiary.pressed,
      },
    },

    // Weekday labels (M T W T F S S)
    '& .MuiDayCalendar-weekDayLabel': {
      color: palette.text.default,
      fontSize: '.875rem',
    },

    // Day numbers — 14px, round selected
    '& .MuiPickersDay-root': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      borderRadius: '50%',
      '&:hover': {
        backgroundColor: palette.background.button.tertiary.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.split.default,
        color: palette.text.secondary,
        borderRadius: '50%',
        '&:hover': {
          backgroundColor: palette.split.default,
        },
      },
      '&.MuiPickersDay-today': {
        borderColor: palette.border.lines,
        borderRadius: '50%',
      },
    },

    // Year picker
    '& .MuiPickersYear-yearButton': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      '&:hover': {
        backgroundColor: palette.background.button.tertiary.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.split.default,
        color: palette.text.secondary,
        '&:hover': {
          backgroundColor: palette.split.default,
        },
      },
    },

    // Time picker columns
    '& .MuiMultiSectionDigitalClock-root': {
      padding: '.75rem .5rem',

      '& .MuiList-root': {
        '&::-webkit-scrollbar': { width: '.25rem' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: palette.border.lines,
          borderRadius: '.125rem',
        },
      },
    },

    // Time numbers — keep gray
    '& .MuiMultiSectionDigitalClockSection-item': {
      color: palette.text.default,
      fontSize: '.875rem',
      borderRadius: '1.75rem',
      '&:hover': {
        backgroundColor: palette.background.button.tertiary.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.split.default,
        color: palette.text.secondary,
        borderRadius: '1.75rem',
        '&:hover': {
          backgroundColor: palette.split.default,
        },
      },
    },

    // Action buttons footer
    '& .MuiDialogActions-root': {
      backgroundColor: palette.background.tabPanel,
      borderRadius: '0 0 1rem 1rem',
      padding: '1rem',
      gap: '.5rem',

      // Clear button — secondary style
      '& .MuiButton-root': {
        backgroundColor: palette.background.button.secondary.default,
        color: palette.text.secondary,
        fontFamily: 'Montserrat',
        fontSize: '.75rem',
        fontWeight: 500,
        lineHeight: '1rem',
        borderRadius: '1.75rem',
        textTransform: 'none',
        padding: '.5rem 1.5rem',
        '&:hover': {
          backgroundColor: palette.background.button.secondary.hover,
        },
        '&:active': {
          backgroundColor: palette.background.button.secondary.pressed,
        },
      },

      // Apply button — primary style
      '& .MuiButton-root:last-child': {
        backgroundColor: palette.background.button.primary.default,
        color: palette.text.button.primary,
        '&:hover': {
          backgroundColor: palette.background.button.primary.hover,
        },
        '&:active': {
          backgroundColor: palette.background.button.primary.pressed,
        },
      },
    },
  }),
  tabSection: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  tabsContainer: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
    background: palette.background.tabPanel,
  }),
  contentArea: { flex: 1, overflow: 'auto', padding: '1.5rem', position: 'relative' },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default AnalyticsContainer;

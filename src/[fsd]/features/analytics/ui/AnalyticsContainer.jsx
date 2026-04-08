import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { useProjectAnalyticsQuery } from '@/[fsd]/features/analytics/api';
import {
  AnalyticsAgents,
  AnalyticsGuide,
  AnalyticsHealth,
  AnalyticsOverview,
  AnalyticsTools,
  AnalyticsUsers,
} from '@/[fsd]/features/analytics/ui';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import CalendarIcon from '@/components/Icons/CalendarIcon';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

const DATE_FILTER_PRESETS = [
  { label: 'Last 24h', value: 1 },
  { label: 'Last 7d', value: 7 },
  { label: 'Last 30d', value: 30 },
  { label: 'Last 90d', value: 90 },
];

const AnalyticsContainer = memo(() => {
  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();

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

  const dateFromISO = useMemo(() => dateFrom?.toISOString(), [dateFrom]);
  const dateToISO = useMemo(() => dateTo?.toISOString(), [dateTo]);

  const queryParams = useMemo(
    () => ({ projectId, dateFrom: dateFromISO, dateTo: dateToISO }),
    [projectId, dateFromISO, dateToISO],
  );

  // Only fetch overview data for Overview (0) and Health (4) tabs
  const needsOverview = activeTab === 0 || activeTab === 4;

  const { data, isFetching, isError } = useProjectAnalyticsQuery(queryParams, {
    skip: !projectId || !needsOverview,
  });

  const handleDatePresetChange = useCallback((_, newDays) => {
    if (newDays === null) return;

    setSelectedDatePreset(newDays);

    const from = new Date();
    from.setDate(from.getDate() - newDays);

    setDateFrom(from);
    setDateTo(new Date());
  }, []);

  const handleTabChange = useCallback((_, newTab) => {
    setPendingUserId(null);
    setActiveTab(newTab);
  }, []);

  const handleOverviewUserClick = useCallback(userId => {
    setPendingUserId(userId);
    setActiveTab(3);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setPendingUserId(null);
    setActiveTab(0);
  }, []);

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
    slotProps: {
      textField: { size: 'small', sx: styles.dateInput, variant: 'standard' },
      actionBar: { actions: ['clear', 'accept'] },
      popper: {
        sx: styles.datePickerPopper,
        modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
      },
    },
  };

  return (
    <DrawerPage>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Analytics
        </Typography>
        {projectName && (
          <Box sx={styles.projectLabel}>
            <BriefcaseIcon />
            <Typography variant="bodySmall">Project: {projectName}</Typography>
          </Box>
        )}
      </Box>
      <Box sx={styles.filterBar}>
        <TabGroupButton
          exclusive
          disableTooltip
          arrayBtn={DATE_FILTER_PRESETS}
          value={selectedDatePreset}
          onChange={handleDatePresetChange}
        />

        <Box sx={styles.datePickerRow}>
          <Box sx={[styles.datePickerField, fromOpen && styles.datePickerFieldActive]}>
            <Typography sx={styles.datePickerLabel}>From:</Typography>
            <DateTimePicker
              value={dateFrom}
              onChange={setDateFrom}
              maxDateTime={dateTo}
              open={fromOpen}
              onOpen={() => setFromOpen(true)}
              onClose={() => setFromOpen(false)}
              {...datePickerCommonProps}
            />
          </Box>
          <Box sx={[styles.datePickerField, toOpen && styles.datePickerFieldActive]}>
            <Typography sx={styles.datePickerLabel}>To:</Typography>
            <DateTimePicker
              value={dateTo}
              onChange={setDateTo}
              minDateTime={dateFrom}
              open={toOpen}
              onOpen={() => setToOpen(true)}
              onClose={() => setToOpen(false)}
              {...datePickerCommonProps}
            />
          </Box>
        </Box>
      </Box>
      <Box sx={styles.tabsContainer}>
        <BaseTabs
          value={activeTab}
          onChange={handleTabChange}
        >
          {['Overview', 'Agents', 'Tools', 'Users', 'Health', 'Guide'].map(label => (
            <BaseTab
              key={label}
              label={label}
            />
          ))}
        </BaseTabs>
      </Box>

      <Box sx={styles.contentArea}>
        {needsOverview && isFetching && (
          <Box sx={styles.loadingState}>
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
          />
        )}
        {activeTab === 1 && (
          <AnalyticsAgents
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
          />
        )}
        {activeTab === 2 && (
          <AnalyticsTools
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
          />
        )}
        {activeTab === 3 && (
          <AnalyticsUsers
            projectId={projectId}
            dateFrom={dateFromISO}
            dateTo={dateToISO}
            initialUserId={pendingUserId}
            onBackToSource={handleBackToOverview}
          />
        )}
        {data && !isFetching && activeTab === 4 && (
          <AnalyticsHealth
            health={data.health}
            daily_activity={data.daily_activity}
          />
        )}
        {activeTab === 5 && <AnalyticsGuide />}
      </Box>
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
      backgroundColor: palette.background.secondary,
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

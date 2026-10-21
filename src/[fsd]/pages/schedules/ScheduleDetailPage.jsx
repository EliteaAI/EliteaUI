import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Container, Link } from '@mui/material';

import {
  useGetScheduleQuery,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule';
import {
  ScheduleForm,
  ScheduleRunsPanel,
  ScheduleRunsSection,
  useEntityScheduleRoute,
  useScheduleRunsView,
} from '@/[fsd]/features/schedule';
import { buildEditValues } from '@/[fsd]/features/schedule/lib/helpers';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';
import RouteDefinitions from '@/routes';

import ScheduleDetailMenu from './ScheduleDetailMenu';

const { convertCronTimezone, getBrowserTimezone } = ScheduleHelpers;

// The Page404 layout, with the way back to the Schedules list instead of Home (R1.2)
const ScheduleNotice = ({ message }) => (
  <Container sx={styles.notice}>
    {message} Open{' '}
    <Link
      component={RouterLink}
      to={RouteDefinitions.Schedules}
      color="primary"
    >
      Schedules
    </Link>
  </Container>
);

// entityType: the page is nested in that editor and locks its entity (owner CR 2026-10-21)
const ScheduleDetailPage = props => {
  const { entityType } = props;
  const projectId = useSelectedProjectId();
  const { scheduleId, agentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    currentData: schedule,
    isError,
    error,
  } = useGetScheduleQuery({ projectId, scheduleId }, { skip: !projectId });
  const [updateSchedule] = useUpdateScheduleMutation();
  const [runSchedule] = useRunScheduleMutation();
  const entityRoute = useEntityScheduleRoute(entityType);
  const runsView = useScheduleRunsView(schedule?.id, schedule?.application_id);

  // R1.4: a schedule belongs to one project, so a project switch opens the list
  const openedProjectId = useRef();
  useEffect(() => {
    if (projectId == null) return;
    openedProjectId.current ??= projectId;
    if (projectId !== openedProjectId.current) navigate(RouteDefinitions.Schedules, { replace: true });
  }, [navigate, projectId]);

  const { values, returnTo } = useMemo(
    () => (schedule ? buildEditValues(schedule, state, entityRoute) : {}),
    [schedule, state, entityRoute],
  );

  const onSubmit = useCallback(
    body => updateSchedule({ projectId, scheduleId, ...body }).unwrap(),
    [updateSchedule, projectId, scheduleId],
  );
  const onSaved = useCallback(() => navigate(returnTo), [navigate, returnTo]);
  const onTestRun = useCallback(
    () => runSchedule({ projectId, scheduleId, trigger: 'test' }).unwrap(),
    [runSchedule, projectId, scheduleId],
  );
  // The Test schedule panel right of the form and the Runs section under the panel (owner CR 2026-10-21)
  const {
    runs,
    viewedRun,
    versionNames,
    panelRef,
    runsSectionRef,
    runsExpanded,
    setRunsExpanded,
    openRun,
    showRunHistory,
    backToTest,
    announcement,
    runNotFound,
  } = runsView;
  const sidePanel = useCallback(
    testRunProps => (
      <Box
        data-testid="schedule-right-block"
        sx={styles.rightBlock}
      >
        <ScheduleRunsPanel
          ref={panelRef}
          schedule={schedule}
          runs={runs}
          viewedRun={viewedRun}
          versionNames={versionNames}
          onRunHistory={showRunHistory}
          onBackToTest={backToTest}
          {...testRunProps}
        />
        <ScheduleRunsSection
          ref={runsSectionRef}
          runs={runs}
          versionNames={versionNames}
          selectedRunId={viewedRun?.id}
          onOpen={openRun}
          expanded={runsExpanded}
          onExpandedChange={setRunsExpanded}
          announcement={announcement}
          runNotFound={runNotFound}
        />
      </Box>
    ),
    [
      schedule,
      runs,
      viewedRun,
      versionNames,
      panelRef,
      showRunHistory,
      backToTest,
      runsSectionRef,
      openRun,
      runsExpanded,
      setRunsExpanded,
      announcement,
      runNotFound,
    ],
  );

  if (isError)
    return (
      <ScheduleNotice
        message={error?.status === 404 ? 'Schedule not found.' : 'Failed to load the schedule.'}
      />
    );
  if (!schedule)
    return (
      <Box sx={styles.loader}>
        <CircularProgress />
      </Box>
    );
  // A nested URL may name a schedule of another agent or pipeline
  if (
    entityType &&
    (schedule.entity_type !== entityType || String(schedule.application_id) !== String(agentId))
  )
    return <ScheduleNotice message="Schedule not found." />;

  const browserTimezone = getBrowserTimezone();

  return (
    <ScheduleForm
      initialValues={values}
      schedule={schedule}
      lockedEntity={entityRoute.lockedEntity}
      // Nested in an editor, the crumbs name the agent or pipeline, not the schedule
      entityName={entityType ? undefined : schedule.name}
      sidePanel={sidePanel}
      // Export and Import of this schedule (CR-16)
      headerActions={
        <ScheduleDetailMenu
          schedule={schedule}
          projectId={projectId}
        />
      }
      onSubmit={onSubmit}
      onSaved={onSaved}
      onTestRun={onTestRun}
      onCancel={onSaved}
    >
      {({ values: formValues, setFieldValue }) => (
        <>
          <ScheduleSettingsSection
            value={convertCronTimezone(formValues.cron, formValues.timezone, browserTimezone)}
            onChange={cron => {
              setFieldValue('cron', cron);
              setFieldValue('timezone', browserTimezone);
            }}
            sourceCron={schedule.cron}
            sourceTimezone={schedule.timezone}
          />
          <StopOnDateField
            value={formValues.expires_at}
            onChange={date => setFieldValue('expires_at', date)}
          />
        </>
      )}
    </ScheduleForm>
  );
};

export default ScheduleDetailPage;

/** @type {MuiSx} */
const styles = {
  notice: { marginTop: '50px', minHeight: 'calc(100vh - 191px)' },
  loader: { display: 'flex', justifyContent: 'center', padding: '3rem' },
  // The panel and the Runs section stacked (CR-21). From xl, in a window at least 46 rem (736 px) high, the
  // block stays in view: 100dvh minus the page header, its top margin and the bottom margin (6 rem). A fixed
  // height, so the runs card takes 40 % of the window and the test panel fills the rest and scrolls inside.
  rightBlock: ({ breakpoints }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    [`${breakpoints.up('xl')} and (min-height: 46rem)`]: {
      position: 'sticky',
      top: '0.75rem',
      height: 'calc(100dvh - 6rem)',
    },
  }),
};

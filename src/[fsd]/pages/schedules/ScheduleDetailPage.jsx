import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import {
  useCancelDraftTestRunMutation,
  useGetScheduleQuery,
  useRunScheduleMutation,
  useStartDraftTestRunMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule';
import {
  ScheduleForm,
  ScheduleRunsCard,
  buildEditValues,
  useEntityScheduleRoute,
  useScheduleRunsView,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';
import RouteDefinitions from '@/routes';

import ScheduleDetailMenu from './ScheduleDetailMenu';
import ScheduleNotice from './ScheduleNotice';

const { convertCronTimezone, getBrowserTimezone } = ScheduleHelpers;

// entityType: the page is nested in that editor and locks its entity
const ScheduleDetailPage = memo(props => {
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
  const [startDraftTestRun] = useStartDraftTestRunMutation();
  const [cancelDraftTestRun] = useCancelDraftTestRunMutation();
  const entityRoute = useEntityScheduleRoute(entityType);
  const runsView = useScheduleRunsView(schedule?.id, schedule?.application_id);

  // A schedule belongs to one project, so a project switch opens the list
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
  // Leaving without saving drops the hidden Test draft; the server also removes idle drafts
  const onCancel = useCallback(() => {
    if (schedule?.application_id != null)
      cancelDraftTestRun({ projectId, applicationId: schedule.application_id });
    navigate(returnTo);
  }, [cancelDraftTestRun, projectId, schedule?.application_id, navigate, returnTo]);
  const onRunNow = useCallback(
    () => runSchedule({ projectId, scheduleId, trigger: 'manual' }).unwrap(),
    [runSchedule, projectId, scheduleId],
  );
  const onDraftTestRun = useCallback(
    body => startDraftTestRun({ projectId, ...body }).unwrap(),
    [startDraftTestRun, projectId],
  );
  const sidePanel = useCallback(
    runProps => (
      <ScheduleRunsCard
        ref={runsView.cardRef}
        schedule={schedule}
        entityType={schedule?.entity_type}
        applicationId={schedule?.application_id}
        view={runsView}
        {...runProps}
      />
    ),
    [schedule, runsView],
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
      // Export of this schedule, after Cancel
      headerActions={<ScheduleDetailMenu schedule={schedule} />}
      onSubmit={onSubmit}
      onSaved={onSaved}
      onRunNow={onRunNow}
      onDraftTestRun={onDraftTestRun}
      onCancel={onCancel}
    >
      {({ values: formValues, setFieldValue, fieldError }) => (
        <>
          <ScheduleSettingsSection
            alignStart
            value={convertCronTimezone(formValues.cron, formValues.timezone, browserTimezone)}
            onChange={cron => {
              setFieldValue('cron', cron);
              setFieldValue('timezone', browserTimezone);
            }}
            sourceCron={schedule.cron}
            sourceTimezone={schedule.timezone}
            error={fieldError('cron')}
          />
          <StopOnDateField
            value={formValues.expires_at}
            onChange={date => setFieldValue('expires_at', date)}
            error={fieldError('expires_at')}
            timezone={formValues.timezone}
          />
        </>
      )}
    </ScheduleForm>
  );
});

ScheduleDetailPage.displayName = 'ScheduleDetailPage';

export default ScheduleDetailPage;

/** @type {MuiSx} */
const styles = {
  loader: { display: 'flex', justifyContent: 'center', padding: '3rem' },
};

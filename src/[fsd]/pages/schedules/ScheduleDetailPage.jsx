import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import {
  TRIGGER_KIND,
  getListRoute,
  isWebhookRow,
  useGetScheduleQuery,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule';
import {
  ScheduleForm,
  ScheduleRunsCard,
  WebhookSettingsSection,
  buildEditValues,
  useEntityScheduleRoute,
  useScheduleRunsView,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

import ScheduleDetailMenu from './ScheduleDetailMenu';
import ScheduleNotice from './ScheduleNotice';
import WebhookDetailMenu from './WebhookDetailMenu';

const { convertCronTimezone, getBrowserTimezone } = ScheduleHelpers;

// entityType: the page is nested in that editor and locks its entity; kind: the row kind of this route
const ScheduleDetailPage = memo(props => {
  const { entityType, kind = TRIGGER_KIND.cron } = props;
  const isWebhook = kind === TRIGGER_KIND.webhook;
  const noun = isWebhook ? 'Webhook' : 'Schedule';
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

  // A schedule belongs to one project, so a project switch opens the list
  const openedProjectId = useRef();
  useEffect(() => {
    if (projectId == null) return;
    openedProjectId.current ??= projectId;
    if (projectId !== openedProjectId.current) navigate(getListRoute(kind), { replace: true });
  }, [navigate, projectId, kind]);

  const { values, returnTo } = useMemo(
    () => (schedule ? buildEditValues(schedule, state, entityRoute) : {}),
    [schedule, state, entityRoute],
  );

  const onSubmit = useCallback(
    body => updateSchedule({ projectId, scheduleId, ...body }).unwrap(),
    [updateSchedule, projectId, scheduleId],
  );
  const onSaved = useCallback(() => navigate(returnTo), [navigate, returnTo]);
  const onCancel = useCallback(() => navigate(returnTo), [navigate, returnTo]);
  const onRunNow = useCallback(
    () => runSchedule({ projectId, scheduleId, trigger: 'manual' }).unwrap(),
    [runSchedule, projectId, scheduleId],
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
        message={error?.status === 404 ? `${noun} not found.` : `Failed to load the ${noun.toLowerCase()}.`}
        kind={kind}
      />
    );
  if (!schedule)
    return (
      <Box sx={styles.loader}>
        <CircularProgress />
      </Box>
    );
  // A nested URL may name a schedule of another agent or pipeline, or a row of the other kind
  if (
    isWebhookRow(schedule) !== isWebhook ||
    (entityType &&
      (schedule.entity_type !== entityType || String(schedule.application_id) !== String(agentId)))
  )
    return (
      <ScheduleNotice
        message={`${noun} not found.`}
        kind={kind}
      />
    );

  if (isWebhook)
    return (
      <ScheduleForm
        initialValues={values}
        schedule={schedule}
        lockedEntity={entityRoute.lockedEntity}
        entityName={entityType ? undefined : schedule.name}
        settingsTitle="WEBHOOK SETTINGS"
        sidePanel={sidePanel}
        // Rotate, pause and the other admin actions; the form itself is the edit
        headerActions={<WebhookDetailMenu webhook={schedule} />}
        onSubmit={onSubmit}
        onSaved={onSaved}
        onCancel={onCancel}
      >
        {({ values: formValues, setFieldValue, fieldError }) => (
          <WebhookSettingsSection
            values={formValues}
            webhook={schedule}
            setFieldValue={setFieldValue}
            fieldError={fieldError}
          />
        )}
      </ScheduleForm>
    );

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

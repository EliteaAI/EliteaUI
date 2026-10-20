import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Container, Link } from '@mui/material';

import {
  useGetScheduleQuery,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule';
import { ScheduleForm, ScheduleRunList } from '@/[fsd]/features/schedule';
import { buildEditValues } from '@/[fsd]/features/schedule/lib/helpers';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';
import RouteDefinitions from '@/routes';

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

const ScheduleDetailPage = () => {
  const projectId = useSelectedProjectId();
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    currentData: schedule,
    isError,
    error,
  } = useGetScheduleQuery({ projectId, scheduleId }, { skip: !projectId });
  const [updateSchedule] = useUpdateScheduleMutation();
  const [runSchedule] = useRunScheduleMutation();

  // R1.4: a schedule belongs to one project, so a project switch opens the list
  const openedProjectId = useRef(projectId);
  useEffect(() => {
    if (projectId !== openedProjectId.current) navigate(RouteDefinitions.Schedules, { replace: true });
  }, [navigate, projectId]);

  const { values, returnTo } = useMemo(
    () => (schedule ? buildEditValues(schedule, state) : {}),
    [schedule, state],
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
  const extraSections = useMemo(
    () => [{ title: 'RUNS OF THIS SCHEDULE', content: <ScheduleRunList schedule={schedule} /> }],
    [schedule],
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

  const browserTimezone = getBrowserTimezone();

  return (
    <ScheduleForm
      initialValues={values}
      schedule={schedule}
      entityName={schedule.name}
      extraSections={extraSections}
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
};

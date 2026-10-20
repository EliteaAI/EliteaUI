import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  useGetScheduleQuery,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule';
import { ScheduleForm, ScheduleRunList } from '@/[fsd]/features/schedule';
import { buildEditValues } from '@/[fsd]/features/schedule/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

const ScheduleDetailPage = () => {
  const projectId = useSelectedProjectId();
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    data: schedule,
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

  if (isError && error?.status === 404) return <Page404 />;
  if (!schedule) return null;

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
      {form => (
        <>
          <ScheduleSettingsSection
            value={form.values.cron}
            onChange={cron => form.setFieldValue('cron', cron)}
            sourceCron={schedule.cron}
            sourceTimezone={schedule.timezone}
          />
          <StopOnDateField
            value={form.values.expires_at}
            onChange={date => form.setFieldValue('expires_at', date)}
          />
        </>
      )}
    </ScheduleForm>
  );
};

export default ScheduleDetailPage;

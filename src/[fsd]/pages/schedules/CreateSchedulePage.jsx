import { useCallback, useMemo } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useCreateScheduleMutation } from '@/[fsd]/entities/schedule';
import {
  DEFAULT_SCHEDULE_CRON,
  ScheduleForm,
  buildInitialValues,
  useEntityScheduleRoute,
} from '@/[fsd]/features/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

// entityType: the form is nested in that editor and locks its entity (owner CR 2026-10-21)
const CreateSchedulePage = props => {
  const { entityType } = props;
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [createSchedule] = useCreateScheduleMutation();
  const entityRoute = useEntityScheduleRoute(entityType);

  const { values, urlEntity, returnTo } = useMemo(
    () => buildInitialValues(searchParams, state, entityRoute),
    [searchParams, state, entityRoute],
  );

  const onSubmit = useCallback(
    body => createSchedule({ projectId, enabled: true, ...body }).unwrap(),
    [createSchedule, projectId],
  );

  const onSaved = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  const onCancel = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  return (
    <ScheduleForm
      initialValues={values}
      lockedEntity={urlEntity}
      onSubmit={onSubmit}
      onSaved={onSaved}
      onCancel={onCancel}
    >
      {form => (
        <>
          <ScheduleSettingsSection
            value={form.values.cron}
            onChange={cron => form.setFieldValue('cron', cron)}
            sourceCron={DEFAULT_SCHEDULE_CRON}
            error={form.fieldError('cron')}
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

export default CreateSchedulePage;

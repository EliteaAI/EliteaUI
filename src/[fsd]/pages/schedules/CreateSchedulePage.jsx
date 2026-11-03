import { useCallback, useMemo, useRef } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  useCancelDraftTestRunMutation,
  useCreateScheduleMutation,
  useStartDraftTestRunMutation,
} from '@/[fsd]/entities/schedule';
import {
  DEFAULT_SCHEDULE_CRON,
  ScheduleDraftRuns,
  ScheduleForm,
  buildInitialValues,
  useEntityScheduleRoute,
} from '@/[fsd]/features/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

// entityType: the form is nested in that editor and locks its entity
const CreateSchedulePage = props => {
  const { entityType } = props;
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [createSchedule] = useCreateScheduleMutation();
  const [startDraftTestRun] = useStartDraftTestRunMutation();
  const [cancelDraftTestRun] = useCancelDraftTestRunMutation();
  const entityRoute = useEntityScheduleRoute(entityType);

  const { values, urlEntity, returnTo } = useMemo(
    () => buildInitialValues(searchParams, state, entityRoute),
    [searchParams, state, entityRoute],
  );

  const onSubmit = useCallback(
    body => createSchedule({ projectId, ...body }).unwrap(),
    [createSchedule, projectId],
  );

  const onSaved = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  const startedDraft = useRef(false);
  const onDraftTestRun = useCallback(
    async body => {
      const result = await startDraftTestRun({ projectId, ...body }).unwrap();
      startedDraft.current = true;
      return result;
    },
    [startDraftTestRun, projectId],
  );
  const sidePanel = useCallback(
    ({ values: formValues, onTestRun, testRunPending, testRunError }) => (
      <ScheduleDraftRuns
        entityType={formValues.type}
        applicationId={formValues.application_id || undefined}
        onTestRun={onTestRun}
        testRunPending={testRunPending}
        testRunError={testRunError}
      />
    ),
    [],
  );

  // The hidden draft of a Test Run is dropped when the user leaves without saving; a failed cleanup is harmless
  // because the server also removes idle drafts. Only a draft this page started goes, never one from another tab
  const onCancel = useCallback(
    formValues => {
      if (startedDraft.current && formValues?.application_id)
        cancelDraftTestRun({ projectId, applicationId: formValues.application_id });
      navigate(returnTo);
    },
    [cancelDraftTestRun, projectId, navigate, returnTo],
  );

  return (
    <ScheduleForm
      initialValues={values}
      lockedEntity={urlEntity}
      onSubmit={onSubmit}
      sidePanel={sidePanel}
      onSaved={onSaved}
      onDraftTestRun={onDraftTestRun}
      onCancel={onCancel}
    >
      {form => (
        <>
          <ScheduleSettingsSection
            alignStart
            value={form.values.cron}
            onChange={cron => form.setFieldValue('cron', cron)}
            sourceCron={DEFAULT_SCHEDULE_CRON}
            error={form.fieldError('cron')}
          />
          <StopOnDateField
            value={form.values.expires_at}
            onChange={date => form.setFieldValue('expires_at', date)}
            error={form.fieldError('expires_at')}
            timezone={form.values.timezone}
          />
        </>
      )}
    </ScheduleForm>
  );
};

export default CreateSchedulePage;

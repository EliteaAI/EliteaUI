import { useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  TOOLKIT_INDEX_TYPE,
  TRIGGER_KIND,
  useCreateScheduleMutation,
  useStartDraftTestRunMutation,
} from '@/[fsd]/entities/schedule';
import {
  DEFAULT_SCHEDULE_CRON,
  ScheduleDraftRuns,
  ScheduleForm,
  WebhookSecretDialog,
  WebhookSettingsSection,
  buildInitialValues,
  useEntityScheduleRoute,
} from '@/[fsd]/features/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

const isIndex = formValues => formValues.type === TOOLKIT_INDEX_TYPE;

// The Test runs of the form: an index is the toolkit id plus the index name. A toolkit without an index has
// no target yet, and its bare id would read as an application id.
const draftTarget = formValues => {
  if (!isIndex(formValues))
    return { applicationId: formValues.application_id || undefined, indexName: undefined };
  const indexName = formValues.index_name || undefined;
  return { applicationId: indexName ? formValues.toolkit_id || undefined : undefined, indexName };
};

// entityType: the form is nested in that editor and locks its entity; kind 'webhook' creates a webhook
const CreateSchedulePage = props => {
  const { entityType, kind = TRIGGER_KIND.cron } = props;
  const isWebhook = kind === TRIGGER_KIND.webhook;
  // The create answer of a webhook: its URL and the secret, shown once before leaving
  const [created, setCreated] = useState(null);
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const [createSchedule, { reset: resetCreate }] = useCreateScheduleMutation();
  const [startDraftTestRun] = useStartDraftTestRunMutation();
  const entityRoute = useEntityScheduleRoute(entityType);

  const { values, urlEntity, returnTo } = useMemo(
    () => buildInitialValues(searchParams, state, entityRoute, kind),
    [searchParams, state, entityRoute, kind],
  );

  const onSubmit = useCallback(
    async body => {
      const answer = await createSchedule({ projectId, ...body }).unwrap();
      // A webhook answer carries its secret once: keep it out of the mutation cache
      resetCreate();
      return answer;
    },
    [createSchedule, projectId, resetCreate],
  );

  const onSaved = useCallback(
    answer => (isWebhook ? setCreated(answer) : navigate(returnTo)),
    [isWebhook, navigate, returnTo],
  );
  const onSecretClosed = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  const onDraftTestRun = useCallback(
    body => startDraftTestRun({ projectId, ...body }).unwrap(),
    [startDraftTestRun, projectId],
  );
  const sidePanel = useCallback(
    ({ values: formValues, onTestRun, testRunPending, testRunError }) => (
      <ScheduleDraftRuns
        entityType={formValues.type}
        {...draftTarget(formValues)}
        onTestRun={onTestRun}
        testRunPending={testRunPending}
        testRunError={testRunError}
      />
    ),
    [],
  );

  const onCancel = useCallback(() => navigate(returnTo), [navigate, returnTo]);

  if (isWebhook)
    return (
      <>
        {/* No side panel: a webhook is tried with a sample delivery (#7399), not a Test Run */}
        <ScheduleForm
          initialValues={values}
          lockedEntity={urlEntity}
          settingsTitle="WEBHOOK SETTINGS"
          onSubmit={onSubmit}
          onSaved={onSaved}
          onCancel={onCancel}
        >
          {form => (
            <WebhookSettingsSection
              values={form.values}
              setFieldValue={form.setFieldValue}
              fieldError={form.fieldError}
            />
          )}
        </ScheduleForm>
        {created && (
          <WebhookSecretDialog
            open
            webhook={created}
            secret={created.secret}
            onClose={onSecretClosed}
          />
        )}
      </>
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

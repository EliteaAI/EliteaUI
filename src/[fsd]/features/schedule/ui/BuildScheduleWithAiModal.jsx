import { memo, useCallback, useMemo } from 'react';

import { Alert, Box, Typography } from '@mui/material';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGenerateScheduleDraftMutation } from '@/[fsd]/features/schedule/api';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

import { changedFields, draftToFormValues, toDraftRequest } from '../lib/helpers';

const PLACEHOLDER = 'Describe the schedule: what to run, when and until when.';
const STEPS = [{ key: 'changes', label: 'Review changes' }];
const TEST_IDS = {
  promptInputTestId: 'schedule-ai-prompt',
  errorAlertTestId: 'schedule-ai-error',
  generateButtonTestId: 'schedule-ai-generate',
  cancelButtonTestId: 'schedule-ai-cancel',
  approveButtonTestId: 'schedule-ai-approve',
};
const FIELD_LABELS = {
  name: 'Name',
  description: 'Description',
  type: 'Type',
  entity_type: 'Type',
  application_id: 'Entity',
  version_id: 'Version',
  run_mode: 'Run mode',
  prompt: 'Prompt',
  variables: 'Variables',
  cron: 'Cron',
  timezone: 'Timezone',
  expires_at: 'Expires at',
};
const DRAFT_FIELDS = Object.keys(FIELD_LABELS).filter(field => field !== 'type');

const show = value => (typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? '-'));

const toShownError = error =>
  error?.status === 503
    ? {
        data: {
          error: `The AI service is busy. Try again after ${error.data?.retry_after ?? 'a few'} seconds.`,
        },
      }
    : error;

const WarningText = ({ warnings, field }) =>
  warnings
    .filter(warning => warning.field === field)
    .map(warning => (
      <Typography
        key={warning.reason}
        color="warning.main"
        sx={{ fontSize: '0.75rem' }}
      >
        {warning.reason}
      </Typography>
    ));

const Row = ({ label, children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', mb: '0.75rem' }}>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{label}</Typography>
    {children}
  </Box>
);

const BuildScheduleWithAiModal = memo(props => {
  const { open, onClose, formik, lockedEntity } = props;
  const projectId = useSelectedProjectId();
  const [generateDraft, { error, reset }] = useGenerateScheduleDraftMutation();
  const { values, dirty, setValues } = formik;

  const handleGenerate = useCallback(
    prompt =>
      generateDraft({
        projectId,
        prompt,
        ...toDraftRequest(values, lockedEntity, ScheduleHelpers.getBrowserTimezone()),
      }),
    [generateDraft, projectId, values, lockedEntity],
  );

  const apply = useCallback(
    ({ draft }) => setValues(draftToFormValues(draft, values, lockedEntity)),
    [setValues, values, lockedEntity],
  );

  const shownError = useMemo(() => toShownError(error), [error]);
  const common = { ...TEST_IDS, open, onClose, entityLabel: 'schedule', placeholder: PLACEHOLDER };
  const generation = { onGenerate: handleGenerate, generateError: shownError, resetGenerate: reset };

  if (!dirty) {
    return (
      <GenerateEntityModal
        {...common}
        {...generation}
        onApprove={apply}
        approveLabel="Apply draft"
        renderReview={({ draft, warnings = [] }) => (
          <Box>
            {DRAFT_FIELDS.filter(field => draft[field] !== undefined && draft[field] !== null).map(field => (
              <Row
                key={field}
                label={FIELD_LABELS[field]}
              >
                <Typography sx={{ fontSize: '0.875rem' }}>{show(draft[field])}</Typography>
                <WarningText
                  warnings={warnings}
                  field={field}
                />
              </Row>
            ))}
          </Box>
        )}
      />
    );
  }

  return (
    <EditEntityModal
      {...common}
      {...generation}
      title="Build with AI"
      steps={STEPS}
      saveLabel="Accept changes"
      onDraftGenerated={result => ({
        ...result,
        changes: changedFields(values, result.draft, lockedEntity),
      })}
      onSave={apply}
      renderStep={(_key, { changes, warnings = [] }) =>
        changes.length === 0 ? (
          <Alert severity="info">The draft has no changes for the current form.</Alert>
        ) : (
          <Box sx={{ p: '1rem' }}>
            {changes.map(({ field, current, drafted }) => (
              <Row
                key={field}
                label={FIELD_LABELS[field] ?? field}
              >
                <Typography sx={{ fontSize: '0.875rem' }}>{show(current)}</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{show(drafted)}</Typography>
                <WarningText
                  warnings={warnings}
                  field={field}
                />
              </Row>
            ))}
          </Box>
        )
      }
    />
  );
});

BuildScheduleWithAiModal.displayName = 'BuildScheduleWithAiModal';

export default BuildScheduleWithAiModal;

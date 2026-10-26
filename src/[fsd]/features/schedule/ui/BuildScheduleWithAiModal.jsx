import { memo, useCallback, useMemo, useState } from 'react';

import { Alert, Box, Typography } from '@mui/material';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGenerateScheduleDraftMutation } from '@/[fsd]/features/schedule/api';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

import { changedFields, draftToFormValues, isScheduleFormEmpty, toDraftRequest } from '../lib/helpers';

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

const BuildScheduleWithAiModal = memo(props => {
  const { open, onClose, formik, lockedEntity } = props;
  const projectId = useSelectedProjectId();
  const [generateDraft, { error, reset }] = useGenerateScheduleDraftMutation();
  const { values, setValues } = formik;
  // The variant is chosen when the popup opens and stays fixed until it closes
  const [wasOpen, setWasOpen] = useState(open);
  const [isEmpty, setIsEmpty] = useState(() => isScheduleFormEmpty(values));
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIsEmpty(isScheduleFormEmpty(values));
  }
  const styles = buildScheduleWithAiModalStyles();
  const lockedFields = lockedEntity ? ['entity_type', 'application_id'] : [];

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

  // A plain render function, not a component: one file holds one component
  const renderRow = (field, label, warnings, ...cells) => (
    <Box
      key={field}
      sx={styles.row}
    >
      <Typography sx={styles.label}>{label}</Typography>
      {cells}
      {warnings
        .filter(warning => warning.field === field)
        .map((warning, index) => (
          <Typography
            key={`${warning.reason}-${index}`}
            role="status"
            sx={styles.warning}
          >
            {warning.reason}
          </Typography>
        ))}
    </Box>
  );

  const shownError = useMemo(() => toShownError(error), [error]);
  const common = { ...TEST_IDS, open, onClose, entityLabel: 'schedule', placeholder: PLACEHOLDER };
  const generation = { onGenerate: handleGenerate, generateError: shownError, resetGenerate: reset };

  if (isEmpty) {
    return (
      <GenerateEntityModal
        {...common}
        {...generation}
        onApprove={apply}
        approveLabel="Apply draft"
        renderReview={({ draft, warnings = [] }) => (
          <Box>
            {DRAFT_FIELDS.filter(
              field => !lockedFields.includes(field) && draft[field] !== undefined && draft[field] !== null,
            ).map(field =>
              renderRow(
                field,
                FIELD_LABELS[field],
                warnings,
                <Typography
                  key="value"
                  sx={styles.value}
                >
                  {show(draft[field])}
                </Typography>,
              ),
            )}
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
          <Box sx={styles.changes}>
            {changes.map(({ field, current, drafted }) =>
              renderRow(
                field,
                FIELD_LABELS[field] ?? field,
                warnings,
                <Typography
                  key="current"
                  sx={styles.value}
                >
                  {show(current)}
                </Typography>,
                <Typography
                  key="drafted"
                  sx={[styles.value, styles.drafted]}
                >
                  {show(drafted)}
                </Typography>,
              ),
            )}
          </Box>
        )
      }
    />
  );
});

BuildScheduleWithAiModal.displayName = 'BuildScheduleWithAiModal';

/** @type {MuiSx} */
const buildScheduleWithAiModalStyles = () => ({
  row: { display: 'flex', flexDirection: 'column', mb: '0.75rem' },
  label: { fontSize: '0.75rem', fontWeight: 600 },
  value: { fontSize: '0.875rem' },
  drafted: { fontWeight: 600 },
  warning: ({ palette }) => ({ fontSize: '0.75rem', color: palette.warning.main }),
  changes: { p: '1rem' },
});

export default BuildScheduleWithAiModal;

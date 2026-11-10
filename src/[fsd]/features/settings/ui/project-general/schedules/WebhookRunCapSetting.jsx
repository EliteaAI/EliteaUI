import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useGetScheduleSettingsQuery, useUpdateScheduleSettingsMutation } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const toDraft = value => (value == null ? '' : String(value));

const WebhookRunCapSetting = memo(() => {
  const styles = webhookRunCapSettingStyles();

  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const { checkPermission } = useCheckPermission();
  const isAdmin = checkPermission(PERMISSIONS.schedules.admin);
  const { data, isError } = useGetScheduleSettingsQuery({ projectId }, { skip: !projectId });
  const [updateSettings, { isLoading: isSaving }] = useUpdateScheduleSettingsMutation();
  const [draft, setDraft] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [badInput, setBadInput] = useState(false);

  const saved = data?.webhook_max_concurrent_runs;
  const limit = data?.webhook_max_concurrent_runs_limit;
  const fallback = data?.webhook_max_concurrent_runs_default;

  useEffect(() => setDraft(toDraft(saved)), [saved]);

  const onChange = useCallback(event => {
    setDraft(event.target.value);
    setBadInput(Boolean(event.target.validity?.badInput)); // `2e` or `-` reads as '' and must not reset the cap
    setFieldError('');
  }, []);

  // Saved on blur; an empty field goes back to the platform default
  const onBlur = useCallback(async () => {
    const value = draft.trim() === '' ? null : Number(draft);
    if (isSaving || (!badInput && value === (saved ?? null))) return;
    if (badInput || (value !== null && (!Number.isInteger(value) || value < 1 || value > limit))) {
      setFieldError(`Enter a whole number from 1 to ${limit}, or leave it empty for the default`);
      return;
    }
    try {
      await updateSettings({ projectId, webhookMaxConcurrentRuns: value }).unwrap();
      toastSuccess('Saved');
    } catch (error) {
      // A refused value stays in the field next to its error, so it can be corrected
      if (error?.status === 400) setFieldError(error?.data?.error || 'The value is not valid');
      else {
        toastError(error?.data?.error || 'Unable to update the webhook run limit');
        setDraft(toDraft(saved));
      }
    }
  }, [badInput, draft, isSaving, limit, projectId, saved, toastError, toastSuccess, updateSettings]);

  if (isError || !data) return null; // RunWithoutAskingSetting reports a failed read

  return (
    <Box sx={styles.root}>
      <Input.InputBase
        variant={Input.INPUT_VARIANTS.standard}
        type="number"
        label="Running runs per webhook"
        value={draft}
        placeholder={fallback != null ? `Default: ${fallback}` : ''}
        onChange={onChange}
        onBlur={onBlur}
        enableAutoBlur={false}
        disabled={!isAdmin || isSaving}
        error={!!fieldError}
        inputProps={{ min: 1, max: limit, 'data-testid': 'schedule-webhook-run-cap-input' }}
        sx={styles.field}
      />
      <Typography
        variant="bodySmall"
        color={fieldError ? 'error' : 'text.metrics'}
        data-testid="schedule-webhook-run-cap-help"
      >
        {fieldError ||
          `A delivery over this many running runs of one webhook is refused and the sender retries later. Platform maximum: ${limit}. Leave empty for the default (${fallback}).`}
      </Typography>
    </Box>
  );
});

WebhookRunCapSetting.displayName = 'WebhookRunCapSetting';
export default WebhookRunCapSetting;

/** @type {MuiSx} */
const webhookRunCapSettingStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  field: { maxWidth: '16rem' },
});

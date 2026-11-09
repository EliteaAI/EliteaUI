import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useRunScheduleMutation } from '@/[fsd]/entities/schedule';
import { WebhookConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Input, Modal } from '@/[fsd]/shared/ui';
import { buildErrorMessage } from '@/common/utils';

const { SAMPLE_PAYLOAD_MAX_BYTES, SAMPLE_RUN_CONFIRM } = WebhookConstants;

const notJson = text => {
  try {
    JSON.parse(text);
    return false;
  } catch {
    return true;
  }
};

const byteLength = text => new TextEncoder().encode(text).length;

// The sample body lives in this dialog's state only: it is not kept anywhere once the dialog closes
const WebhookSampleRunDialog = memo(props => {
  const { open, webhook, onClose, onStarted } = props;
  const styles = webhookSampleRunDialogStyles();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [runSchedule, { isLoading }] = useRunScheduleMutation();
  const [payload, setPayload] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const tooLarge = byteLength(payload) > SAMPLE_PAYLOAD_MAX_BYTES;
  const jsonWarning =
    payload.trim() && notJson(payload) ? 'Not valid JSON: the run gets it as plain text.' : '';

  const onChange = useCallback(event => {
    setPayload(event.target.value);
    setErrorMessage('');
  }, []);

  const onConfirm = useCallback(async () => {
    if (!payload.trim()) return setErrorMessage('Paste a sample body to run with.');
    if (tooLarge) return;
    try {
      await runSchedule({ projectId, scheduleId: webhook.id, trigger: 'test', payload }).unwrap();
      toastSuccess('Run started');
      onStarted?.();
      onClose();
    } catch (error) {
      if (error?.status === 400 || error?.status === 409) setErrorMessage(buildErrorMessage(error));
      else {
        toastError(buildErrorMessage(error));
        onClose();
      }
    }
  }, [onClose, onStarted, payload, projectId, runSchedule, toastError, toastSuccess, tooLarge, webhook.id]);

  const content = (
    <Box
      sx={styles.content}
      data-testid="webhook-sample-run-dialog"
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Webhook: {webhook.name}. The body is sent as if the sender had delivered it.
      </Typography>
      <Input.InputBase
        label="Sample body"
        value={payload}
        onChange={onChange}
        multiline
        minRows={8}
        maxRows={16}
        placeholder='{"action": "opened"}'
        error={tooLarge}
        helperText={tooLarge ? 'The body is over 512 KB.' : jsonWarning}
        inputProps={{ 'data-testid': 'webhook-sample-body', spellCheck: false }}
      />
      <Typography
        variant="bodySmall"
        color="warning.main"
      >
        {SAMPLE_RUN_CONFIRM}
      </Typography>
      {errorMessage && (
        <Typography
          variant="bodySmall"
          color="error"
          role="alert"
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={<Typography id="alert-dialog-title">Run with a sample body</Typography>}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Run"
      confirming={isLoading}
      confirmButtonTestId="webhook-sample-run-confirm"
      content={content}
    />
  );
});

WebhookSampleRunDialog.displayName = 'WebhookSampleRunDialog';

/** @type {MuiSx} */
const webhookSampleRunDialogStyles = () => ({
  content: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
});

export default WebhookSampleRunDialog;

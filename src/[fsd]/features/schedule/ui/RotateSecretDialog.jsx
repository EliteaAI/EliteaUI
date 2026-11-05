import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useChangeWebhookSecretMutation } from '@/[fsd]/entities/schedule';
import { WebhookHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import { GitlabSigningTokenField } from '@/[fsd]/shared/ui/webhook';
import { buildErrorMessage } from '@/common/utils';

import { isSigningRow, rotationInProgressText } from '../lib/helpers';
import WebhookSecretDialog from './WebhookSecretDialog';

const MODES = [
  { label: 'Rotate', value: 'rotate' },
  { label: 'Regenerate', value: 'regenerate' },
];
const MODE_TEXTS = {
  rotate:
    'The old secret keeps working for 24 more hours, so the sender can be updated without lost deliveries.',
  regenerate: 'The old secret stops working now. Deliveries signed with it are refused.',
};

const RotateSecretDialog = memo(props => {
  const { open, webhook, onClose } = props;
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [changeSecret, { isLoading, reset }] = useChangeWebhookSecretMutation();
  const signing = isSigningRow(webhook);
  const [mode, setMode] = useState('rotate');
  const [token, setToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const tokenError = signing && submitted ? WebhookHelpers.getGitlabSigningTokenError(token) : null;

  const onModeChange = useCallback(next => {
    setMode(next);
    setErrorMessage('');
  }, []);

  const onConfirm = useCallback(async () => {
    setSubmitted(true);
    if (signing && WebhookHelpers.getGitlabSigningTokenError(token)) return;
    try {
      const answer = await changeSecret({
        projectId,
        scheduleId: webhook.id,
        mode,
        signingSecretValue: signing ? token.trim() : undefined,
      }).unwrap();
      // The answer carries the secret once: drop it from the mutation cache, the dialog state is its only copy
      reset();
      setResult(answer);
    } catch (error) {
      if (error?.status === 409) setErrorMessage(rotationInProgressText(error.data?.previous_secret_until));
      else if (error?.status === 400) setErrorMessage(buildErrorMessage(error));
      else {
        toastError(buildErrorMessage(error));
        onClose();
      }
    }
  }, [changeSecret, mode, onClose, projectId, reset, signing, toastError, token, webhook.id]);

  if (result)
    return (
      <WebhookSecretDialog
        open={open}
        webhook={result}
        secret={result.secret}
        title={mode === 'rotate' ? 'Secret rotated' : 'Secret regenerated'}
        onClose={onClose}
      />
    );

  const content = (
    <Box
      sx={styles.content}
      data-testid="rotate-secret-dialog"
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Webhook: {webhook.name}
      </Typography>
      <Checkbox.RadioButtonGroup
        value={mode}
        items={MODES}
        onChange={onModeChange}
        testId="rotate-secret-mode"
      />
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {MODE_TEXTS[mode]}
      </Typography>
      {signing && (
        <GitlabSigningTokenField
          value={token}
          onChange={setToken}
          error={tokenError}
        />
      )}
      {/* Plain text: the banner clamps to one line and would cut the Regenerate hint */}
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
      title={<Typography id="alert-dialog-title">Change the secret</Typography>}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText={mode === 'rotate' ? 'Rotate' : 'Regenerate'}
      confirming={isLoading}
      content={content}
    />
  );
});

RotateSecretDialog.displayName = 'RotateSecretDialog';

/** @type {MuiSx} */
const styles = {
  content: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
};

export default RotateSecretDialog;

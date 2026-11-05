import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import { CopyValueField } from '@/[fsd]/shared/ui/webhook';

import { getWebhookSetupHint, isSigningRow, toFullWebhookUrl } from '../lib/helpers';

export const SECRET_NOT_SHOWN_AGAIN = 'The secret is not shown again. Copy it now.';

// The only place a webhook secret is ever shown: after create, rotate or regenerate
const WebhookSecretDialog = memo(props => {
  const { open, webhook, secret, title = 'Webhook is ready', onClose } = props;
  const signing = isSigningRow(webhook);
  const styles = webhookSecretDialogStyles();

  const content = (
    <Box
      sx={styles.content}
      data-testid="webhook-secret-dialog"
    >
      <CopyValueField
        label="URL"
        value={toFullWebhookUrl(webhook?.webhook_url)}
        testId="webhook-secret-dialog-url"
      />
      {secret && (
        <>
          <CopyValueField
            label="Secret"
            value={secret}
            masked
            testId="webhook-secret-dialog-secret"
          />
          <BannerMessage
            variant="warning"
            message={SECRET_NOT_SHOWN_AGAIN}
          />
        </>
      )}
      {signing && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          GitLab&apos;s signing token is saved. Elitea never shows it.
        </Typography>
      )}
      <Typography
        variant="bodySmall"
        color="text.secondary"
        data-testid="webhook-secret-dialog-hint"
      >
        {getWebhookSetupHint(webhook)}
      </Typography>
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={<Typography id="alert-dialog-title">{title}</Typography>}
      onClose={onClose}
      onConfirm={onClose}
      confirmButtonText="Done"
      content={content}
      data-testid="webhook-secret-modal"
    />
  );
});

WebhookSecretDialog.displayName = 'WebhookSecretDialog';

/** @type {MuiSx} */
const webhookSecretDialogStyles = () => ({
  content: { display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 },
});

export default WebhookSecretDialog;

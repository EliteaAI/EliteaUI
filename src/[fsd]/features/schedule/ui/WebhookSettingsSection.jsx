import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { WebhookConstants } from '@/[fsd]/shared/lib/constants';
import { Checkbox } from '@/[fsd]/shared/ui';
import { CopyValueField, GitlabSigningTokenField } from '@/[fsd]/shared/ui/webhook';

import { isRotating, isSigningRow, rotationText, toFullWebhookUrl, toWebhookTypeLabel } from '../lib/helpers';
import { useNow } from '../lib/hooks/useNow.hooks';

const {
  GITLAB_AUTH_METHODS,
  GITLAB_AUTH_METHOD_DESCRIPTIONS,
  GITLAB_AUTH_METHOD_OPTIONS,
  GITLAB_SIGNING_DESCRIPTION,
  WEBHOOK_TYPES,
  WEBHOOK_TYPE_DESCRIPTIONS,
  WEBHOOK_TYPE_OPTIONS,
} = WebhookConstants;

// WEBHOOK SETTINGS of the form: the sender on create; on edit it is fixed, with the URL and the rotation notice
const WebhookSettingsSection = memo(props => {
  const { values, webhook, setFieldValue, fieldError } = props;
  const now = useNow();
  const styles = webhookSettingsSectionStyles();
  const isGitlab = values.webhook_type === WEBHOOK_TYPES.gitlab;
  const signing = isGitlab && values.gitlab_auth_method === GITLAB_AUTH_METHODS.signing_token;

  // GitLab needs a method; the secret token is the default, as in the pipeline webhook modal
  const onTypeChange = useCallback(
    type => {
      setFieldValue('webhook_type', type);
      setFieldValue(
        'gitlab_auth_method',
        type === WEBHOOK_TYPES.gitlab ? GITLAB_AUTH_METHODS.secret_token : null,
      );
    },
    [setFieldValue],
  );
  const onMethodChange = useCallback(method => setFieldValue('gitlab_auth_method', method), [setFieldValue]);
  const onTokenChange = useCallback(token => setFieldValue('signing_secret_value', token), [setFieldValue]);

  if (webhook?.id)
    return (
      <Box
        sx={styles.root}
        data-testid="webhook-settings-saved"
      >
        <Typography variant="bodyMedium">Type: {toWebhookTypeLabel(webhook)}</Typography>
        <CopyValueField
          label="URL"
          value={toFullWebhookUrl(webhook.webhook_url)}
          testId="webhook-settings-url"
        />
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {isSigningRow(webhook)
            ? "GitLab's signing token is saved and never shown. Rotate the secret to paste a new one."
            : 'The secret is hidden. Rotate it from the menu to get a new one.'}
        </Typography>
        {/* Plain text: the banner clamps to one line and would cut the end time */}
        {isRotating(webhook, now) && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="webhook-rotation-banner"
          >
            {rotationText(webhook)}
          </Typography>
        )}
      </Box>
    );

  return (
    <Box
      sx={styles.root}
      data-testid="webhook-settings-new"
    >
      <Typography variant="labelMedium">Type</Typography>
      <Checkbox.RadioButtonGroup
        value={values.webhook_type}
        items={WEBHOOK_TYPE_OPTIONS}
        onChange={onTypeChange}
        testId="webhook-type-radio"
      />
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {signing ? GITLAB_SIGNING_DESCRIPTION : WEBHOOK_TYPE_DESCRIPTIONS[values.webhook_type]}
      </Typography>
      {isGitlab && (
        <>
          <Typography variant="labelMedium">Authentication</Typography>
          <Checkbox.RadioButtonGroup
            value={values.gitlab_auth_method}
            items={GITLAB_AUTH_METHOD_OPTIONS}
            onChange={onMethodChange}
            testId="webhook-gitlab-method-radio"
          />
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {GITLAB_AUTH_METHOD_DESCRIPTIONS[values.gitlab_auth_method]}
          </Typography>
        </>
      )}
      {signing && (
        <GitlabSigningTokenField
          value={values.signing_secret_value}
          onChange={onTokenChange}
          error={fieldError('signing_secret_value')}
        />
      )}
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        The URL and the secret are shown once, after Save.
      </Typography>
    </Box>
  );
});

WebhookSettingsSection.displayName = 'WebhookSettingsSection';

/** @type {MuiSx} */
const webhookSettingsSectionStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 },
});

export default WebhookSettingsSection;

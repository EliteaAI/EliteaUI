import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Button, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import {
  GITLAB_AUTH_METHODS,
  GITLAB_AUTH_METHOD_OPTIONS,
  WEBHOOK_TYPES,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/webhook.constants';
import { getGitlabSigningTokenError } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/webhook.helpers';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import FormInput from '@/components/FormInput';
import useToast from '@/hooks/useToast';

import GitlabSigningTokenField from './GitlabSigningTokenField';

const WEBHOOK_TYPE_OPTIONS = [
  { label: 'GitHub', value: WEBHOOK_TYPES.github },
  { label: 'GitLab', value: WEBHOOK_TYPES.gitlab },
  { label: 'Custom', value: WEBHOOK_TYPES.custom },
];

// Shown in place of the secret when the stored value belongs to signing mode and so cannot be
// displayed here — the saved signing token is not the secret token this mode will actually use.
const SECRET_PENDING_APPLY_TEXT =
  'This webhook currently uses a GitLab signing token. Click Apply to switch to a secret token — it will be shown here once saved.';

// Generate a random secret token (matches backend logic)
const generateSecretToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url (same as Python's secrets.token_urlsafe)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const WEBHOOK_TYPE_DESCRIPTIONS = {
  github: 'Uses x-hub-signature-256 header with HMAC-SHA256 signature',
  gitlab: 'Uses x-gitlab-token header with secret token',
  custom: 'Uses X-Webhook-Token header with secret token',
};

const GITLAB_SIGNING_DESCRIPTION =
  'GitLab signs every delivery. Elitea verifies the webhook-signature header and rejects deliveries more than 5 minutes old.';

const buildExampleRequest = ({
  webhookType,
  webhookUrl,
  secretValue,
  secretHeader,
  showSecret,
  isGitlabSigning,
}) => {
  if (!webhookUrl) return null;

  const payload = 'Your message or data here';
  const maskedSecret = '<your_secret>';
  const displaySecret = showSecret ? secretValue || maskedSecret : maskedSecret;

  // Deliberately not a curl command: the signature covers the exact body bytes, so a
  // hand-written request can never be valid. GitLab sets all three headers itself.
  if (isGitlabSigning) {
    return `POST ${webhookUrl}
webhook-id: <delivery id>
webhook-timestamp: <unix seconds>
webhook-signature: v1,<base64 hmac-sha256>

# GitLab sends these headers; the only thing you configure in GitLab is the URL above.
# The signature is taken over "{webhook-id}.{webhook-timestamp}.{raw body}" using the
# signing token, so the body cannot be altered after GitLab signs it.`;
  }

  if (webhookType === WEBHOOK_TYPES.github) {
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "X-Hub-Signature-256: sha256=<computed_hmac>" \\
  -d '${payload}'

# To compute HMAC-SHA256 signature:
# echo -n '${payload}' | openssl dgst -sha256 -hmac "${displaySecret}"`;
  }

  if (webhookType === WEBHOOK_TYPES.gitlab) {
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "X-Gitlab-Token: ${displaySecret}" \\
  -d '${payload}'`;
  }

  if (webhookType === WEBHOOK_TYPES.custom) {
    const header = secretHeader || 'X-Webhook-Token';
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "${header}: ${displaySecret}" \\
  -d '${payload}'`;
  }

  return null;
};

const PipelineWebhookModal = memo(props => {
  const {
    open,
    onClose,
    onSubmit,
    webhookType: initialWebhookType,
    webhookUrl,
    secretValue,
    secretHeader,
    secretInstructions,
    gitlabAuthMethod,
    secretConfigured,
    signingSecretConfigured,
    isLoading,
  } = props;

  const styles = pipelineWebhookModalStyles();
  const { toastSuccess, toastInfo } = useToast();

  const [selectedWebhookType, setSelectedWebhookType] = useState('github');
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(GITLAB_AUTH_METHODS.secret_token);
  const [signingTokenInput, setSigningTokenInput] = useState('');
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [pendingSecretValue, setPendingSecretValue] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (initialWebhookType) {
      setSelectedWebhookType(initialWebhookType);
    }
    setSelectedAuthMethod(gitlabAuthMethod || GITLAB_AUTH_METHODS.secret_token);
    setSigningTokenInput('');
    setShowSecretValue(false);
    setPendingSecretValue(null);
  }, [open, initialWebhookType, gitlabAuthMethod]);

  const isGitlabSigning =
    selectedWebhookType === WEBHOOK_TYPES.gitlab && selectedAuthMethod === GITLAB_AUTH_METHODS.signing_token;

  // Reported independently of the active auth method: the server keeps a stored signing token
  // when secret-token mode is saved over it, and reuses it on the way back. Falls back to the
  // active-secret flag so an older backend still enables Apply in signing mode.
  const signingTokenConfigured = Boolean(
    signingSecretConfigured ?? (gitlabAuthMethod === GITLAB_AUTH_METHODS.signing_token && secretConfigured),
  );

  // The server returns whichever secret matches the *saved* auth method, so on a signing-mode
  // trigger `secretValue` is GitLab's signing token. Surfacing it under "Secret Value" would
  // invite pasting it into GitLab's "Secret token" field, and it is not what the backend will
  // verify against once the method is switched.
  const storedSecretIsSigningToken = gitlabAuthMethod === GITLAB_AUTH_METHODS.signing_token;
  const storedSecretValue = storedSecretIsSigningToken ? null : secretValue;

  // Held back until the user types, so the field does not open in an error state.
  const signingTokenFormatError = useMemo(
    () => (isGitlabSigning && signingTokenInput ? getGitlabSigningTokenError(signingTokenInput) : null),
    [isGitlabSigning, signingTokenInput],
  );

  const handleRegenerateClick = useCallback(() => {
    const newToken = generateSecretToken();
    setPendingSecretValue(newToken);
    toastSuccess('New secret generated. Click Apply to save.');
  }, [toastSuccess]);

  // Use pending secret if regenerated, otherwise use original
  const displaySecretValue = pendingSecretValue || storedSecretValue;
  const isPendingRegenerate = pendingSecretValue !== null;

  const fullWebhookUrl = useMemo(() => {
    if (!webhookUrl) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}${webhookUrl.replace(/\/[^/]+$/, `/${selectedWebhookType}`)}`;
  }, [webhookUrl, selectedWebhookType]);

  const handleCopyUrl = useCallback(() => {
    if (fullWebhookUrl) {
      navigator.clipboard.writeText(fullWebhookUrl);
      toastInfo('The webhook URL has been copied to the clipboard.');
    }
  }, [fullWebhookUrl, toastInfo]);

  const handleCopySecret = useCallback(() => {
    if (displaySecretValue) {
      navigator.clipboard.writeText(displaySecretValue);
      toastInfo('The secret has been copied to the clipboard.');
    }
  }, [displaySecretValue, toastInfo]);

  const handleToggleSecretVisibility = useCallback(() => {
    setShowSecretValue(prev => !prev);
  }, []);

  const displayedSecretInstructions = useMemo(() => {
    if (!secretInstructions || !displaySecretValue) return secretInstructions;
    if (showSecretValue) return secretInstructions;
    return secretInstructions.replace(
      storedSecretValue || '',
      '•'.repeat(Math.min(displaySecretValue.length, 32)),
    );
  }, [secretInstructions, storedSecretValue, displaySecretValue, showSecretValue]);

  const exampleRequest = useMemo(
    () =>
      buildExampleRequest({
        webhookType: selectedWebhookType,
        webhookUrl: fullWebhookUrl,
        secretValue: displaySecretValue,
        secretHeader,
        showSecret: showSecretValue,
        isGitlabSigning,
      }),
    [selectedWebhookType, fullWebhookUrl, displaySecretValue, secretHeader, showSecretValue, isGitlabSigning],
  );

  const handleCopyExample = useCallback(() => {
    if (exampleRequest) {
      navigator.clipboard.writeText(exampleRequest);
      toastInfo('The example request has been copied to the clipboard.');
    }
  }, [exampleRequest, toastInfo]);

  const applyChanges = useCallback(() => {
    onSubmit({
      webhookType: selectedWebhookType,
      secretValue: isGitlabSigning ? undefined : pendingSecretValue,
      gitlabAuthMethod: selectedWebhookType === WEBHOOK_TYPES.gitlab ? selectedAuthMethod : undefined,
      signingTokenValue: isGitlabSigning ? signingTokenInput.trim() || undefined : undefined,
    });
    onClose();
  }, [
    onSubmit,
    selectedWebhookType,
    selectedAuthMethod,
    isGitlabSigning,
    signingTokenInput,
    pendingSecretValue,
    onClose,
  ]);

  const currentDescription = isGitlabSigning
    ? GITLAB_SIGNING_DESCRIPTION
    : WEBHOOK_TYPE_DESCRIPTIONS[selectedWebhookType];

  // In signing mode there must be a token to verify with: either one already stored, or one
  // pasted now.
  const isApplyDisabled =
    isLoading ||
    (isGitlabSigning &&
      (Boolean(signingTokenFormatError) || !(signingTokenConfigured || signingTokenInput.trim())));

  return (
    <Modal.BaseModal
      open={open}
      onClose={onClose}
      title="Webhook settings"
      data-testid="pipeline-webhook-settings-modal"
      sx={{ '& .MuiDialog-paper': { maxWidth: 'unset !important', width: '35rem !important' } }}
      content={
        <Box sx={styles.contentWrapper}>
          <Box sx={styles.section}>
            <Typography
              variant="labelMedium"
              sx={styles.sectionLabel}
            >
              Webhook Type
            </Typography>
            <Checkbox.RadioButtonGroup
              value={selectedWebhookType}
              items={WEBHOOK_TYPE_OPTIONS}
              onChange={setSelectedWebhookType}
              testId="pipeline-webhook-type-radio"
            />
            <Typography
              variant="bodySmall"
              sx={styles.description}
              data-testid="pipeline-webhook-type-description"
            >
              {currentDescription}
            </Typography>
          </Box>

          {selectedWebhookType === WEBHOOK_TYPES.gitlab && (
            <Box sx={styles.section}>
              <Typography
                variant="labelMedium"
                sx={styles.sectionLabel}
              >
                Authentication
              </Typography>
              <Checkbox.RadioButtonGroup
                value={selectedAuthMethod}
                items={GITLAB_AUTH_METHOD_OPTIONS}
                onChange={setSelectedAuthMethod}
                testId="pipeline-webhook-gitlab-auth-method-radio"
              />
            </Box>
          )}

          {webhookUrl && (
            <Box sx={styles.section}>
              <Typography
                variant="labelMedium"
                sx={styles.sectionLabel}
              >
                Webhook URL
              </Typography>
              <Box sx={styles.urlContainer}>
                <FormInput
                  value={fullWebhookUrl}
                  readOnly
                  sx={styles.urlInput}
                  inputProps={{ 'data-testid': 'pipeline-webhook-url-input' }}
                />
                <Tooltip
                  title="Copy URL"
                  placement="top"
                >
                  <IconButton
                    onClick={handleCopyUrl}
                    sx={styles.copyButton}
                    data-testid="pipeline-webhook-url-copy-button"
                  >
                    <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {isGitlabSigning && (
            <GitlabSigningTokenField
              value={signingTokenInput}
              onChange={setSigningTokenInput}
              isConfigured={signingTokenConfigured}
              error={signingTokenFormatError}
              sx={styles.section}
            />
          )}

          {!isGitlabSigning && !displaySecretValue && storedSecretIsSigningToken && (
            <Box sx={styles.section}>
              <Typography
                variant="labelMedium"
                sx={styles.sectionLabel}
              >
                Secret Value
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.helperText}
                data-testid="pipeline-webhook-secret-pending-apply-text"
              >
                {SECRET_PENDING_APPLY_TEXT}
              </Typography>
            </Box>
          )}

          {!isGitlabSigning && displaySecretValue && (
            <Box sx={styles.section}>
              <Typography
                variant="labelMedium"
                sx={styles.sectionLabel}
              >
                Secret Value{' '}
                {isPendingRegenerate && (
                  <Typography
                    component="span"
                    sx={styles.pendingText}
                  >
                    (new - click Apply to save)
                  </Typography>
                )}
              </Typography>
              <Box sx={styles.urlContainer}>
                <FormInput
                  value={showSecretValue ? displaySecretValue : '•'.repeat(displaySecretValue?.length || 32)}
                  readOnly
                  sx={[styles.urlInput, isPendingRegenerate && styles.pendingInput]}
                  inputProps={{ 'data-testid': 'pipeline-webhook-secret-input' }}
                />
                <Tooltip
                  title={showSecretValue ? 'Hide secret' : 'Show secret'}
                  placement="top"
                >
                  <IconButton
                    onClick={handleToggleSecretVisibility}
                    sx={styles.copyButton}
                    data-testid="pipeline-webhook-secret-toggle-button"
                  >
                    {showSecretValue ? (
                      <VisibilityOffIcon sx={{ fontSize: '1rem' }} />
                    ) : (
                      <VisibilityIcon sx={{ fontSize: '1rem' }} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Copy secret"
                  placement="top"
                >
                  <IconButton
                    onClick={handleCopySecret}
                    sx={styles.copyButton}
                    data-testid="pipeline-webhook-secret-copy-button"
                  >
                    <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Regenerate secret"
                  placement="top"
                >
                  <IconButton
                    onClick={handleRegenerateClick}
                    sx={styles.copyButton}
                    data-testid="pipeline-webhook-secret-regenerate-button"
                  >
                    <RefreshIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              {!isPendingRegenerate && displayedSecretInstructions && (
                <Typography
                  variant="bodySmall"
                  sx={styles.helperText}
                  data-testid="pipeline-webhook-secret-helper-text"
                >
                  {displayedSecretInstructions}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={styles.section}>
            <Typography
              variant="labelMedium"
              sx={styles.sectionLabel}
            >
              Payload Format
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.description}
              data-testid="pipeline-webhook-payload-format-description"
            >
              Send a POST request with any body content. The raw request body will be passed directly to the
              pipeline as user input.
            </Typography>
          </Box>

          {exampleRequest && (
            <Box sx={styles.section}>
              <Box sx={styles.exampleHeader}>
                <Typography
                  variant="labelMedium"
                  sx={styles.sectionLabel}
                >
                  Example Request
                </Typography>
                <Tooltip
                  title="Copy example"
                  placement="top"
                >
                  <IconButton
                    onClick={handleCopyExample}
                    sx={styles.copyButton}
                    data-testid="pipeline-webhook-example-request-copy-button"
                  >
                    <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={styles.codeBlock}>
                <Typography
                  component="pre"
                  sx={styles.codeText}
                  data-testid="pipeline-webhook-example-request-block"
                >
                  {exampleRequest}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button
            sx={styles.actionBtn}
            variant="elitea"
            color="secondary"
            onClick={onClose}
            data-testid="pipeline-webhook-modal-cancel-button"
          >
            Cancel
          </Button>
          <Button
            sx={styles.actionBtn}
            variant="elitea"
            color="primary"
            onClick={applyChanges}
            disabled={isApplyDisabled}
            data-testid="pipeline-webhook-modal-apply-button"
          >
            Apply
          </Button>
        </Box>
      }
    />
  );
});

PipelineWebhookModal.displayName = 'PipelineWebhookModal';

/** @type {MuiSx} */
const pipelineWebhookModalStyles = () => ({
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: '25rem',
    padding: '0',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  description: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.75rem',
  }),
  helperText: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.75rem',
    fontStyle: 'italic',
  }),
  urlContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  urlInput: {
    flex: 1,
    '& input': {
      fontSize: '0.75rem',
      fontFamily: 'monospace',
    },
  },
  pendingInput: ({ palette }) => ({
    '& input': {
      borderColor: palette.warning.main,
      color: palette.warning.main,
    },
  }),
  copyButton: ({ palette }) => ({
    padding: '0.5rem',
    color: palette.icon.secondary,
    '&:hover': {
      color: palette.primary.main,
    },
  }),
  pendingButton: ({ palette }) => ({
    color: palette.warning.main,
    '&:hover': {
      color: palette.warning.main,
    },
  }),
  pendingText: ({ palette }) => ({
    color: palette.warning.main,
    fontSize: '0.75rem',
    fontStyle: 'italic',
  }),
  actionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    gap: '.75rem',
  },
  actionBtn: {
    width: '4.25rem',
  },
  exampleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeBlock: ({ palette }) => ({
    backgroundColor: palette.background.default.secondary,
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.75rem',
    overflow: 'auto',
    maxHeight: '12rem',
  }),
  codeText: ({ palette }) => ({
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
  }),
});

export default PipelineWebhookModal;

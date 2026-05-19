import { useCallback, useEffect, useMemo, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Button, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import FormInput from '@/components/FormInput';
import useToast from '@/hooks/useToast';

const WEBHOOK_TYPE_OPTIONS = [
  { label: 'GitHub', value: 'github' },
  { label: 'GitLab', value: 'gitlab' },
  { label: 'Custom', value: 'custom' },
];

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

const buildExampleRequest = (webhookType, webhookUrl, secretValue, secretHeader, showSecret) => {
  if (!webhookUrl) return null;

  const payload = 'Your message or data here';
  const maskedSecret = '<your_secret>';
  const displaySecret = showSecret ? secretValue || maskedSecret : maskedSecret;

  if (webhookType === 'github') {
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "X-Hub-Signature-256: sha256=<computed_hmac>" \\
  -d '${payload}'

# To compute HMAC-SHA256 signature:
# echo -n '${payload}' | openssl dgst -sha256 -hmac "${displaySecret}"`;
  }

  if (webhookType === 'gitlab') {
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "X-Gitlab-Token: ${displaySecret}" \\
  -d '${payload}'`;
  }

  if (webhookType === 'custom') {
    const header = secretHeader || 'X-Webhook-Token';
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: text/plain" \\
  -H "${header}: ${displaySecret}" \\
  -d '${payload}'`;
  }

  return null;
};

const PipelineWebhookModal = props => {
  const {
    open,
    onClose,
    onSubmit,
    webhookType: initialWebhookType,
    webhookUrl,
    secretValue,
    secretHeader,
    secretInstructions,
    isLoading,
  } = props;

  const styles = pipelineWebhookModalStyles();
  const { toastSuccess } = useToast();

  const [selectedWebhookType, setSelectedWebhookType] = useState('github');
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [pendingSecretValue, setPendingSecretValue] = useState(null);

  useEffect(() => {
    if (open && initialWebhookType) {
      setSelectedWebhookType(initialWebhookType);
    }
    if (open) {
      setShowSecretValue(false);
      setPendingSecretValue(null);
    }
  }, [open, initialWebhookType]);

  const handleRegenerateClick = useCallback(() => {
    const newToken = generateSecretToken();
    setPendingSecretValue(newToken);
    toastSuccess('New secret generated. Click Apply to save.');
  }, [toastSuccess]);

  // Use pending secret if regenerated, otherwise use original
  const displaySecretValue = pendingSecretValue || secretValue;
  const isPendingRegenerate = pendingSecretValue !== null;

  const fullWebhookUrl = useMemo(() => {
    if (!webhookUrl) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}${webhookUrl.replace(/\/[^/]+$/, `/${selectedWebhookType}`)}`;
  }, [webhookUrl, selectedWebhookType]);

  const handleCopyUrl = useCallback(() => {
    if (fullWebhookUrl) {
      navigator.clipboard.writeText(fullWebhookUrl);
      toastSuccess('Webhook URL copied to clipboard');
    }
  }, [fullWebhookUrl, toastSuccess]);

  const handleCopySecret = useCallback(() => {
    if (displaySecretValue) {
      navigator.clipboard.writeText(displaySecretValue);
      toastSuccess('Secret copied to clipboard');
    }
  }, [displaySecretValue, toastSuccess]);

  const handleToggleSecretVisibility = useCallback(() => {
    setShowSecretValue(prev => !prev);
  }, []);

  const displayedSecretInstructions = useMemo(() => {
    if (!secretInstructions || !displaySecretValue) return secretInstructions;
    if (showSecretValue) return secretInstructions;
    return secretInstructions.replace(secretValue || '', '•'.repeat(Math.min(displaySecretValue.length, 32)));
  }, [secretInstructions, secretValue, displaySecretValue, showSecretValue]);

  const exampleRequest = useMemo(
    () =>
      buildExampleRequest(
        selectedWebhookType,
        fullWebhookUrl,
        displaySecretValue,
        secretHeader,
        showSecretValue,
      ),
    [selectedWebhookType, fullWebhookUrl, displaySecretValue, secretHeader, showSecretValue],
  );

  const handleCopyExample = useCallback(() => {
    if (exampleRequest) {
      navigator.clipboard.writeText(exampleRequest);
      toastSuccess('Example request copied to clipboard');
    }
  }, [exampleRequest, toastSuccess]);

  const applyChanges = useCallback(() => {
    onSubmit(selectedWebhookType, pendingSecretValue);
    onClose();
  }, [onSubmit, selectedWebhookType, pendingSecretValue, onClose]);

  const currentDescription = WEBHOOK_TYPE_DESCRIPTIONS[selectedWebhookType];

  return (
    <Modal.BaseModal
      open={open}
      onClose={onClose}
      title="Webhook settings"
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
            />
            <Typography
              variant="bodySmall"
              sx={styles.description}
            >
              {currentDescription}
            </Typography>
          </Box>

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
                />
                <Tooltip
                  title="Copy URL"
                  placement="top"
                >
                  <IconButton
                    onClick={handleCopyUrl}
                    sx={styles.copyButton}
                  >
                    <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {secretValue && (
            <Box sx={styles.section}>
              <Typography
                variant="labelMedium"
                sx={styles.sectionLabel}
              >
                Secret Value{' '}
                {isPendingRegenerate && (
                  <span style={{ color: 'orange', fontSize: '0.7rem' }}>(new - click Apply to save)</span>
                )}
              </Typography>
              <Box sx={styles.urlContainer}>
                <FormInput
                  value={showSecretValue ? displaySecretValue : '•'.repeat(displaySecretValue?.length || 32)}
                  readOnly
                  sx={[styles.urlInput, isPendingRegenerate && styles.pendingInput]}
                />
                <Tooltip
                  title={showSecretValue ? 'Hide secret' : 'Show secret'}
                  placement="top"
                >
                  <IconButton
                    onClick={handleToggleSecretVisibility}
                    sx={styles.copyButton}
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
                  >
                    <RefreshIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              {!isPendingRegenerate && displayedSecretInstructions && (
                <Typography
                  variant="bodySmall"
                  sx={styles.helperText}
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
                  >
                    <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={styles.codeBlock}>
                <Typography
                  component="pre"
                  sx={styles.codeText}
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
          >
            Cancel
          </Button>
          <Button
            sx={styles.actionBtn}
            variant="elitea"
            color="primary"
            onClick={applyChanges}
            disabled={isLoading}
          >
            Apply
          </Button>
        </Box>
      }
    />
  );
};

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
    color: palette.icon.fill.secondary,
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
    backgroundColor: palette.background.secondary,
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

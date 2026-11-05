import { WebhookConstants } from '@/[fsd]/shared/lib/constants';

import { formatRunStarted } from './scheduleRuns.helpers';

const { GITLAB_AUTH_METHODS, WEBHOOK_SETUP_HINTS, WEBHOOK_TYPES, WEBHOOK_TYPE_LABELS } = WebhookConstants;

// The API sends the path only; senders need the full address
export const toFullWebhookUrl = path => (path ? `${window.location.origin}${path}` : '');

export const isSigningRow = row =>
  row?.webhook_type === WEBHOOK_TYPES.gitlab && row?.gitlab_auth_method === GITLAB_AUTH_METHODS.signing_token;

export const toWebhookTypeLabel = row => {
  const label = WEBHOOK_TYPE_LABELS[row?.webhook_type] ?? row?.webhook_type ?? '-';
  return isSigningRow(row) ? `${label} (signing token)` : label;
};

export const getWebhookSetupHint = row =>
  WEBHOOK_SETUP_HINTS[isSigningRow(row) ? 'gitlab_signing' : row?.webhook_type] ?? '';

// The previous secret is still accepted: rotate keeps it for 24 h
export const isRotating = (row, now = Date.now()) =>
  Boolean(row?.previous_secret_until) && new Date(row.previous_secret_until).getTime() > now;

export const rotationText = row =>
  `The previous secret stays valid until ${formatRunStarted(row.previous_secret_until)}.`;

export const rotationInProgressText = until =>
  `A rotation is in progress until ${until ? formatRunStarted(until) : 'later'}. Use Regenerate to replace the secret now.`;

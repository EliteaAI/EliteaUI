export const TRIGGER_TYPES = {
  chat_message: 'chat_message',
  schedule: 'schedule',
  webhook: 'webhook',
};

export const WEBHOOK_TYPES = {
  github: 'github',
  gitlab: 'gitlab',
  custom: 'custom',
};

export const GITLAB_AUTH_METHODS = {
  secret_token: 'secret_token',
  signing_token: 'signing_token',
};

export const WEBHOOK_TYPE_OPTIONS = [
  { label: 'GitHub', value: WEBHOOK_TYPES.github },
  { label: 'GitLab', value: WEBHOOK_TYPES.gitlab },
  { label: 'Custom', value: WEBHOOK_TYPES.custom },
];

// Signed senders, as the API's `signed`: GitHub, and GitLab with a signing token (marked on the method)
export const RECOMMENDED_SUFFIX = ' (recommended)';

export const RUN_WITHOUT_ASKING_SECRET_WARNING =
  "Anyone holding this webhook's secret can start runs that act without approval. Treat it like a password: rotate it when people leave, and never paste it into chats or screenshots.";
export const UNSIGNED_REPLAY_WARNING =
  'Requests of this type are not signed, so a copied request can be sent again.';

// What the delivery door stored for the last authentic request (`last_delivery_outcome`)
export const DELIVERY_OUTCOME_LABELS = {
  accepted: 'Accepted',
  duplicate: 'Duplicate',
  ping: 'Ping received',
  disabled: 'Disabled',
  refused: 'Refused',
  capped: 'Too many runs',
  start_failed: 'Start failed',
};

export const SAMPLE_RUN_CONFIRM = 'This runs the real agent or pipeline as you, with its tools.';
// The API caps the sample body at 512 KB of UTF-8, as the delivery door
export const SAMPLE_PAYLOAD_MAX_BYTES = 512 * 1024;

export const WEBHOOK_TYPE_LABELS = { github: 'GitHub', gitlab: 'GitLab', custom: 'Custom' };

export const WEBHOOK_TYPE_DESCRIPTIONS = {
  github: 'Uses x-hub-signature-256 header with HMAC-SHA256 signature',
  gitlab: 'Uses x-gitlab-token header with secret token',
  custom: 'Uses X-Webhook-Token header with secret token',
};

export const GITLAB_SIGNING_DESCRIPTION =
  'GitLab signs every delivery. Elitea verifies the webhook-signature header and rejects deliveries more than 5 minutes old.';

// Where each sender takes the URL and the secret; the key is the type, or 'gitlab_signing'
export const WEBHOOK_SETUP_HINTS = {
  github:
    'In the repository: Settings → Webhooks → Add webhook. Paste the URL as Payload URL, choose application/json, and paste the secret as Secret.',
  gitlab:
    'In the project: Settings → Webhooks → Add new webhook. Paste the URL, and paste the secret as Secret token.',
  gitlab_signing:
    'In the project: Settings → Webhooks → Add new webhook. Paste the URL; GitLab signs each delivery with the signing token you saved.',
  custom:
    'Send a POST to the URL with the header X-Webhook-Token set to the secret. The raw body becomes the run input.',
};

export const GITLAB_AUTH_METHOD_OPTIONS = [
  { label: 'Secret token', value: GITLAB_AUTH_METHODS.secret_token },
  { label: 'Signing token', value: GITLAB_AUTH_METHODS.signing_token },
];

// Rendered as a single line under the radio group rather than per item: RadioButtonGroup lays
// descriptions out inline beside the label in a nowrap row, which a full sentence does not fit.
export const GITLAB_AUTH_METHOD_DESCRIPTIONS = {
  [GITLAB_AUTH_METHODS.secret_token]:
    'Elitea generates the token; you paste it into GitLab under "Secret token".',
  // Says only who issues the token: how verification works is the Webhook Type line directly above,
  // and where to find the token is the field's own helper text.
  [GITLAB_AUTH_METHODS.signing_token]: "GitLab generates the token; you paste GitLab's token here.",
};

export const GITLAB_SIGNING_TOKEN_PREFIX = 'whsec_';

// Floor for the decoded HMAC key, not GitLab's exact key size — which is unconfirmed. Set well below
// any plausible real key so a truncated paste is caught without risking rejection of a valid token.
export const GITLAB_SIGNING_KEY_MIN_BYTES = 16;

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

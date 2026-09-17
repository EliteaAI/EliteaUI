export const GITLAB_AUTH_METHODS = {
  secret_token: 'secret_token',
  signing_token: 'signing_token',
};

export const GITLAB_AUTH_METHOD_OPTIONS = [
  {
    label: 'Secret token',
    value: GITLAB_AUTH_METHODS.secret_token,
    description: 'Elitea generates the token; you paste it into GitLab under "Secret token".',
  },
  {
    label: 'Signing token',
    value: GITLAB_AUTH_METHODS.signing_token,
    description: 'GitLab generates the token and signs every delivery; you paste GitLab’s token here.',
  },
];

export const GITLAB_SIGNING_TOKEN_PREFIX = 'whsec_';

// The owner's consent to act with their Microsoft sign-in (C-1009, #7337): one wording for every holder.
export const OWNER_DELEGATED = 'owner_delegated';
const LIVE_MANDATE_STATES = ['draft', 'pending_approval', 'active', 'suspended'];

export const CONSENT_GIVEN_TEXT =
  'Acts with your Microsoft sign-in. Signing out does not end it; withdraw here.';
export const CONSENT_NEEDED_TEXT = 'Needs your consent to act with your Microsoft sign-in.';
export const TOKEN_CHECKBOX_LABEL = 'Let this token act with my Microsoft sign-in';
export const TOKEN_CHECKBOX_HINT =
  'Runs started with this token can then use the credentials you choose, acting with your Microsoft sign-in, also ' +
  'while you are signed out. Withdraw it in the token list.';
export const NO_DELEGATED_CREDENTIALS_TEXT =
  'No delegated credentials are set up in these projects yet; ask your project operator.';
export const CREDENTIALS_LABEL = 'Credentials it may use';

// The option key of a candidate credential (the same reference can be named in one project only)
export const credentialKey = item => `${item.project_id}:${item.credential_ref}`;

// What the consent call sends for the picked keys
export const pickedCredentials = (candidates, picked) =>
  (candidates || [])
    .filter(item => picked.includes(credentialKey(item)))
    .map(item => ({ project_id: item.project_id, credential_ref: item.credential_ref }));

// "Microsoft sign-in: a, b" for the credentials a consent covers
export const coveredText = credentials =>
  `Microsoft sign-in: ${(credentials || []).map(item => item.title).join(', ')}. Signing out does not end it; ` +
  'withdraw here.';
export const TOOLKIT_NOTE =
  'Schedules and API tokens that use this toolkit will ask for your consent to act with your Microsoft sign-in.';

// The owner's live mandate that acts with their sign-in for this agent version, or null
export const mandateForVersion = (rows, versionId) =>
  (rows || []).find(
    row =>
      row?.identity_source === OWNER_DELEGATED &&
      LIVE_MANDATE_STATES.includes(row?.state) &&
      versionId != null &&
      row?.version?.id === versionId,
  ) || null;

// Whether a token can hold a consent: restricted (projects, operations and an expiry) and not expired
export const tokenCanConsent = (token, now = Date.now()) =>
  Boolean(
    token?.expires &&
    Array.isArray(token?.scope_projects) &&
    token.scope_projects.length &&
    Array.isArray(token?.scope_operations) &&
    token.scope_operations.length &&
    new Date(token.expires).getTime() > now,
  );

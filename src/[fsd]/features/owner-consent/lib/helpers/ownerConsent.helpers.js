// The owner's consent to act with their Microsoft sign-in (C-1009, #7337): one wording for every holder.
export const OWNER_DELEGATED = 'owner_delegated';
const LIVE_MANDATE_STATES = ['draft', 'pending_approval', 'active', 'suspended'];

export const CONSENT_GIVEN_TEXT =
  'Acts with your Microsoft sign-in. Signing out does not end it; withdraw here.';
export const CONSENT_NEEDED_TEXT = 'Needs your consent to act with your Microsoft sign-in.';
export const TOKEN_CHECKBOX_LABEL = 'Let this token act with my Microsoft sign-in';
export const TOKEN_CHECKBOX_HINT =
  'Runs started with this token can then use credentials that act with your Microsoft sign-in, also while you are ' +
  'signed out. Withdraw it in the token list.';
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

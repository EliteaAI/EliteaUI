import {
  LIVE_MANDATE_STATES,
  OWNER_DELEGATED,
} from '@/[fsd]/features/owner-consent/lib/constants/ownerConsent.constants';

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

// The toast text of a consent action
export const consentActionText = ({ action }) =>
  action === 'consent' || action === undefined ? 'Consent given' : 'Consent withdrawn';

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

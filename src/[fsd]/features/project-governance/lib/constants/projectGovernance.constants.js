// The project operator view and the Save card (C-1009, #7269): the governed kinds, their labels and states, what a
// readiness item says in words, and the codes and patterns the server answers with.

export const KINDS = {
  binding: 'binding',
  reference: 'reference',
  grant: 'grant',
  mandate: 'mandate',
};

export const KIND_LABELS = {
  binding: 'Agent identity',
  reference: 'Credential',
  grant: 'Grant',
  mandate: 'Mandate',
};

export const STATE_LABELS = {
  draft: 'Draft',
  provisioning: 'Provisioning',
  pending: 'Pending',
  pending_approval: 'Pending approval',
  validated: 'Validated',
  active: 'Active',
  suspended: 'Suspended',
  retiring: 'Retiring',
  retired: 'Retired',
  revoked: 'Revoked',
  expired: 'Expired',
};

export const ESCALATED_TEXT = 'Needs a platform operator';
export const ESCALATED_HINT =
  'No admin of this project can approve it (there is none, or the only one asked for it): a platform operator approves it in the Admin UI.';

// The backend accepts exactly these letters, digits and . _ : / @ - (1 to 128 characters)
export const REFERENCE_PATTERN = /^[A-Za-z0-9._:/@-]{1,128}$/;
export const REFERENCE_HELP = 'Letters, digits and . _ : / @ - (at most 128 characters).';
// A change that raced another admin, or a view that is out of date: the list is read again
export const STALE_CODES = ['CONCURRENT_CHANGE', 'INVALID_STATE'];

// The states the inbox asks each list for (the server filters, so no waiting row is lost behind newer ones)
export const INBOX_STATES = {
  [KINDS.binding]: ['pending_approval'],
  [KINDS.reference]: ['pending', 'validated'],
  [KINDS.grant]: ['pending_approval'],
  [KINDS.mandate]: ['pending_approval'],
};

// --- the Save card: what an entity still needs to run governed, in words ----------------------------------------

// The states of an item that waits for someone else (an approval), not for the person
export const WAITING_STATES = ['pending', 'validated', 'pending_approval', 'provisioning', 'draft'];

export const ITEM_TEXT = {
  binding: {
    missing: 'Its identity is not set up yet',
    // (#7228) also a waiting identity for an older definition: it is requested again for the agent as it is
    changed: 'It changed since its identity was requested or approved',
    draft: 'Its identity is a draft',
    provisioning: 'Its identity is being set up',
    pending_approval: 'Its identity waits for approval',
    suspended: 'Its identity is suspended',
  },
  reference: {
    missing: 'Not registered for governed use (your own copy is requested)',
    needs_value: 'Your value is still to be written',
    pending: 'Waits for a check and an approval',
    validated: 'Waits for approval',
    suspended: 'Suspended',
    changed: 'Changed since it was approved',
    not_registrable: 'A value typed into the toolkit: store it as a credential first',
    other_project: 'A credential of another project',
    personal_to_another: 'Another member’s personal credential',
    needs_owner_sign_in: 'Acts with a Microsoft sign-in the schedule does not name',
  },
  grant: {
    missing: 'Not granted yet',
    pending_approval: 'Waits for approval',
    suspended: 'Suspended',
    expired: 'Outside its validity',
    needs_an_agent_grant: 'Needs a grant to you on an agent that uses it (a project admin grants it)',
  },
  mandate: {
    missing: 'The schedule has no mandate yet',
    held_by_another: "Another member's schedule holds this agent version's mandate",
    draft: 'The mandate is a draft',
    pending_approval: 'The mandate waits for approval',
    suspended: 'The mandate is suspended',
  },
  consent: { missing: 'Give your consent on the schedule card' },
  identity: { unlinked: 'Your account has no linked sign-in: nothing can be granted to you' },
  permission: { not_permitted: 'You may not use credentials in this project' },
};

// How deep a credential type's schema is walked for its secret fields (as the server walks it)
export const MAX_SCHEMA_DEPTH = 4;

// --- the chat's credential form (#7228) --------------------------------------------------------------------------

// Credential types whose material is the person's own Microsoft sign-in (the server's DELEGATED_TYPES): never typed,
// never shared
export const SIGN_IN_CREDENTIAL_TYPES = ['sharepoint'];

// (#7228) the fields the credential card shows at first for a known type: its simplest way to sign in. Every other
// optional field is folded behind "More fields". A type not listed shows its required fields and its first secret one.
export const PRIMARY_CREDENTIAL_FIELDS = {
  github: ['access_token'],
  jira: ['username', 'api_key'],
  confluence: ['username', 'api_key'],
};
// The check's code when the person's Elitea sign-in carries no Microsoft identity
export const SIGN_IN_NOT_MICROSOFT = 'DENIED_ASSERTION_SOURCE_UNSUPPORTED';
export const SIGN_IN_NOT_MICROSOFT_TEXT =
  'Your Elitea sign-in is not a Microsoft sign-in, so this credential cannot act for you yet: sign in to Elitea with Microsoft, then ask the agent again.';

import { PERMISSIONS } from '@/common/constants';

// The project operator view (C-1009, #7269): the four governed kinds, their columns, the actions the Admin UI offers
// on each (the server decides again, in the project) and the project inbox (everything waiting for an approval).

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

export const stateLabel = state => STATE_LABELS[state] ?? state ?? '-';
export const isValidReference = value => REFERENCE_PATTERN.test(value || '');
export const personName = user => user?.email ?? (user?.id != null ? `User ${user.id}` : '-');

// The server answers { error, code }; a network failure has only `error`
export const toGovernanceError = (err, fallback = 'The request failed.') => ({
  message: err?.data?.error ?? err?.data?.message ?? err?.error ?? fallback,
  code: err?.data?.code ?? null,
});

const versionTitle = row =>
  [row.application?.name, row.version?.name].filter(Boolean).join(' ') || row.toolkit?.name || 'Agent';

export const rowTitle = (kind, row) => {
  switch (kind) {
    case KINDS.binding:
      return versionTitle(row);
    case KINDS.reference:
      return row.configuration?.title ?? row.provider ?? 'Credential';
    case KINDS.grant: {
      const credential = row.credential?.configuration_title ?? row.credential?.provider ?? 'Credential';
      return `${credential} for ${personName(row.subject?.user) || row.subject?.ref}`;
    }
    case KINDS.mandate:
      return row.toolkit ? `${row.toolkit.name} (index schedules)` : versionTitle(row);
    default:
      return '-';
  }
};

// What a row of a list shows in its columns (besides its title and state)
export const rowDetails = (kind, row) => {
  switch (kind) {
    case KINDS.binding:
      return [
        row.identity_mode,
        row.digest_status === 'changed' ? 'Agent changed since approval' : null,
        `by ${personName(row.created_by)}`,
      ];
    case KINDS.reference:
      return [
        row.ownership_class === 'personal' ? `Personal, ${personName(row.owner)}` : 'Shared',
        row.auth_mode === 'entra_delegated' ? 'Microsoft sign-in' : null,
        `by ${personName(row.created_by)}`,
      ];
    case KINDS.grant:
      return [
        [row.binding?.application_name, row.binding?.version_name].filter(Boolean).join(' '),
        row.toolkit?.name,
        `by ${personName(row.created_by)}`,
      ];
    case KINDS.mandate:
      return [
        `owner ${personName(row.owner)}`,
        (row.operations || []).join(', '),
        `by ${personName(row.created_by)}`,
      ];
    default:
      return [];
  }
};

const isMe = (user, userId) => userId != null && user?.id === userId;

const action = (name, label, permission, extra = {}) => ({ action: name, label, permission, ...extra });

const G = PERMISSIONS.governance;

// The actions of a row (by state), each with the permission it needs and, for an approval, the four-eyes reason it is
// not this admin's to take. Mirrors the Admin UI tabs.
export const rowActions = (kind, row, userId) => {
  const state = row.state;
  if (kind === KINDS.binding) {
    const own = isMe(row.created_by, userId) || isMe(row.state_changed_by, userId);
    return [
      state === 'draft' && action('submit', 'Submit for approval', G.bindingsManage),
      state === 'pending_approval' &&
        action('activate', 'Approve', G.bindingsApprove, {
          approval: true,
          disabledReason: own ? 'You created or last changed it: another admin approves it.' : null,
        }),
      state === 'active' && action('suspend', 'Suspend', G.bindingsManage),
      state === 'suspended' && action('resume', 'Resume', G.bindingsManage),
      ['active', 'suspended'].includes(state) &&
        action('rebind', 'Approve again for the agent as it is', G.bindingsManage),
      !['retired', 'retiring'].includes(state) &&
        action('retire', 'Retire', G.bindingsManage, { reject: true }),
    ].filter(Boolean);
  }
  if (kind === KINDS.reference) {
    const waiting = ['pending', 'validated'].includes(state);
    const approved = Boolean(row.approved_by);
    const own = isMe(row.created_by, userId) || isMe(row.written_by, userId);
    const importable = row.ownership_class !== 'personal' && row.auth_mode !== 'entra_delegated';
    return [
      waiting && importable && action('import', 'Import the value', G.credentialsManage),
      waiting && action('probe', 'Check', G.credentialsProbe),
      state === 'validated' &&
        !approved &&
        action('approve', 'Approve', G.credentialsApprove, {
          approval: true,
          disabledReason: own ? 'You created it or wrote its value: another admin approves it.' : null,
        }),
      state === 'validated' && approved && action('activate', 'Activate', G.credentialsManage),
      state === 'active' && action('suspend', 'Suspend', G.credentialsManage),
      state === 'suspended' && action('resume', 'Resume', G.credentialsManage),
      ['pending', 'validated', 'active', 'suspended'].includes(state) &&
        action('retire', 'Retire', G.credentialsManage, { reject: true }),
    ].filter(Boolean);
  }
  if (kind === KINDS.grant) {
    const own = isMe(row.created_by, userId);
    return [
      state === 'pending_approval' &&
        action('approve', 'Approve', G.credentialsApprove, {
          approval: true,
          disabledReason: own ? 'You asked for it: another admin approves it.' : null,
        }),
      state === 'active' && action('suspend', 'Suspend', G.credentialsManage),
      state === 'suspended' && action('resume', 'Resume', G.credentialsManage),
      ['pending_approval', 'active', 'suspended'].includes(state) &&
        action('revoke', 'Revoke', G.credentialsManage, { reject: true }),
    ].filter(Boolean);
  }
  if (kind === KINDS.mandate) {
    const ownerOrCreator = isMe(row.created_by, userId) || isMe(row.owner, userId);
    return [
      state === 'draft' && action('submit', 'Submit for approval', G.mandatesManage),
      state === 'pending_approval' &&
        action('approve', 'Approve', G.mandatesApprove, {
          approval: true,
          disabledReason: ownerOrCreator ? 'You created it or own it: another admin approves it.' : null,
        }),
      state === 'pending_approval' && action('reject', 'Send back', G.mandatesManage, { reject: true }),
      state === 'active' && action('suspend', 'Suspend', G.mandatesManage),
      state === 'suspended' &&
        action('resume', 'Resume', G.mandatesApprove, {
          disabledReason: isMe(row.owner, userId) ? 'You own it: another admin resumes it.' : null,
        }),
      ['draft', 'active', 'suspended'].includes(state) &&
        action('revoke', 'Revoke', G.mandatesManage, { reject: true }),
    ].filter(Boolean);
  }
  return [];
};

// The body of an action; a binding action carries the state the admin saw
export const actionBody = (kind, row, name, approval) => ({
  action: name,
  ...(kind === KINDS.binding && { expected_state: row.state }),
  ...(approval || {}),
});

// Waiting for an approval (or, for a credential, for the check and approval that come before it)
export const isWaiting = (kind, row) => {
  if (kind === KINDS.reference)
    return row.state === 'pending' || (row.state === 'validated' && !row.approved_by);
  return row.state === 'pending_approval';
};

// The project inbox: every waiting row of the four kinds, oldest first
export const inboxItems = lists =>
  Object.entries(lists)
    .flatMap(([kind, rows]) => (rows || []).filter(row => isWaiting(kind, row)).map(row => ({ kind, row })))
    .sort((a, b) =>
      String(a.row.created_at ?? a.row.updated_at ?? '').localeCompare(
        String(b.row.created_at ?? b.row.updated_at ?? ''),
      ),
    );

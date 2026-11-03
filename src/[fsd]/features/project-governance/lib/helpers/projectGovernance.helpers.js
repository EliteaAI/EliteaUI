import {
  ESCALATED_TEXT,
  ITEM_TEXT,
  KINDS,
  MAX_SCHEMA_DEPTH,
  REFERENCE_PATTERN,
  STATE_LABELS,
  WAITING_STATES,
} from '@/[fsd]/features/project-governance/lib/constants/projectGovernance.constants';
import { PERMISSIONS } from '@/common/constants';

// The project operator view (C-1009, #7269): the four governed kinds, their columns, the actions the Admin UI offers
// on each (the server decides again, in the project) and the project inbox (everything waiting for an approval).

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

// "Also grant to" applies to a shared credential's grant for a person: a personal credential and a mandate's grant
// have no siblings (the server answers NO_SIBLINGS)
export const takesSiblings = approving =>
  approving?.kind === KINDS.grant &&
  approving.row.credential?.ownership_class !== 'personal' &&
  !String(approving.row.subject?.ref ?? '').startsWith('mandate:');

// How many rows of these pages the server has but did not send (a page holds at most its limit)
export const hiddenCount = pages =>
  pages.reduce((sum, page) => sum + Math.max(0, (page?.total ?? 0) - (page?.rows?.length ?? 0)), 0);

// The project inbox: every waiting row of the four kinds, oldest first
export const inboxItems = lists =>
  Object.entries(lists)
    .flatMap(([kind, rows]) => (rows || []).filter(row => isWaiting(kind, row)).map(row => ({ kind, row })))
    .sort((a, b) =>
      String(a.row.created_at ?? a.row.updated_at ?? '').localeCompare(
        String(b.row.created_at ?? b.row.updated_at ?? ''),
      ),
    );

// --- the Save card (#7269 phase 2): what an entity still needs to run governed, in words -------------------------

export const readinessText = item =>
  ITEM_TEXT[item.kind]?.[item.state] ?? (item.kind === 'blocking' ? 'Stops a scheduled run' : item.state);

// A personal reference of the person's own whose value is still to be written: the card writes it inline
export const isValueItem = item =>
  item?.kind === 'reference' && item.state === 'needs_value' && item.for === 'me' && Boolean(item.ref);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPasswordSchema = schema =>
  schema.format === 'password' ||
  (Array.isArray(schema.anyOf) &&
    schema.anyOf.some(option => isObject(option) && option.format === 'password'));

// The secret fields of a credential type, from its schema (`/configurations/available/`): `[{ path, label }]`, nested
// objects joined with `.` as the server checks them; maps of secrets are left out (their keys are not known here)
export const secretFieldsOf = (types, provider, depth = 0, properties = undefined, prefix = '') => {
  const props =
    properties ??
    (Array.isArray(types) ? types : []).find(entry => entry?.type === provider)?.config_schema?.properties
      ?.data?.properties;
  return Object.entries(isObject(props) ? props : {}).flatMap(([name, schema]) => {
    if (!isObject(schema)) return [];
    const path = `${prefix}${name}`;
    if (isPasswordSchema(schema)) return [{ path, label: schema.title ?? path }];
    if (isObject(schema.properties) && depth < MAX_SCHEMA_DEPTH)
      return secretFieldsOf(types, provider, depth + 1, schema.properties, `${path}.`);
    return [];
  });
};

export const isWaitingItem = item => WAITING_STATES.includes(item.state) && Boolean(item.ref);

// What the row's chip says: who has to act now
export const readinessStatus = item => {
  if (isWaitingItem(item)) return item.escalated ? ESCALATED_TEXT : 'Pending approval';
  if (item.requestable) return 'To request';
  return 'Needed';
};

// (#7269 item 13) what a governed run created through the internal MCP and requested for you: the tool output carries
// `governance_requests: { entity_kind, entity_id, filed, items }`; null when it does not
export const governanceRequestOf = output => {
  let value = output;
  if (typeof value === 'string') {
    if (!value.includes('governance_requests')) return null;
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const found = value && typeof value === 'object' ? value.governance_requests : null;
  return found && found.entity_kind && Number.isInteger(found.entity_id)
    ? { entityKind: found.entity_kind, entityId: found.entity_id }
    : null;
};

export const requestableKeys = items => (items || []).filter(item => item.requestable).map(item => item.key);

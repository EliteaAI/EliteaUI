import {
  ESCALATED_TEXT,
  ITEM_TEXT,
  KINDS,
  MAX_SCHEMA_DEPTH,
  PRIMARY_CREDENTIAL_FIELDS,
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
// (#7228) what an agent identity lets the agent do on the platform through the internal Elitea tools
export const operationsLabel = operations =>
  Array.isArray(operations) && operations.length ? `Operations: ${operations.join(', ')}` : 'Read only';

// (#7228) an agent identity's approval keeps the proposed operations, or part of them (never more)
export const takesOperations = approving =>
  approving?.kind === KINDS.binding &&
  approving?.item?.action === 'activate' &&
  Array.isArray(approving?.row?.platform_operations) &&
  approving.row.platform_operations.length > 0;

export const rowDetails = (kind, row) => {
  switch (kind) {
    case KINDS.binding:
      return [
        row.identity_mode,
        operationsLabel(row.platform_operations),
        row.digest_status === 'changed'
          ? row.state === 'pending_approval'
            ? 'Agent changed since it was requested: bring it up to date before approving'
            : 'Agent changed since approval'
          : null,
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
    // (#7228) a waiting identity for an older definition would be refused: it is brought up to date first
    const stale = state === 'pending_approval' && row.digest_status === 'changed';
    return [
      state === 'draft' && action('submit', 'Submit for approval', G.bindingsManage),
      stale && action('rebind', 'Bring up to date with the agent as it is', G.bindingsManage),
      state === 'pending_approval' &&
        action('activate', 'Approve', G.bindingsApprove, {
          approval: true,
          disabledReason: stale
            ? 'The agent changed since it was requested: bring it up to date first.'
            : own
              ? 'You created or last changed it: another admin approves it.'
              : null,
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

export const readinessText = item => {
  const text =
    ITEM_TEXT[item.kind]?.[item.state] ?? (item.kind === 'blocking' ? 'Stops a scheduled run' : item.state);
  // (#7228) an identity names what its agent may do: "Its identity (read, build, credentials, run) waits for approval"
  return item.kind === 'binding' && Array.isArray(item.operations) && item.operations.length
    ? text.replace(/^Its identity/, `Its identity (${item.operations.join(', ')})`)
    : text;
};

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

// (#7228) the fields the chat's credential form shows for a credential type: its top-level text fields (a secret
// one masked), required as the type's schema says, with the schema's default (or prefill), the first line of its
// description and its choices (an enum, offered as a select); null when the type is unknown to the schema store. A
// stored sign-in (`refresh_token`) and nested or selected configurations are never typed into the form.
const NOT_TYPED = ['refresh_token'];
const plainLine = text =>
  String(text || '')
    .split('\n')
    .map(line => line.replace(/[*`_#>]/g, '').trim())
    .find(Boolean) || '';
const optionsOf = schema => {
  const found = Array.isArray(schema.enum)
    ? schema.enum
    : (schema.anyOf || []).find(option => Array.isArray(option?.enum))?.enum;
  return Array.isArray(found) ? found.filter(item => typeof item === 'string') : null;
};
export const credentialFormFieldsOf = (types, type) => {
  const entry = (Array.isArray(types) ? types : []).find(candidate => candidate?.type === type);
  const data = entry?.config_schema?.properties?.data;
  if (!isObject(data?.properties)) return null;
  const required = Array.isArray(data.required) ? data.required : [];
  const fields = Object.entries(data.properties).flatMap(([name, schema]) => {
    if (!isObject(schema) || NOT_TYPED.includes(name) || schema.$ref) return [];
    const secret = isPasswordSchema(schema);
    const options = secret ? null : optionsOf(schema);
    const text =
      secret ||
      Boolean(options) ||
      schema.type === 'string' ||
      (Array.isArray(schema.anyOf) && schema.anyOf.some(option => option?.type === 'string' && !option.$ref));
    if (!text) return [];
    const preset = [schema.default, schema.prefill_value].find(value => typeof value === 'string' && value);
    return [
      {
        name,
        label: schema.title ?? name,
        secret,
        required: required.includes(name),
        defaultValue: secret ? '' : (preset ?? ''),
        description: plainLine(schema.description),
        options,
      },
    ];
  });
  // (#7228) shown at first: the required fields and the type's primary sign-in field(s); the rest is folded
  const listed = (PRIMARY_CREDENTIAL_FIELDS[type] ?? []).filter(name =>
    fields.some(field => field.name === name),
  );
  const primary = listed.length
    ? listed
    : fields
        .filter(field => field.secret)
        .slice(0, 1)
        .map(field => field.name);
  return fields.map(field => ({ ...field, primary: field.required || primary.includes(field.name) }));
};

// (#7228) what the card says after Create, from the credential's state and its check: who acts next, in words
export const credentialFormResultText = result => {
  const name = `Credential '${result?.title ?? ''}' (${result?.credential_type ?? ''}) is registered`;
  switch (result?.state) {
    case 'active':
      return `${name} and approved: the agent can use it.`;
    case 'validated':
      return `${name} and checked: it waits for a project admin's approval before the agent can use it.`;
    default:
      return `${name}: it waits for a check and a project admin's approval before the agent can use it.`;
  }
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
  const entityOf = part =>
    part && part.entity_kind && Number.isInteger(part.entity_id)
      ? {
          entityKind: part.entity_kind,
          entityId: part.entity_id,
          // (#7228) an automatic request that could not be filed reads as a sentence, never as its JSON
          refused: typeof part.refused === 'string' ? part.refused : null,
        }
      : null;
  const main = entityOf(found);
  if (!main) return null;
  // (#7228) a changed toolkit also files for every agent version using it: one card per changed entity, once each
  const seen = new Set();
  const entities = [main, ...(Array.isArray(found.versions) ? found.versions.map(entityOf) : [])].filter(
    entity => {
      const key = entity && `${entity.entityKind}:${entity.entityId}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    },
  );
  return { ...main, entities };
};

// (#7228) an automatic request of a governed run that could not be filed, in words (no code, no JSON): the card below
// it then offers Request for what is still missing
const AUTO_REQUEST_REASONS = {
  STALE_READINESS: 'what it needs changed meanwhile',
  DEPENDENCY_UNAVAILABLE: 'the service could not be reached',
  AUDIT_UNAVAILABLE: 'the service could not be reached',
  FORBIDDEN: 'you may not request it here',
};
export const autoRequestRefusedText = code =>
  `The approval requests for it could not be filed automatically (${
    AUTO_REQUEST_REASONS[code] ?? 'they were refused'
  }); request what is missing on the card.`;

export const requestableKeys = items => (items || []).filter(item => item.requestable).map(item => item.key);

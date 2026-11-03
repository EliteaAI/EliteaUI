import { describe, expect, it } from 'vitest';

import * as C from '../../constants/projectGovernance.constants';
import * as H from '../projectGovernance.helpers';

const ME = 7;

describe('project governance helpers (EL-7269)', () => {
  it('offers approval by state and keeps the four-eyes rule of each kind', () => {
    const binding = {
      id: 'b',
      state: 'pending_approval',
      created_by: { id: ME },
      state_changed_by: { id: ME },
    };
    const [approve] = H.rowActions(C.KINDS.binding, binding, ME).filter(item => item.approval);
    expect(approve.action).toBe('activate');
    expect(approve.disabledReason).toMatch(/another admin/);
    expect(H.rowActions(C.KINDS.binding, binding, 8).find(item => item.approval).disabledReason).toBeNull();

    const reference = {
      id: 'r',
      state: 'validated',
      approved_by: null,
      created_by: { id: 1 },
      written_by: { id: ME },
    };
    expect(
      H.rowActions(C.KINDS.reference, reference, ME).find(item => item.approval).disabledReason,
    ).toBeTruthy();
    expect(
      H.rowActions(C.KINDS.reference, { ...reference, approved_by: { id: 2 } }, ME).map(i => i.action),
    ).toContain('activate');

    const grant = { id: 'g', state: 'pending_approval', created_by: { id: ME } };
    expect(H.rowActions(C.KINDS.grant, grant, ME).find(item => item.approval).disabledReason).toBeTruthy();

    const mandate = { id: 'm', state: 'pending_approval', created_by: { id: 1 }, owner: { id: ME } };
    const actions = H.rowActions(C.KINDS.mandate, mandate, ME);
    expect(actions.find(item => item.approval).disabledReason).toBeTruthy();
    expect(actions.map(item => item.action)).toEqual(['approve', 'reject']);
  });

  it('names the permission each action needs', () => {
    const actions = H.rowActions(C.KINDS.grant, { id: 'g', state: 'active' }, ME);
    expect(actions.map(item => [item.action, item.permission])).toEqual([
      ['suspend', 'credentials.manage'],
      ['revoke', 'credentials.manage'],
    ]);
  });

  it('carries the state the admin saw on a binding action only', () => {
    expect(H.actionBody(C.KINDS.binding, { state: 'draft' }, 'submit')).toEqual({
      action: 'submit',
      expected_state: 'draft',
    });
    expect(
      H.actionBody(C.KINDS.grant, { state: 'x' }, 'approve', { approval_ref: 'A', policy_revision: 'B' }),
    ).toEqual({ action: 'approve', approval_ref: 'A', policy_revision: 'B' });
  });

  it('builds the inbox from every waiting row, oldest first', () => {
    const items = H.inboxItems({
      binding: [
        { id: 'b1', state: 'pending_approval', created_at: '2026-11-03T10:00:00' },
        { id: 'b2', state: 'active', created_at: '2026-11-01T10:00:00' },
      ],
      reference: [
        { id: 'r1', state: 'pending', created_at: '2026-11-02T10:00:00' },
        { id: 'r2', state: 'validated', approved_by: { id: 3 }, created_at: '2026-11-01T09:00:00' },
      ],
      grant: [{ id: 'g1', state: 'pending_approval', created_at: '2026-11-01T08:00:00' }],
      mandate: [{ id: 'm1', state: 'pending_approval', updated_at: '2026-11-04T08:00:00' }],
    });
    expect(items.map(item => item.row.id)).toEqual(['g1', 'r1', 'b1', 'm1']);
  });

  it('accepts the approval alphabet of the server only', () => {
    expect(H.isValidReference('CHG-7269/a:b@c.d_e')).toBe(true);
    expect(H.isValidReference('has space')).toBe(false);
    expect(H.isValidReference('')).toBe(false);
  });
});

describe('what a run created (EL-7269)', () => {
  it('reads the request a governed run filed from its tool output', () => {
    const output = JSON.stringify({
      result: {},
      governance_requests: { entity_kind: 'version', entity_id: 7, filed: [] },
    });
    expect(H.governanceRequestOf(output)).toMatchObject({
      entityKind: 'version',
      entityId: 7,
      refused: null,
    });
    expect(
      H.governanceRequestOf({ governance_requests: { entity_kind: 'toolkit', entity_id: 3 } }),
    ).toMatchObject({
      entityKind: 'toolkit',
      entityId: 3,
      refused: null,
    });
    expect(H.governanceRequestOf('plain text')).toBeNull();
    expect(H.governanceRequestOf('{"governance_requests": {"filed": []}}')).toBeNull();
  });

  it('says what an item needs and who acts', () => {
    expect(H.readinessStatus({ state: 'missing', requestable: true })).toBe('To request');
    expect(H.readinessStatus({ state: 'pending_approval', ref: 'x', escalated: false })).toBe(
      'Pending approval',
    );
    expect(H.readinessStatus({ state: 'missing', requestable: false })).toBe('Needed');
    expect(H.readinessText({ kind: 'consent', state: 'missing' })).toMatch(/consent/);
  });
});

describe('project governance constants (EL-7269)', () => {
  it('holds the shared constants; the helpers file keeps functions only', () => {
    expect(C.KINDS).toEqual({
      binding: 'binding',
      reference: 'reference',
      grant: 'grant',
      mandate: 'mandate',
    });
    expect(C.STALE_CODES).toEqual(['CONCURRENT_CHANGE', 'INVALID_STATE', 'BINDING_DIGEST_MISMATCH']);
    expect(C.INBOX_STATES.reference).toEqual(['pending', 'validated']);
    expect(Object.values(H).every(value => typeof value === 'function')).toBe(true);
  });

  // --- EL-7228 -----------------------------------------------------------------------------------------------------

  it("EL-7228 lists a credential type's text fields for the chat form, secret ones marked, a stored sign-in never", () => {
    const types = [
      {
        type: 'github',
        config_schema: {
          properties: {
            data: {
              properties: {
                base_url: {
                  type: 'string',
                  title: 'Base URL',
                  prefill_value: 'https://api.github.com',
                  description: '**Base** API URL\n\nmore',
                },
                hosting: {
                  anyOf: [{ enum: ['Auto', 'Cloud'], type: 'string' }, { type: 'null' }],
                  default: 'Auto',
                  description: 'Select the hosting type.',
                },
                access_token: {
                  anyOf: [{ type: 'string', format: 'password' }, { type: 'null' }],
                  title: 'Token',
                },
                refresh_token: { type: 'string', format: 'password' },
                options: { type: 'object' },
                llm: { $ref: '#/x' },
              },
              required: ['access_token'],
            },
          },
        },
      },
    ];
    expect(H.credentialFormFieldsOf(types, 'github')).toEqual([
      {
        name: 'base_url',
        label: 'Base URL',
        secret: false,
        required: false,
        defaultValue: 'https://api.github.com',
        description: 'Base API URL',
        options: null,
        primary: false,
      },
      {
        name: 'hosting',
        label: 'hosting',
        secret: false,
        required: false,
        defaultValue: 'Auto',
        description: 'Select the hosting type.',
        options: ['Auto', 'Cloud'],
        primary: false,
      },
      {
        name: 'access_token',
        label: 'Token',
        secret: true,
        required: true,
        defaultValue: '',
        description: '',
        options: null,
        primary: true,
      },
    ]);
    expect(H.credentialFormResultText({ title: 'G', credential_type: 'github', state: 'active' })).toBe(
      "Credential 'G' (github) is registered and approved: the agent can use it.",
    );
    expect(H.credentialFormFieldsOf(types, 'unknown')).toBeNull();
    expect(H.credentialFormFieldsOf(undefined, 'github')).toBeNull();
  });

  it('EL-7228 reads a refused automatic request as a sentence, never as its code or JSON', () => {
    const found = H.governanceRequestOf({
      governance_requests: { entity_kind: 'version', entity_id: 7, filed: [], refused: 'STALE_READINESS' },
    });
    expect(found).toMatchObject({ entityKind: 'version', entityId: 7, refused: 'STALE_READINESS' });
    expect(found.entities).toEqual([{ entityKind: 'version', entityId: 7, refused: 'STALE_READINESS' }]);
    const text = H.autoRequestRefusedText(found.refused);
    expect(text).toBe(
      'The approval requests for it could not be filed automatically (what it needs changed meanwhile); request what is missing on the card.',
    );
    expect(text).not.toContain('STALE_READINESS');
    expect(H.autoRequestRefusedText('SOMETHING_NEW')).toContain('(they were refused)');
  });

  it('EL-7228 lists a changed toolkit and every version using it once each, skipping malformed rows', () => {
    const found = H.governanceRequestOf({
      governance_requests: {
        entity_kind: 'toolkit',
        entity_id: 3,
        versions: [
          { entity_kind: 'version', entity_id: 41 },
          { entity_kind: 'version', entity_id: '42' },
          { entity_kind: 'version', entity_id: 41, refused: 'FORBIDDEN' },
          { entity_kind: 'version', entity_id: 43, refused: 'FORBIDDEN' },
        ],
      },
    });
    expect(found.entities).toEqual([
      { entityKind: 'toolkit', entityId: 3, refused: null },
      { entityKind: 'version', entityId: 41, refused: null },
      { entityKind: 'version', entityId: 43, refused: 'FORBIDDEN' },
    ]);
  });

  it('EL-7228 marks the fields the credential card shows first: required ones and the primary sign-in field', () => {
    const schema = properties => [
      { type: 'github', config_schema: { properties: { data: { properties, required: ['base_url'] } } } },
    ];
    const github = H.credentialFormFieldsOf(
      schema({
        base_url: { type: 'string' },
        app_id: { type: 'string' },
        app_private_key: { type: 'string', format: 'password' },
        access_token: { type: 'string', format: 'password' },
        username: { type: 'string' },
        password: { type: 'string', format: 'password' },
      }),
      'github',
    );
    expect(github.filter(field => field.primary).map(field => field.name)).toEqual([
      'base_url',
      'access_token',
    ]);
    // a type not listed: its required fields and its first secret field (the generic rule)
    const other = H.credentialFormFieldsOf(
      [
        {
          type: 'acme',
          config_schema: {
            properties: {
              data: {
                properties: {
                  url: { type: 'string' },
                  note: { type: 'string' },
                  key: { type: 'string', format: 'password' },
                  spare: { type: 'string', format: 'password' },
                },
                required: ['url'],
              },
            },
          },
        },
      ],
      'acme',
    );
    expect(other.filter(field => field.primary).map(field => field.name)).toEqual(['url', 'key']);
  });

  it('EL-7228 an approval of an identity names the definition the admin reviewed; a changed one is a stale view', () => {
    const row = { state: 'pending_approval', definition_digest_full: 'adv1:' + 'a'.repeat(64) };
    expect(
      H.actionBody(C.KINDS.binding, row, 'activate', { approval_ref: 'A', policy_revision: 'B' }),
    ).toEqual({
      action: 'activate',
      expected_state: 'pending_approval',
      definition_digest: 'adv1:' + 'a'.repeat(64),
      approval_ref: 'A',
      policy_revision: 'B',
    });
    expect(H.actionBody(C.KINDS.binding, row, 'retire')).toEqual({
      action: 'retire',
      expected_state: 'pending_approval',
    });
    expect(C.STALE_CODES).toContain('BINDING_DIGEST_MISMATCH');
    expect(H.versionsMoreText(1)).toBe('1 more agent uses this toolkit: open it to request what it needs.');
  });

  it('EL-7228 never shows a waiting identity for an edited agent as merely waiting: it is brought up to date first', () => {
    const stale = { id: 'b', state: 'pending_approval', digest_status: 'changed', created_by: { id: 3 } };
    const actions = H.rowActions(C.KINDS.binding, stale, 8);
    expect(actions.map(item => item.action)).toEqual(['rebind', 'activate', 'retire']);
    expect(actions.find(item => item.approval).disabledReason).toBe(
      'The agent changed since it was requested: bring it up to date first.',
    );
    expect(H.rowDetails(C.KINDS.binding, stale)).toContain(
      'Agent changed since it was requested: bring it up to date before approving',
    );
    const current = { ...stale, digest_status: 'match' };
    expect(H.rowActions(C.KINDS.binding, current, 8).map(item => item.action)).toEqual([
      'activate',
      'retire',
    ]);
    expect(H.rowDetails(C.KINDS.binding, { ...stale, state: 'active' })).toContain(
      'Agent changed since approval',
    );
    expect(C.ITEM_TEXT.binding.changed).toBe('It changed since its identity was requested or approved');
  });

  it('EL-7228 names the operations of an identity, and offers them to trim on its approval only', () => {
    expect(H.operationsLabel(['read', 'build'])).toBe('Operations: read, build');
    expect(H.operationsLabel(null)).toBe('Read only');
    const row = { platform_operations: ['read', 'build'] };
    expect(H.takesOperations({ kind: 'binding', row, item: { action: 'activate' } })).toBe(true);
    expect(H.takesOperations({ kind: 'binding', row, item: { action: 'suspend' } })).toBe(false);
    expect(H.takesOperations({ kind: 'binding', row: {}, item: { action: 'activate' } })).toBe(false);
    expect(
      H.readinessText({
        kind: 'binding',
        state: 'pending_approval',
        operations: ['read', 'build', 'credentials', 'run'],
      }),
    ).toBe('Its identity (read, build, credentials, run) waits for approval');
    expect(H.readinessText({ kind: 'binding', state: 'pending_approval' })).toBe(
      'Its identity waits for approval',
    );
  });
});

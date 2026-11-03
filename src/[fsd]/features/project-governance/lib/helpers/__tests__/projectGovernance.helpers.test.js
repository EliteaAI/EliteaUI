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
    expect(H.governanceRequestOf(output)).toEqual({ entityKind: 'version', entityId: 7 });
    expect(H.governanceRequestOf({ governance_requests: { entity_kind: 'toolkit', entity_id: 3 } })).toEqual({
      entityKind: 'toolkit',
      entityId: 3,
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
    expect(C.STALE_CODES).toEqual(['CONCURRENT_CHANGE', 'INVALID_STATE']);
    expect(C.INBOX_STATES.reference).toEqual(['pending', 'validated']);
    expect(Object.values(H).every(value => typeof value === 'function')).toBe(true);
  });
});

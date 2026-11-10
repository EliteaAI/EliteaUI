import { describe, expect, it } from 'vitest';

import { RUN_AS_ADMIN_HINT, runAsAdminHint, runDeniedHint } from '../scheduleList.helpers';

// A viewer who manages a schedule but has no run right is told why Run now is off

const ADMIN_ACTIONS = ['edit', 'pause', 'delete', 'change_owner'];

describe('runDeniedHint', () => {
  it('names the owner for an admin viewing a schedule with a version', () => {
    expect(runDeniedHint({ version_id: 4, owner: { name: 'Ann Lee' }, allowed_actions: ADMIN_ACTIONS })).toBe(
      'You do not have the right to run this schedule. The owner is Ann Lee.',
    );
  });

  it('says it without a name when the owner has none', () => {
    expect(runDeniedHint({ version_id: 4, owner: { id: 1 }, allowed_actions: ADMIN_ACTIONS })).toBe(
      'You do not have the right to run this schedule.',
    );
  });

  it.each([
    ['the owner, who can run it', { version_id: 4, allowed_actions: ['run', 'edit', 'change_owner'] }],
    ['the owner of a schedule without a version', { version_id: null, allowed_actions: ADMIN_ACTIONS }],
    ['a row with no admin action', { version_id: 4, allowed_actions: ['edit'] }],
    ['a row without actions', { version_id: 4 }],
    ['no row', undefined],
  ])('is null for %s', (_label, schedule) => {
    expect(runDeniedHint(schedule)).toBeNull();
  });
});

describe('runAsAdminHint', () => {
  const schedule = { allowed_actions: ['run', 'edit'], owner: { id: 9 } };

  it('gives the text to an admin who may run a schedule of another owner', () => {
    expect(runAsAdminHint(schedule, { isAdmin: true, userId: 5 })).toBe(RUN_AS_ADMIN_HINT);
  });

  it.each([
    ['not an admin', schedule, { isAdmin: false, userId: 5 }],
    ['the owner', schedule, { isAdmin: true, userId: 9 }],
    ['no run right', { ...schedule, allowed_actions: ['edit'] }, { isAdmin: true, userId: 5 }],
    ['a webhook', { ...schedule, trigger_kind: 'webhook' }, { isAdmin: true, userId: 5 }],
    ['an unknown owner', { ...schedule, owner: undefined }, { isAdmin: true, userId: 5 }],
    ['no schedule', undefined, { isAdmin: true, userId: 5 }],
  ])('is null for %s', (_label, row, viewer) => {
    expect(runAsAdminHint(row, viewer)).toBeNull();
  });
});

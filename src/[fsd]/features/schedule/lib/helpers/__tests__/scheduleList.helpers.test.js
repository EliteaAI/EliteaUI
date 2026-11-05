import { describe, expect, it } from 'vitest';

import { runDeniedHint } from '../scheduleList.helpers';

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

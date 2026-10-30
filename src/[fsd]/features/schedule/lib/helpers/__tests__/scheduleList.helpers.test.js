import { describe, expect, it } from 'vitest';

import { ownerOnlyRunHint } from '../scheduleList.helpers';

// #7254: Run now and Test run are the owner's; an admin is told who can run the schedule

const ADMIN_ACTIONS = ['edit', 'pause', 'delete', 'change_owner'];

describe('ownerOnlyRunHint', () => {
  it('names the owner for an admin viewing a schedule with a version', () => {
    expect(
      ownerOnlyRunHint({ version_id: 4, owner: { name: 'Ann Lee' }, allowed_actions: ADMIN_ACTIONS }),
    ).toBe('Only the schedule owner, Ann Lee, can run it.');
  });

  it('says it without a name when the owner has none', () => {
    expect(ownerOnlyRunHint({ version_id: 4, owner: { id: 1 }, allowed_actions: ADMIN_ACTIONS })).toBe(
      'Only the schedule owner can run it.',
    );
  });

  it.each([
    ['the owner, who can run it', { version_id: 4, allowed_actions: ['run', 'edit', 'change_owner'] }],
    ['the owner of a schedule without a version', { version_id: null, allowed_actions: ADMIN_ACTIONS }],
    ['a row with no admin action', { version_id: 4, allowed_actions: ['edit'] }],
    ['a row without actions', { version_id: 4 }],
    ['no row', undefined],
  ])('is null for %s', (_label, schedule) => {
    expect(ownerOnlyRunHint(schedule)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { SHARE_MESSAGES, WHOLE_TEAM_ID } from '../../constants/shareChat.constants';
import {
  addPicked,
  buildSavedAccess,
  countPeopleWithAccess,
  getCopyLinkMessage,
  getWholeTeamName,
  isSameAccessList,
  togglePick,
} from '../shareChat.helpers';

const wholeTeam = { id: WHOLE_TEAM_ID };
const ann = { id: 2, name: 'Ann' };
const bob = { id: 3, name: 'Bob' };
const userParticipant = (id, userId, name) => ({
  id,
  entity_name: 'user',
  entity_meta: { id: userId },
  meta: { user_name: name },
});

describe('buildSavedAccess', () => {
  const participants = [
    userParticipant(11, 1, 'Owner'),
    userParticipant(13, 3, 'Bob'),
    userParticipant(12, 2, 'Ann'),
  ];

  it('lists the users other than the owner of a private chat, in the order they were added', () => {
    expect(buildSavedAccess({ isPrivate: true, participants, ownerId: 1 })).toEqual([
      { id: 2, name: 'Ann', avatar: '' },
      { id: 3, name: 'Bob', avatar: '' },
    ]);
  });

  it('shows Whole team for a public chat', () => {
    expect(buildSavedAccess({ isPrivate: false, participants, ownerId: 1 })).toEqual([wholeTeam]);
  });
});

describe('getWholeTeamName', () => {
  it('counts the teammates without the owner', () => {
    expect(getWholeTeamName(26)).toBe('Whole team: 25 teammates');
    expect(getWholeTeamName(0)).toBe('Whole team: 0 teammates');
  });
});

describe('countPeopleWithAccess', () => {
  it('counts the owner too', () => {
    expect(countPeopleWithAccess([], 26)).toBe(1);
    expect(countPeopleWithAccess([ann, bob], 26)).toBe(3);
    expect(countPeopleWithAccess([wholeTeam], 26)).toBe(26);
  });
});

describe('picking people', () => {
  it('keeps Whole team and single people apart', () => {
    expect(togglePick([ann], wholeTeam)).toEqual([wholeTeam]);
    expect(togglePick([wholeTeam], ann)).toEqual([ann]);
    expect(togglePick([ann, bob], ann)).toEqual([bob]);
  });

  it('adds the picked people after the list, or replaces it with Whole team', () => {
    expect(addPicked([ann], [bob])).toEqual([ann, bob]);
    expect(addPicked([wholeTeam], [bob])).toEqual([bob]);
    expect(addPicked([ann, bob], [wholeTeam])).toEqual([wholeTeam]);
  });
});

describe('getCopyLinkMessage', () => {
  it('tells who can open the link', () => {
    expect(getCopyLinkMessage({ saved: [], isDirty: false })).toBe(SHARE_MESSAGES.ownerOnly);
    expect(getCopyLinkMessage({ saved: [ann], isDirty: true })).toBe(SHARE_MESSAGES.unsaved);
    expect(getCopyLinkMessage({ saved: [ann], isDirty: false })).toBe(SHARE_MESSAGES.saved);
  });
});

describe('isSameAccessList', () => {
  it('treats the same people in another order as no change', () => {
    expect(isSameAccessList([ann, bob], [bob, ann])).toBe(true);
  });

  it('sees a removed person as a change', () => {
    expect(isSameAccessList([ann, bob], [ann])).toBe(false);
  });
});

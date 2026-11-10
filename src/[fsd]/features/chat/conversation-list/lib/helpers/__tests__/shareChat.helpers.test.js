import { describe, expect, it } from 'vitest';

import { DEFAULT_LINK_FORM, SHARE_MESSAGES, WHOLE_TEAM_ID } from '../../constants/shareChat.constants';
import {
  addPicked,
  buildCreateLinkBody,
  buildLinkContentLabel,
  buildSavedAccess,
  canGenerateLink,
  countPeopleWithAccess,
  countShareLinks,
  getCopyLinkMessage,
  getPasswordError,
  getWholeTeamName,
  isSameAccessList,
  resolveLinkScope,
  sortShareLinks,
  togglePick,
} from '../shareChat.helpers';

const NOW = new Date('2026-11-10T12:00:00Z').getTime();
const wholeTeam = { id: WHOLE_TEAM_ID };
const ann = { id: 2, name: 'Ann' };
const bob = { id: 3, name: 'Bob' };
const userParticipant = (id, userId, name) => ({
  id,
  entity_name: 'user',
  entity_meta: { id: userId },
  meta: { user_name: name },
});

describe('resolveLinkScope', () => {
  it.each([
    [{ whichMessages: 'all', includeMessages: true, includeAttachments: true }, 'all'],
    [{ whichMessages: 'all', includeMessages: true, includeAttachments: false }, 'messages'],
    [{ whichMessages: 'all', includeMessages: false, includeAttachments: true }, 'attachments'],
    [{ whichMessages: 'selected', includeMessages: true, includeAttachments: true }, 'partial'],
  ])('maps %o to %s', (form, scope) => {
    expect(resolveLinkScope(form)).toBe(scope);
  });
});

describe('buildCreateLinkBody', () => {
  it('sends the trimmed password and the picked messages only for a partial link', () => {
    const body = buildCreateLinkBody({
      ...DEFAULT_LINK_FORM,
      whichMessages: 'selected',
      selectedIds: [7, 9],
      password: ' secret123 ',
    });

    expect(body).toEqual({
      expiry: '7d',
      scope: 'partial',
      password: 'secret123',
      message_group_ids: [7, 9],
    });
  });

  it('leaves the password and the messages out of a full link without a password', () => {
    expect(buildCreateLinkBody(DEFAULT_LINK_FORM)).toEqual({ expiry: '7d', scope: 'all' });
  });
});

describe('canGenerateLink', () => {
  it('needs something to include, a picked message for Selected and a valid password', () => {
    expect(canGenerateLink(DEFAULT_LINK_FORM)).toBe(true);
    expect(canGenerateLink({ ...DEFAULT_LINK_FORM, includeMessages: false, includeAttachments: false })).toBe(
      false,
    );
    expect(canGenerateLink({ ...DEFAULT_LINK_FORM, whichMessages: 'selected' })).toBe(false);
    expect(canGenerateLink({ ...DEFAULT_LINK_FORM, password: 'short' })).toBe(false);
  });
});

describe('getPasswordError', () => {
  it('allows an empty password and asks for 8 characters otherwise', () => {
    expect(getPasswordError('')).toBe('');
    expect(getPasswordError('1234567')).toBe('Minimum 8 characters');
    expect(getPasswordError('12345678')).toBe('');
  });
});

describe('links', () => {
  const links = [
    { token: 'old-expired', created_at: '2026-10-01', expires_at: '2026-10-08' },
    { token: 'old-active', created_at: '2026-11-01', expires_at: null },
    { token: 'new-active', created_at: '2026-11-09', expires_at: '2026-11-16' },
  ];

  it('puts active links first, newest first', () => {
    expect(sortShareLinks(links, NOW).map(link => link.token)).toEqual([
      'new-active',
      'old-active',
      'old-expired',
    ]);
  });

  it('counts active and expired links', () => {
    expect(countShareLinks(links, NOW)).toEqual({ active: 2, expired: 1 });
  });

  it('labels a partial link the list returns without its messages', () => {
    expect(buildLinkContentLabel({ scope: 'partial' }, { messages: 3, files: 1 })).toBe('Selected messages');
  });

  it('labels a partial link with every message picked as all messages', () => {
    const totals = { messages: 3, files: 1 };
    expect(buildLinkContentLabel({ scope: 'partial', message_group_ids: [1, 2] }, totals)).toBe(
      '2 of 3 messages',
    );
    expect(buildLinkContentLabel({ scope: 'partial', message_group_ids: [1, 2, 3] }, totals)).toBe(
      'All 3 messages',
    );
  });
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

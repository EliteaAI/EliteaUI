import { describe, expect, it } from 'vitest';

import { IMPORT_PARTICIPANT_MESSAGES } from '../../constants/importConversation.constants';
import { getParticipantStatusText, isParticipantLinkable } from '../importConversation.helpers';

const same = { id: 1, name: 'Agent-X', status: 'same', target_name: 'Agent-X' };
const renamed = { id: 2, name: 'Agent-X', status: 'same', target_name: 'Agent-Y' };
const nameOnly = { id: 3, name: 'Helper', status: 'name_only', target_name: 'Helper' };
const notFound = { id: 4, name: 'Gone', status: 'not_found' };
const sameSharingTarget = { id: 5, name: 'Agent-X copy', status: 'same', target_name: 'Agent-X', same_as: 1 };
const nameOnlySharingTarget = {
  id: 6,
  name: 'Agent-X',
  status: 'name_only',
  target_name: 'Agent-X',
  same_as: 1,
};

describe('isParticipantLinkable', () => {
  it.each([
    [same, true],
    [nameOnly, true],
    [notFound, false],
  ])('treats %o as linkable=%s', (participant, expected) => {
    expect(isParticipantLinkable(participant)).toBe(expected);
  });
});

describe('getParticipantStatusText', () => {
  const participants = [same, renamed, nameOnly, notFound, sameSharingTarget, nameOnlySharingTarget];

  it('says nothing for the exact original under its own name', () => {
    expect(getParticipantStatusText(same, participants)).toBe('');
  });

  it('names the current name of a renamed original', () => {
    expect(getParticipantStatusText(renamed, participants)).toBe(
      IMPORT_PARTICIPANT_MESSAGES.renamed('Agent-Y'),
    );
  });

  it('warns about a same-name substitute', () => {
    expect(getParticipantStatusText(nameOnly, participants)).toBe(IMPORT_PARTICIPANT_MESSAGES.nameOnly);
  });

  it('explains a participant that will not be linked', () => {
    expect(getParticipantStatusText(notFound, participants)).toBe(IMPORT_PARTICIPANT_MESSAGES.notFound);
  });

  it('points an exact original sharing a target at the first row', () => {
    expect(getParticipantStatusText(sameSharingTarget, participants)).toBe(
      IMPORT_PARTICIPANT_MESSAGES.sameAs('Agent-X'),
    );
  });

  it('still warns about a same-name substitute that shares a target with an earlier row', () => {
    expect(getParticipantStatusText(nameOnlySharingTarget, participants)).toBe(
      IMPORT_PARTICIPANT_MESSAGES.nameOnly,
    );
  });
});

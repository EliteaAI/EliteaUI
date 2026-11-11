import { ChatParticipantType } from '@/common/constants';

import { SHARE_MESSAGES, WHOLE_TEAM_ID } from '../constants/shareChat.constants';

export const isSameAccessList = (left, right) => {
  const leftIds = new Set(left.map(item => item.id));
  const rightIds = new Set(right.map(item => item.id));
  return leftIds.size === rightIds.size && [...rightIds].every(id => leftIds.has(id));
};

export const hasWholeTeam = list => list.some(item => item.id === WHOLE_TEAM_ID);

export const WHOLE_TEAM_ITEM = { id: WHOLE_TEAM_ID };

export const getWholeTeamName = membersTotal => `Whole team: ${Math.max(membersTotal - 1, 0)} teammates`;

export const countPeopleWithAccess = (list, membersTotal) =>
  hasWholeTeam(list) ? membersTotal : list.length + 1;

export const toAccessPerson = participant => ({
  id: participant.entity_meta?.id,
  name: participant.meta?.user_name || participant.entity_meta?.name || '',
  avatar: participant.meta?.user_avatar || '',
});

export const buildSavedAccess = ({ isPrivate, participants = [], ownerId }) => {
  if (!isPrivate) return [WHOLE_TEAM_ITEM];
  return participants
    .filter(item => item.entity_name === ChatParticipantType.Users && item.entity_meta?.id != ownerId)
    .sort((a, b) => a.id - b.id)
    .map(toAccessPerson);
};

export const getCopyLinkMessage = ({ saved, isDirty }) => {
  if (isDirty) return SHARE_MESSAGES.unsaved;
  if (saved.length === 0) return SHARE_MESSAGES.ownerOnly;
  return SHARE_MESSAGES.saved;
};

export const togglePick = (picked, item) => {
  if (picked.some(entry => entry.id === item.id)) return picked.filter(entry => entry.id !== item.id);
  if (item.id === WHOLE_TEAM_ID) return [item];
  return [...picked.filter(entry => entry.id !== WHOLE_TEAM_ID), item];
};

export const addPicked = (list, picked) => {
  const wholeTeam = picked.find(item => item.id === WHOLE_TEAM_ID);
  if (wholeTeam) return [wholeTeam];
  return [...list.filter(item => item.id !== WHOLE_TEAM_ID), ...picked];
};

export const toMemberItem = user => ({
  id: user.id,
  name: user.name || user.email || '',
  avatar: user.avatar,
});

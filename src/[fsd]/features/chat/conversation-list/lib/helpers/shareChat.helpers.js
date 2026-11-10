import { ChatParticipantType } from '@/common/constants';

import {
  LINK_SCOPES,
  MIN_PASSWORD_LENGTH,
  SHARE_MESSAGES,
  WHICH_MESSAGES,
  WHOLE_TEAM_ID,
} from '../constants/shareChat.constants';

const pad = value => String(value).padStart(2, '0');

export const formatShareDate = value => {
  const date = new Date(value);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export const formatShareTime = value => {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const isLinkExpired = (link, now) => !!link.expires_at && new Date(link.expires_at).getTime() < now;

export const sortShareLinks = (links, now) =>
  [...links].sort((a, b) => {
    const expiredDiff = Number(isLinkExpired(a, now)) - Number(isLinkExpired(b, now));
    if (expiredDiff) return expiredDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

export const countShareLinks = (links, now) => {
  const expired = links.filter(link => isLinkExpired(link, now)).length;
  return { active: links.length - expired, expired };
};

export const buildLinkContentLabel = (link, totals) => {
  switch (link.scope) {
    case LINK_SCOPES.partial: {
      // The link list does not return the picked messages, only the answer to the create call does
      const count = link.message_group_ids?.length;
      if (!count) return 'Selected messages';
      return count >= totals.messages
        ? `All ${totals.messages} messages`
        : `${count} of ${totals.messages} messages`;
    }
    case LINK_SCOPES.messages:
      return `Messages only (${totals.messages})`;
    case LINK_SCOPES.attachments:
      return `Attachments only (${totals.files} files)`;
    default:
      return `All ${totals.messages} messages`;
  }
};

export const buildLinkTitle = (link, totals, now) => {
  const content = buildLinkContentLabel(link, totals);
  if (isLinkExpired(link, now)) return content;
  return link.expires_at
    ? `${content} - Expires ${formatShareDate(link.expires_at)}`
    : `${content} - Never expires`;
};

export const buildLinkMeta = link => {
  const times = link.access_count === 1 ? 'time' : 'times';
  return `Accessed ${link.access_count} ${times} - Created ${formatShareDate(link.created_at)}`;
};

export const buildShareLinkUrl = (basename, token) =>
  `${window.location.protocol}//${window.location.host}${basename}/shared/chat/${token}`;

export const resolveLinkScope = ({ whichMessages, includeMessages, includeAttachments }) => {
  if (whichMessages === WHICH_MESSAGES.selected) return LINK_SCOPES.partial;
  if (includeMessages && includeAttachments) return LINK_SCOPES.all;
  if (includeMessages) return LINK_SCOPES.messages;
  return LINK_SCOPES.attachments;
};

export const buildCreateLinkBody = form => {
  const scope = resolveLinkScope(form);
  const body = { expiry: form.expiry, scope };
  const password = form.password.trim();
  if (password) body.password = password;
  if (scope === LINK_SCOPES.partial) body.message_group_ids = form.selectedIds;
  return body;
};

export const getPasswordError = password => {
  const trimmed = password.trim();
  return trimmed.length > 0 && trimmed.length < MIN_PASSWORD_LENGTH ? 'Minimum 8 characters' : '';
};

export const canGenerateLink = form =>
  !getPasswordError(form.password) &&
  (form.whichMessages === WHICH_MESSAGES.selected
    ? form.selectedIds.length > 0
    : form.includeMessages || form.includeAttachments);

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

export const toShareMessage = (group, authorNames) => {
  const items = group.message_items ?? [];
  const textItem = items.find(item => item.item_type === 'text_message');
  return {
    id: group.id,
    author: authorNames[group.author_participant_id] || '',
    created_at: group.created_at,
    text: textItem?.item_details?.content ? String(textItem.item_details.content) : '',
    files: items.filter(item => item.item_type === 'attachment_message').length,
  };
};

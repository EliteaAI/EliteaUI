import { ChatParticipantType } from '@/common/constants';

import {
  LINK_SCOPES,
  MIN_PASSWORD_LENGTH,
  SHARE_MESSAGES,
  WHICH_MESSAGES,
  WHOLE_TEAM_ID,
} from '../constants/shareChat.constants';

const pad = value => String(value).padStart(2, '0');

const SHARE_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const toValidDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatShareDate = value => {
  const date = toValidDate(value);
  return date ? SHARE_DATE_FORMAT.format(date) : '';
};

export const formatShareTime = value => {
  const date = toValidDate(value);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '';
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

// Counts are left out until they load, so a card never reads "All 0 messages"
export const buildLinkContentLabel = (link, totals) => {
  switch (link.scope) {
    // The link list does not return which messages a partial link holds
    case LINK_SCOPES.partial:
      return 'Selected messages';
    case LINK_SCOPES.messages:
      return totals.isLoaded ? `Messages only (${totals.messages})` : 'Messages only';
    case LINK_SCOPES.attachments:
      return totals.isLoaded ? `Attachments only (${totals.files} files)` : 'Attachments only';
    default:
      return totals.isLoaded ? `All ${totals.messages} messages` : 'All messages';
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
  const accessCount = link.access_count ?? 0;
  const times = accessCount === 1 ? 'time' : 'times';
  const created = formatShareDate(link.created_at);
  return `Accessed ${accessCount} ${times}${created ? ` - Created ${created}` : ''}`;
};

export const buildShareLinkUrl = (basename, token) =>
  `${window.location.protocol}//${window.location.host}${basename}/shared/chat/${token}`;

export const resolveLinkScope = ({ whichMessages, includeMessages, includeAttachments }) => {
  if (whichMessages === WHICH_MESSAGES.selected) return LINK_SCOPES.partial;
  if (includeMessages && includeAttachments) return LINK_SCOPES.all;
  if (includeMessages) return LINK_SCOPES.messages;
  return LINK_SCOPES.attachments;
};

export const buildLinkBody = ({ expiry, scope, password, messageGroupIds }) => {
  const body = { expiry, scope };
  const trimmed = password.trim();
  if (trimmed) body.password = trimmed;
  if (scope === LINK_SCOPES.partial) body.message_group_ids = messageGroupIds;
  return body;
};

export const buildCreateLinkBody = form =>
  buildLinkBody({
    expiry: form.expiry,
    scope: resolveLinkScope(form),
    password: form.password,
    messageGroupIds: form.selectedIds,
  });

export const getPasswordError = password => {
  const trimmed = password.trim();
  return trimmed.length > 0 && trimmed.length < MIN_PASSWORD_LENGTH
    ? `Minimum ${MIN_PASSWORD_LENGTH} characters`
    : '';
};

// Until the counts load, only the ticks are checked
export const canGenerateLink = (form, totals = { isLoaded: false }) => {
  if (getPasswordError(form.password)) return false;
  if (form.whichMessages === WHICH_MESSAGES.selected) return form.selectedIds.length > 0;
  if (!totals.isLoaded) return form.includeMessages || form.includeAttachments;
  return (form.includeMessages && totals.messages > 0) || (form.includeAttachments && totals.files > 0);
};

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

export const UNKNOWN_AUTHOR = 'Unknown';

export const getMessagePreview = message => {
  if (message.text) return message.text;
  if (!message.files) return '';
  return `${message.files} ${message.files === 1 ? 'attachment' : 'attachments'}`;
};

export const toShareMessage = (group, authorNames) => {
  const items = group.message_items ?? [];
  const textItem = items.find(item => item.item_type === 'text_message');
  return {
    id: group.id,
    author: authorNames[group.author_participant_id] || UNKNOWN_AUTHOR,
    created_at: group.created_at,
    text: textItem?.item_details?.content ? String(textItem.item_details.content) : '',
    files: items.filter(item => item.item_type === 'attachment_message').length,
  };
};

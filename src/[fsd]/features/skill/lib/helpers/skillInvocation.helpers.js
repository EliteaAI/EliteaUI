import { ChatParticipantType } from '@/common/constants';

const SKILL_PARTICIPANT = ChatParticipantType.Skills;
const USER_INVOCABLE_KEY = 'user-invocable';
const USER_INVOCABLE_META = 'user_invocable';
const ARGUMENT_HINT_KEY = 'argument-hint';
const ARGUMENT_HINT_META = 'argument_hint';
const VERSION_META_KEYS = [USER_INVOCABLE_META, ARGUMENT_HINT_META];

export const userInvocableMeta = versionDetails =>
  versionDetails?.meta?.frontmatter?.[USER_INVOCABLE_KEY] === false ? { [USER_INVOCABLE_META]: false } : {};

const hintAsText = value => {
  if (Array.isArray(value)) return `[${value.map(hintAsText).join(', ')}]`;
  if (value && typeof value === 'object')
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${hintAsText(item)}`)
      .join(', ');
  return String(value).trim();
};

export const argumentHintText = value => {
  if (value === null || value === undefined) return undefined;
  if (
    Array.isArray(value) ? value.length === 0 : typeof value === 'object' && Object.keys(value).length === 0
  )
    return undefined;
  return hintAsText(value) || undefined;
};

export const argumentHintMeta = versionDetails => {
  const text = argumentHintText(versionDetails?.meta?.frontmatter?.[ARGUMENT_HINT_KEY]);
  return text ? { [ARGUMENT_HINT_META]: text } : {};
};

export const skillVersionMeta = versionDetails => ({
  ...userInvocableMeta(versionDetails),
  ...argumentHintMeta(versionDetails),
});

export const withSkillVersionMeta = (meta, versionDetails) => ({
  ...Object.fromEntries(Object.entries(meta || {}).filter(([key]) => !VERSION_META_KEYS.includes(key))),
  ...skillVersionMeta(versionDetails),
});

export const isUserInvocable = item => item?.[USER_INVOCABLE_META] !== false;

export const skillComposerPlaceholder = (activeParticipant, fallback) => {
  if (activeParticipant?.entity_name !== SKILL_PARTICIPANT) return fallback;
  const { name, [ARGUMENT_HINT_META]: hint } = activeParticipant.meta || {};
  return name && hint ? `~${name} ${hint}` : fallback;
};

import { getEnvVar } from '@/utils/env';

export const MentionPhase = {
  Idle: 'idle',
  Items: 'items',
  Tools: 'tools',
};

// Defaults (fallbacks when config is not set or invalid)
const DEFAULTS = {
  slash: '/',
  skill: '~',
  participant: '#',
  privateParticipant: '&',
  user: '@',
};

// Validation helper - must be single non-alphanumeric, non-whitespace character
const isValidTrigger = char => typeof char === 'string' && char.length === 1 && /^[^a-zA-Z0-9\s]$/.test(char);

// Read config once at module load (safe - config injected into HTML before JS runs)
const config = getEnvVar('chat_mentions', {});

// Trigger characters that start an instructions/toolkit mention
export const SLASH_TRIGGER = isValidTrigger(config?.slash_trigger) ? config.slash_trigger : DEFAULTS.slash;

// Trigger character for skill mentions
export const SKILL_TRIGGER = isValidTrigger(config?.skill_trigger) ? config.skill_trigger : DEFAULTS.skill;

// Trigger character that opens the participant ("search results") dropdown
export const PARTICIPANT_TRIGGER = isValidTrigger(config?.participant_trigger)
  ? config.participant_trigger
  : DEFAULTS.participant;

// Same dropdown as PARTICIPANT_TRIGGER, but public agents/pipelines are excluded
export const PRIVATE_PARTICIPANT_TRIGGER = isValidTrigger(config?.private_participant_trigger)
  ? config.private_participant_trigger
  : DEFAULTS.privateParticipant;

// Trigger character for user mentions
export const USER_TRIGGER = isValidTrigger(config?.user_trigger) ? config.user_trigger : DEFAULTS.user;

// Array of all participant triggers for keydown detection
export const PARTICIPANT_TRIGGERS = [PARTICIPANT_TRIGGER, PRIVATE_PARTICIPANT_TRIGGER];

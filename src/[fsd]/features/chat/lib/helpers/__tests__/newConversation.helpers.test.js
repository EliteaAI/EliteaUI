import { describe, expect, it } from 'vitest';

import {
  getChatParticipantUniqueId,
  getParticipantName,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import { ChatParticipantType } from '@/common/constants';

import {
  buildDefaultUserParticipant,
  buildUserParticipant,
  getSkippedTemplateParticipantsMessage,
  isUnavailableTemplateSkill,
} from '../newConversation.helpers';

const templateUser = { id: 7, name: 'Samvel Petrosyan', entity_name: ChatParticipantType.Users };
const projectUser = { id: 7, name: 'Samvel P', email: 'samvel@example.com', avatar: 'https://avatars/7.png' };

describe('buildDefaultUserParticipant', () => {
  it('exposes the template name where participant consumers read a user name', () => {
    const participant = buildDefaultUserParticipant(templateUser);

    expect(getParticipantName(participant)).toBe('Samvel Petrosyan');
    expect(participant.meta.user_name).toBe('Samvel Petrosyan');
  });

  it('carries the project user avatar and email into participant meta', () => {
    const participant = buildDefaultUserParticipant(templateUser, projectUser);

    expect(participant.meta.user_avatar).toBe('https://avatars/7.png');
    expect(participant.meta.email).toBe('samvel@example.com');
  });

  it('keeps the template name stable once the project user resolves', () => {
    const base = buildDefaultUserParticipant(templateUser);
    const enriched = buildDefaultUserParticipant(templateUser, projectUser);

    expect(enriched.meta.user_name).toBe(base.meta.user_name);
  });

  it('falls back to the project user name, then email, when the template has no name', () => {
    const unnamed = { id: 7, entity_name: ChatParticipantType.Users };

    expect(buildDefaultUserParticipant(unnamed, projectUser).meta.user_name).toBe('Samvel P');
    expect(buildDefaultUserParticipant(unnamed, { ...projectUser, name: '' }).meta.user_name).toBe(
      'samvel@example.com',
    );
  });

  it('identifies the participant the same way as a manually added user', () => {
    const participant = buildDefaultUserParticipant(templateUser, projectUser);

    expect(participant.entity_name).toBe(ChatParticipantType.Users);
    expect(participant.participantType).toBe(ChatParticipantType.Users);
    expect(getChatParticipantUniqueId(participant)).toBe(`${ChatParticipantType.Users}_7_`);
  });
});

describe('buildUserParticipant', () => {
  it('exposes a picked user name and avatar where participant consumers read them', () => {
    const participant = buildUserParticipant({
      id: 9,
      name: 'Ann Lee',
      project_id: 3,
      avatar: 'https://avatars/9.png',
      email: 'ann@example.com',
    });

    expect(getParticipantName(participant)).toBe('Ann Lee');
    expect(participant.meta).toEqual({
      user_name: 'Ann Lee',
      user_avatar: 'https://avatars/9.png',
      email: 'ann@example.com',
    });
    expect(participant.entity_meta).toEqual({ id: 9, name: 'Ann Lee' });
  });
});

describe('template skills on a new chat', () => {
  it('skips a template skill whose details could not be loaded', () => {
    expect(isUnavailableTemplateSkill({ entity_name: 'skill' }, {})).toBe(true);
    expect(isUnavailableTemplateSkill({ entity_name: 'skill' }, undefined)).toBe(true);
  });

  it('keeps a template skill with details', () => {
    expect(isUnavailableTemplateSkill({ entity_name: 'skill' }, { id: 8, name: 'Reviewer' })).toBe(false);
  });

  it('keeps other participants without details, as before', () => {
    expect(isUnavailableTemplateSkill({ entity_name: 'application' }, {})).toBe(false);
    expect(isUnavailableTemplateSkill({ entity_name: 'toolkit' }, {})).toBe(false);
  });

  it('counts the skipped participants in the notice', () => {
    expect(getSkippedTemplateParticipantsMessage(1)).toBe('1 template participant was skipped');
    expect(getSkippedTemplateParticipantsMessage(2)).toBe('2 template participants were skipped');
  });
});

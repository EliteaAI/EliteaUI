import { describe, expect, it } from 'vitest';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import {
  canParticipantBeActiveInChat,
  isParticipantOKForChat,
  transformParticipant,
} from '../addParticipants.helpers';

// #6819 — a model participant is seeded with the model row's default effort, not a constant.
describe('transformParticipant seeds model participants from the model row', () => {
  const model = overrides => ({
    integration_uid: 'cred-1',
    model_name: 'gpt-5-pro',
    supports_reasoning: true,
    ...overrides,
  });

  it('uses the stored default effort', () => {
    const participant = transformParticipant(
      ChatParticipantType.Models,
      model({ supported_efforts: ['high'], default_effort: 'high' }),
    );
    expect(participant.entity_settings.reasoning_effort).toBe('high');
    expect(participant.entity_settings).not.toHaveProperty('temperature');
  });

  it('keeps medium for a row without stored levels and keeps an explicit value', () => {
    expect(transformParticipant(ChatParticipantType.Models, model()).entity_settings.reasoning_effort).toBe(
      'medium',
    );
    expect(
      transformParticipant(
        ChatParticipantType.Models,
        model({ reasoning_effort: 'low', default_effort: 'high' }),
      ).entity_settings.reasoning_effort,
    ).toBe('low');
  });

  it('seeds temperature for a non-reasoning model', () => {
    const participant = transformParticipant(
      ChatParticipantType.Models,
      model({ supports_reasoning: false }),
    );
    expect(participant.entity_settings).not.toHaveProperty('reasoning_effort');
    expect(participant.entity_settings.temperature).toBe(0.6);
  });
});

describe('transformParticipant builds a skill participant', () => {
  const ownSkillRow = {
    id: 17,
    name: 'release-notes',
    project_id: 2,
    icon_meta: { url: 'icon.png' },
    agent_type: 'classic',
    type: 'github',
    version_details: { variables: [{ name: 'x' }], llm_settings: { model_name: 'gpt-4.1' } },
    settings: { url: 'https://mcp' },
  };

  it('sends only the skill id, its project and the icon, so the backend pins the default version', () => {
    expect(transformParticipant(ChatParticipantType.Skills, ownSkillRow)).toEqual({
      entity_name: ChatParticipantType.Skills,
      entity_meta: { id: 17, project_id: 2 },
      entity_settings: { icon_meta: { url: 'icon.png' } },
    });
  });

  it('keeps the chosen version and the chat model of an enriched new-chat participant', () => {
    const participant = transformParticipant(ChatParticipantType.Skills, {
      id: 17,
      entity_meta: { id: 17, project_id: PUBLIC_PROJECT_ID },
      entity_settings: { version_id: 44, icon_meta: {}, llm_settings: { model_name: 'gpt-4.1' } },
    });
    expect(participant.entity_meta).toEqual({ id: 17, project_id: PUBLIC_PROJECT_ID });
    expect(participant.entity_settings).toEqual({
      version_id: 44,
      icon_meta: {},
      llm_settings: { model_name: 'gpt-4.1' },
    });
  });
});

describe('participant gates accept skills', () => {
  const skill = { entity_name: ChatParticipantType.Skills };

  it('lets a skill be the active participant and an enabled chat item', () => {
    expect(canParticipantBeActiveInChat(skill)).toBe(true);
    expect(isParticipantOKForChat(skill)).toBe(true);
  });

  it('still keeps toolkits from becoming active', () => {
    expect(canParticipantBeActiveInChat({ entity_name: ChatParticipantType.Toolkits })).toBe(false);
  });
});

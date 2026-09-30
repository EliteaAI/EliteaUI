import { describe, expect, it } from 'vitest';

import { ChatParticipantType } from '@/common/constants';

import { transformParticipant } from '../addParticipants.helpers';

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

import { describe, expect, it } from 'vitest';

import {
  applyMessageRegenerationError,
  getParticipantChatModel,
  prepareMessageForRegeneration,
  toRegenerationReason,
} from '../chat.helpers';
import { parseRefusalPayload } from '../refusal.helpers';

describe('prepareMessageForRegeneration', () => {
  it('clears terminal continuation state before regenerating the same message', () => {
    const continuationError = {
      code: 'output_continuation_exhausted',
      partial_output: 'partial response',
    };
    const message = {
      id: 'answer-1',
      participant_id: 42,
      content: 'partial response',
      message_items: [{ id: 'item-1' }],
      references: [{ id: 'reference-1' }],
      exception: 'All continuation attempts were exhausted',
      inputGuardrail: { action: 'block' },
      continuationError,
      toolActions: [{ id: 'tool-1' }],
      isRegenerating: false,
      created_at: 1,
    };

    expect(prepareMessageForRegeneration(message, 2)).toEqual({
      id: 'answer-1',
      participant_id: 42,
      content: '',
      message_items: [],
      references: [],
      exception: undefined,
      inputGuardrail: undefined,
      hitlResumeSnapshot: undefined,
      continuationError: undefined,
      toolActions: [],
      isRegenerating: true,
      created_at: 2,
    });
    expect(message.continuationError).toBe(continuationError);
  });

  it('keeps the superseded continuation state retired when regeneration fails', () => {
    const regeneratingMessage = prepareMessageForRegeneration(
      {
        id: 'answer-1',
        content: 'old partial response',
        exception: 'old continuation failure',
        continuationError: { code: 'output_continuation_exhausted' },
      },
      2,
    );

    expect(applyMessageRegenerationError(regeneratingMessage, 'current regeneration failure')).toEqual({
      id: 'answer-1',
      content: '',
      message_items: [],
      references: [],
      exception: JSON.stringify({ error: 'current regeneration failure' }),
      continuationError: undefined,
      toolActions: [],
      isRegenerating: false,
      created_at: 2,
    });
  });

  it('stores the failure reason where the reply card reads its headline', () => {
    const { exception } = applyMessageRegenerationError({ id: 'answer-1' }, 'Internal Server Error');

    expect(parseRefusalPayload(exception)).toEqual({ message: 'Internal Server Error' });
  });

  it('keeps the refusal code for the reply card chip', () => {
    const { exception } = applyMessageRegenerationError(
      { id: 'answer-1' },
      'At most 3 ~skills per message.',
      'SKILL_INVOCATION_LIMIT',
    );

    expect(parseRefusalPayload(exception)).toEqual({
      message: 'At most 3 ~skills per message.',
      code: 'SKILL_INVOCATION_LIMIT',
    });
  });

  it('keeps an over-long failure reason readable on the reply card', () => {
    const reason = 'x'.repeat(5000);

    const { exception } = applyMessageRegenerationError({ id: 'answer-1' }, reason);

    expect(parseRefusalPayload(exception).message).toBe(`${'x'.repeat(1000)}…`);
  });
});

describe('toRegenerationReason', () => {
  it('keeps a readable server reason', () => {
    expect(toRegenerationReason('Internal Server Error')).toBe('Internal Server Error');
  });

  it.each([[{ detail: { field: 'invalid' } }], [undefined], ['']])(
    'falls back to the generic reason for %j',
    reason => {
      expect(toRegenerationReason(reason)).toBe('Regeneration Failed. Please try again.');
    },
  );
});

describe('getParticipantChatModel', () => {
  const sol = { name: 'gpt-sol', project_id: 1, context_window: 400000 };
  const haiku = { name: 'haiku', project_id: 1, context_window: 128000 };
  const haikuOwn = { name: 'haiku', project_id: 28, context_window: 128000 };
  const models = [sol, haiku, haikuOwn];
  const agent = (llm_settings, entity_name = 'application') => ({
    entity_name,
    entity_meta: { id: 533, project_id: 28 },
    entity_settings: llm_settings ? { llm_settings } : {},
  });
  const details = (llm_settings, id = 533) => ({ id, version_details: { llm_settings } });

  it('uses the version model when the participant has no override', () => {
    expect(
      getParticipantChatModel(agent(), details({ model_name: 'haiku', model_project_id: 1 }), models),
    ).toBe(haiku);
  });

  it('prefers the participant llm_settings override over the version', () => {
    const result = getParticipantChatModel(
      agent({ model_name: 'gpt-sol', model_project_id: 1 }),
      details({ model_name: 'haiku', model_project_id: 1 }),
      models,
    );
    expect(result).toBe(sol);
  });

  it('ignores details that belong to another participant', () => {
    expect(
      getParticipantChatModel(agent(), details({ model_name: 'haiku', model_project_id: 1 }, 344), models),
    ).toBeNull();
  });

  it('matches the model project first, then falls back to the name only', () => {
    expect(
      getParticipantChatModel(agent(), details({ model_name: 'haiku', model_project_id: 28 }), models),
    ).toBe(haikuOwn);
    expect(
      getParticipantChatModel(agent(), details({ model_name: 'haiku', model_project_id: 99 }), models),
    ).toBe(haiku);
  });

  it('returns null when the model is not in the list', () => {
    expect(
      getParticipantChatModel(agent(), details({ model_name: 'gpt-luna', model_project_id: 1 }), models),
    ).toBeNull();
  });

  it('resolves an Auto selection with the auto-routing limits', () => {
    const result = getParticipantChatModel(
      agent(),
      details({ selection: { mode: 'auto', profile_ref: 'balanced' } }),
      models,
      { context_window: 128000 },
    );
    expect(result.selection.mode).toBe('auto');
    expect(result.selection.profile_ref).toBe('balanced');
    expect(result.context_window).toBe(128000);
  });

  it('handles pipelines and skips other participant types', () => {
    const settings = { model_name: 'haiku', model_project_id: 1 };
    expect(getParticipantChatModel(agent(settings, 'pipeline'), null, models)).toBe(haiku);
    expect(getParticipantChatModel(agent(settings, 'user'), null, models)).toBeNull();
    expect(getParticipantChatModel(agent(settings, 'skill'), null, models)).toBeNull();
    expect(getParticipantChatModel(null, null, models)).toBeNull();
  });
});

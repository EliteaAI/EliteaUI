import { describe, expect, it } from 'vitest';

import {
  applyMessageRegenerationError,
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

import { describe, expect, it } from 'vitest';

import { applyMessageRegenerationError, prepareMessageForRegeneration } from './chat.helpers';

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
      exception: 'current regeneration failure',
      continuationError: undefined,
      toolActions: [],
      isRegenerating: false,
      created_at: 2,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { OUTPUT_CONTINUATION_EXHAUSTED, normalizeContinuationError } from './continuationError.helpers';

describe('continuation error contract', () => {
  it('normalizes the supported continuation failure', () => {
    const error = normalizeContinuationError({
      code: OUTPUT_CONTINUATION_EXHAUSTED,
      user_message: 'The response is incomplete.',
      partial_output: '# Partial response',
      attempts: 4,
    });

    expect(error).toEqual({
      code: OUTPUT_CONTINUATION_EXHAUSTED,
      user_message: 'The response is incomplete.',
      partial_output: '# Partial response',
      attempts: 4,
    });
  });

  it('rejects ordinary errors instead of changing their view', () => {
    expect(normalizeContinuationError({ code: 'other_error' })).toBeUndefined();
    expect(normalizeContinuationError(null)).toBeUndefined();
  });

  it('provides safe strings for malformed optional content', () => {
    expect(
      normalizeContinuationError({
        code: OUTPUT_CONTINUATION_EXHAUSTED,
        user_message: null,
        partial_output: { content: 'not a string' },
      }),
    ).toMatchObject({
      user_message: 'Automatic continuation failed. The model response is incomplete.',
      partial_output: '',
    });
  });
});

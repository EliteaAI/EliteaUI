import { describe, expect, it } from 'vitest';

import { isAnswerlessReply } from '../applicationAnswer.helpers';

const finished = {
  isProcessing: false,
  isEditing: false,
  shouldRenderAnswerBlock: false,
  hasSwarmChildren: false,
};

describe('isAnswerlessReply', () => {
  it('flags a finished reply with nothing to render', () => {
    expect(isAnswerlessReply(finished)).toBe(true);
  });

  it('is false while the reply is still loading, streaming or regenerating', () => {
    expect(isAnswerlessReply({ ...finished, isProcessing: true })).toBe(false);
  });

  it('is false when the answer block has content', () => {
    expect(isAnswerlessReply({ ...finished, shouldRenderAnswerBlock: true })).toBe(false);
  });

  it('is false while the reply is being edited', () => {
    expect(isAnswerlessReply({ ...finished, isEditing: true })).toBe(false);
  });

  it('is false for a swarm parent whose children carry the answers', () => {
    expect(isAnswerlessReply({ ...finished, hasSwarmChildren: true })).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/[fsd]/shared/config/reducerRegistry', () => ({ registerReducer: vi.fn() }));

const { default: reducer, actions } = await import('@/[fsd]/features/chat/model/sendFailures.slice');

const initial = reducer(undefined, { type: '@@init' });

describe('sendFailures slice', () => {
  it('tracks a send and settles it', () => {
    let state = reducer(
      initial,
      actions.trackSend({ questionId: 'q1', conversationUuid: 'A', question: 'hi' }),
    );
    expect(state.pendingSends.q1).toEqual(expect.objectContaining({ conversationUuid: 'A', question: 'hi' }));

    state = reducer(state, actions.settleSend({ questionId: 'q1' }));
    expect(state.pendingSends.q1).toBeUndefined();
  });

  it('ignores a send without a conversation', () => {
    const state = reducer(initial, actions.trackSend({ questionId: 'q1' }));
    expect(state.pendingSends).toEqual({});
  });

  it('keeps a failure under the conversation of its send', () => {
    let state = reducer(
      initial,
      actions.trackSend({ questionId: 'q1', conversationUuid: 'A', userMessage: { id: 'q1' } }),
    );
    state = reducer(state, actions.recordFailure({ questionId: 'q1', error: 'busy' }));

    expect(state.pendingSends.q1).toBeUndefined();
    expect(state.failuresByConversation.A.q1).toEqual(
      expect.objectContaining({ questionId: 'q1', error: 'busy', userMessage: { id: 'q1' } }),
    );
  });

  it('clears the failures of a conversation', () => {
    let state = reducer(
      initial,
      actions.recordFailure({ questionId: 'q1', conversationUuid: 'A', error: 'x' }),
    );
    state = reducer(state, actions.clearFailures({ conversationUuid: 'A' }));
    expect(state.failuresByConversation.A).toBeUndefined();
  });

  it('clears only the given failures of a conversation', () => {
    let state = reducer(
      initial,
      actions.recordFailure({ questionId: 'q1', conversationUuid: 'A', error: 'x' }),
    );
    state = reducer(state, actions.recordFailure({ questionId: 'q2', conversationUuid: 'A', error: 'y' }));
    state = reducer(state, actions.clearFailures({ conversationUuid: 'A', questionIds: ['q1'] }));
    expect(Object.keys(state.failuresByConversation.A)).toEqual(['q2']);
    state = reducer(state, actions.clearFailures({ conversationUuid: 'A', questionIds: ['q2'] }));
    expect(state.failuresByConversation.A).toBeUndefined();
  });

  it('remembers the chat on screen', () => {
    let state = reducer(initial, actions.setOpenConversation({ conversationUuid: 'A' }));
    expect(state.openConversationUuid).toBe('A');
    state = reducer(state, actions.setOpenConversation({ conversationUuid: null }));
    expect(state.openConversationUuid).toBeNull();
  });

  it('drops the oldest sends past the limit', () => {
    let state = initial;
    for (let index = 0; index < 25; index += 1) {
      state = reducer(state, actions.trackSend({ questionId: `q${index}`, conversationUuid: 'A' }));
    }
    expect(Object.keys(state.pendingSends)).toHaveLength(20);
  });
});

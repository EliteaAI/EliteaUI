import { describe, expect, it } from 'vitest';

import { ROLES } from '@/common/constants';

import {
  findChatSocketMessageIndex,
  isLocalAssistantPlaceholder,
  mergeChatSocketMessage,
} from '../chatSocket.helpers';

// ---------------------------------------------------------------------------
// Helpers used by addMessageToChatHistory (hooks.js) to verify out-of-order
// socket delivery scenarios (issue #6832: separators shown instead of tool
// calls until page refresh).
// ---------------------------------------------------------------------------

describe('chat socket message identity', () => {
  it('updates the resumed assistant by message id after a HITL decision shifts the history', () => {
    const history = [
      { id: 'question-1', role: ROLES.User },
      {
        id: 'assistant-before-hitl',
        role: ROLES.Assistant,
        question_id: 'question-1',
        toolActions: [{ id: 'llm-before-hitl' }],
      },
      {
        id: 'hitl-decision',
        role: ROLES.User,
        message_items: [{ item_details: { content: 'Generate a different joke' } }],
      },
      {
        id: 'assistant-after-hitl',
        role: ROLES.Assistant,
        question_id: 'hitl-decision',
        toolActions: [],
      },
    ];

    const updated = mergeChatSocketMessage(
      history,
      {
        id: 'assistant-after-hitl',
        role: ROLES.Assistant,
        question_id: 'hitl-decision',
        toolActions: [{ id: 'llm-after-hitl' }],
      },
      { messageId: 'assistant-after-hitl', questionId: 'hitl-decision' },
    );

    expect(updated).toHaveLength(4);
    expect(updated[1].toolActions).toEqual([{ id: 'llm-before-hitl' }]);
    expect(updated[2]).toMatchObject({ id: 'hitl-decision', role: ROLES.User });
    expect(updated[3].toolActions).toEqual([{ id: 'llm-after-hitl' }]);
  });

  it('never treats a user decision as the assistant question-id fallback', () => {
    const history = [
      { id: 'hitl-decision', role: ROLES.User, question_id: 'hitl-decision' },
      {
        id: 'assistant-after-hitl',
        role: ROLES.Assistant,
        question_id: 'hitl-decision',
      },
    ];

    expect(findChatSocketMessageIndex(history, undefined, 'hitl-decision')).toBe(1);
    expect(findChatSocketMessageIndex(history, undefined, undefined)).toBe(-1);
  });

  it('keeps the normal chat fallback for a locally-created assistant placeholder', () => {
    const history = [
      { id: 'question-1', role: ROLES.User },
      {
        internal_id: 'local-assistant',
        role: ROLES.Assistant,
        question_id: 'question-1',
        isSending: true,
      },
    ];

    const updated = mergeChatSocketMessage(
      history,
      {
        role: ROLES.Assistant,
        question_id: 'question-1',
        isSending: false,
        isStreaming: true,
      },
      { messageId: undefined, questionId: 'question-1' },
    );

    expect(updated).toHaveLength(2);
    expect(updated[1]).toMatchObject({
      internal_id: 'local-assistant',
      role: ROLES.Assistant,
      question_id: 'question-1',
      isSending: false,
      isStreaming: true,
    });
  });

  it('never adopts a durable HITL user decision as an assistant placeholder', () => {
    expect(
      isLocalAssistantPlaceholder({
        id: 'hitl-decision',
        internal_id: 'local-id',
        role: ROLES.User,
      }),
    ).toBe(false);
    expect(
      isLocalAssistantPlaceholder({
        internal_id: 'local-assistant',
        role: ROLES.Assistant,
      }),
    ).toBe(true);
  });
});

describe('out-of-order socket delivery (issue #6832)', () => {
  it('returns -1 when the anchor user message has not yet arrived in history', () => {
    // Reproduces the race condition: StartTask arrives before ChatUserMessage.
    // addMessageToChatHistory uses this index to decide whether to splice or
    // fall back to appending at the end (the fix for issue #6832).
    const history = [{ id: 'old-question', role: ROLES.User }];
    const idx = findChatSocketMessageIndex(history, undefined, 'not-yet-arrived-question');
    expect(idx).toBe(-1);
  });

  it('findChatSocketMessageIndex returns the correct index once the anchor arrives', () => {
    // Simulates history state after the user message eventually lands.
    const history = [
      { id: 'q1', role: ROLES.User },
      { id: 'a1', role: ROLES.Assistant, question_id: 'q1' },
    ];
    expect(findChatSocketMessageIndex(history, 'a1', 'q1')).toBe(1);
  });

  it('mergeChatSocketMessage preserves referential equality when no message matches', () => {
    // Verifies React state functional updaters can short-circuit via reference
    // equality (prevState === nextState) when nothing changed.
    const history = [
      { id: 'q1', role: ROLES.User },
      { id: 'a1', role: ROLES.Assistant, question_id: 'q1', toolActions: [] },
    ];
    const result = mergeChatSocketMessage(
      history,
      { id: 'unknown-id', toolActions: [] },
      {
        messageId: 'unknown-id',
        questionId: undefined,
      },
    );
    expect(result).toBe(history);
  });

  it('mergeChatSocketMessage merges tool-action updates when message is found by id', () => {
    // Verifies that an AgentToolEnd update (which finds msg by tool_run_id on the
    // parent assistant message) correctly merges when the message IS present —
    // the happy path after the synthetic action reconstruction in the end handler.
    const toolAction = { id: 'run-1', status: 'processing', toolOutputs: '' };
    const history = [
      { id: 'q1', role: ROLES.User },
      { id: 'a1', role: ROLES.Assistant, question_id: 'q1', toolActions: [toolAction] },
    ];

    const updated = mergeChatSocketMessage(
      history,
      {
        id: 'a1',
        role: ROLES.Assistant,
        question_id: 'q1',
        toolActions: [{ id: 'run-1', status: 'complete', toolOutputs: 'result' }],
      },
      { messageId: 'a1', questionId: 'q1' },
    );

    expect(updated).not.toBe(history);
    expect(updated[1].toolActions[0].status).toBe('complete');
    expect(updated[1].toolActions[0].toolOutputs).toBe('result');
  });
});

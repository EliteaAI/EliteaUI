import { describe, expect, it } from 'vitest';

import { ROLES } from '@/common/constants';

import {
  findChatSocketMessageIndex,
  isLocalAssistantPlaceholder,
  mergeChatSocketMessage,
} from './chatSocket.helpers';

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

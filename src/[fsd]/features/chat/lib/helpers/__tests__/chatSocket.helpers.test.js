import { describe, expect, it } from 'vitest';

import { ROLES, TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import {
  createSyntheticToolAction,
  findChatSocketMessageIndex,
  insertNewAssistantMessage,
  isLocalAssistantPlaceholder,
  mergeChatSocketMessage,
  reorderHistoryOnUserArrival,
} from '../chatSocket.helpers';

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

describe('insertNewAssistantMessage — out-of-order StartTask delivery', () => {
  it('splices the assistant after its user message when the user message is already present', () => {
    const history = [{ id: 'q1', role: ROLES.User }];
    const msg = { id: 'a1', role: ROLES.Assistant, question_id: 'q1' };

    const result = insertNewAssistantMessage(history, msg, 'q1');

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(history[0]);
    expect(result[1]).toBe(msg);
  });

  it('appends at end when the anchor user message has not yet arrived (race condition)', () => {
    const history = [{ id: 'older-q', role: ROLES.User }];
    const msg = { id: 'a1', role: ROLES.Assistant, question_id: 'q-not-yet-here' };

    const result = insertNewAssistantMessage(history, msg, 'q-not-yet-here');

    expect(result).toHaveLength(2);
    expect(result[1]).toBe(msg);
  });

  it('appends at end when questionId is absent', () => {
    const history = [{ id: 'q1', role: ROLES.User }];
    const msg = { id: 'a1', role: ROLES.Assistant };

    const result = insertNewAssistantMessage(history, msg, undefined);

    expect(result).toHaveLength(2);
    expect(result[1]).toBe(msg);
  });
});

describe('reorderHistoryOnUserArrival — late ChatUserMessage delivery', () => {
  it('inserts the user message before a dangling assistant whose question_id matches', () => {
    const assistant = { id: 'a1', role: ROLES.Assistant, question_id: 'q1' };
    const history = [{ id: 'older-q', role: ROLES.User }, assistant];
    const userMsg = { id: 'q1', role: ROLES.User };

    const result = reorderHistoryOnUserArrival(history, userMsg);

    expect(result).toHaveLength(3);
    expect(result[1]).toBe(userMsg);
    expect(result[2]).toBe(assistant);
  });

  it('appends the user message normally when no dangling assistant is present', () => {
    const history = [
      { id: 'q0', role: ROLES.User },
      { id: 'a0', role: ROLES.Assistant, question_id: 'q0' },
    ];
    const userMsg = { id: 'q1', role: ROLES.User };

    const result = reorderHistoryOnUserArrival(history, userMsg);

    expect(result).toHaveLength(3);
    expect(result[2]).toBe(userMsg);
  });
});

describe('createSyntheticToolAction — missed start event fallback', () => {
  it('builds a processing tool action stub with the provided name', () => {
    const action = createSyntheticToolAction('run-1', 'my_tool', TOOL_ACTION_TYPES.Tool, '2024-01-01');

    expect(action.id).toBe('run-1');
    expect(action.name).toBe('my_tool');
    expect(action.type).toBe(TOOL_ACTION_TYPES.Tool);
    expect(action.status).toBe(ToolActionStatus.processing);
    expect(action.created_at).toBe('2024-01-01');
  });

  it('uses TOOL_ACTION_NAMES.Llm as fallback when name is absent and type is Llm', () => {
    const action = createSyntheticToolAction('run-2', undefined, TOOL_ACTION_TYPES.Llm);
    expect(action.name).toBe(TOOL_ACTION_NAMES.Llm);
  });

  it('uses TOOL_ACTION_NAMES.Toolkit as fallback when name is absent and type is Tool', () => {
    const action = createSyntheticToolAction('run-3', '', TOOL_ACTION_TYPES.Tool);
    expect(action.name).toBe(TOOL_ACTION_NAMES.Toolkit);
  });

  it('omits created_at when not provided', () => {
    const action = createSyntheticToolAction('run-4', 'tool', TOOL_ACTION_TYPES.Tool);
    expect('created_at' in action).toBe(false);
  });
});

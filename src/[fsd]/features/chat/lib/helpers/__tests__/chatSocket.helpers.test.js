import { describe, expect, it } from 'vitest';

import { ROLES, TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import {
  applyInputGuardrailBlocked,
  applyInputGuardrailNotice,
  createSyntheticToolAction,
  findChatSocketMessageIndex,
  getAgentGuardrailEventVerdict,
  getAgentGuardrailVerdict,
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

describe('input guardrail socket events (#6886)', () => {
  const blockVerdict = { action: 'block', categories: ['credentials'], rules: ['github_pat'] };

  it('settles the optimistic placeholder of a refused new turn', () => {
    const history = [
      { id: 'q-1', role: ROLES.User, message_items: [] },
      { internal_id: 'tmp', question_id: 'q-1', role: ROLES.Assistant, isLoading: true },
    ];
    const next = applyInputGuardrailBlocked(history, {
      messageId: 'q-1',
      questionId: 'q-1',
      verdict: blockVerdict,
      message: 'It was not sent to the model.',
    });
    expect(next[0]).toBe(history[0]);
    expect(next[1]).toMatchObject({
      isLoading: false,
      isStreaming: false,
      exception: 'It was not sent to the model.',
      inputGuardrail: { ...blockVerdict, message: 'It was not sent to the model.' },
    });
  });

  it('re-enables the HITL buttons of a refused resume', () => {
    const history = [
      {
        id: 'a-1',
        role: ROLES.Assistant,
        isLoading: true,
        hitlInterrupts: [{ tool_call_id: 't1', decided: true }],
      },
    ];
    const next = applyInputGuardrailBlocked(history, { messageId: 'a-1', verdict: blockVerdict });
    expect(next[0].isLoading).toBe(false);
    expect(next[0].hitlInterrupts[0].decided).toBe(false);
    expect(next[0].hitlInterrupt).toBe(next[0].hitlInterrupts[0]);
  });

  it('gives the placeholders the stored ids so the card can be edited without a reload', () => {
    const history = [
      {
        id: 'q-1',
        role: ROLES.User,
        message_items: [
          { item_type: 'attachment_message', uuid: 'att' },
          { item_type: 'text_message', uuid: 'client-item' },
        ],
      },
      { internal_id: 'tmp', question_id: 'q-1', role: ROLES.Assistant, isLoading: true },
    ];
    const next = applyInputGuardrailBlocked(history, {
      messageId: 'q-1',
      questionId: 'q-1',
      verdict: blockVerdict,
      message: 'Not sent.',
      responseMessageId: 'answer-uuid',
      questionItemUuid: 'stored-item',
    });
    expect(next[1].id).toBe('answer-uuid');
    expect(next[1].internal_id).toBe('tmp');
    expect(next[0].message_items[0].uuid).toBe('att');
    expect(next[0].message_items[1].uuid).toBe('stored-item');
    // the edit lookup (question_id -> answer id) now succeeds
    expect(next.find(item => item.question_id === 'q-1').id).toBe('answer-uuid');
  });

  it('leaves the ids alone when the event carries none (nothing was stored)', () => {
    const history = [{ internal_id: 'tmp', question_id: 'q-1', role: ROLES.Assistant }];
    const next = applyInputGuardrailBlocked(history, { questionId: 'q-1', verdict: blockVerdict });
    expect(next[0]).not.toHaveProperty('id');
  });

  it('restores the pause from the snapshot taken before an optimistic non-parallel resume', () => {
    const interrupt = { tool_call_id: 't1', decided: true, queued: true };
    const history = [
      {
        id: 'a-1',
        role: ROLES.Assistant,
        isLoading: true,
        hitlInterrupt: undefined,
        hitlInterrupts: undefined,
        resumingAgentPaths: [[{ call_id: 'c' }]],
        hitlResumeSnapshot: { hitlInterrupts: [interrupt] },
      },
    ];
    const next = applyInputGuardrailBlocked(history, { messageId: 'a-1', verdict: blockVerdict });
    expect(next[0].hitlInterrupts).toEqual([{ tool_call_id: 't1', decided: false, queued: false, hidden: false }]);
    expect(next[0].hitlInterrupt).toBe(next[0].hitlInterrupts[0]);
    expect(next[0].hitlResumeSnapshot).toBeUndefined();
    expect(next[0].resumingAgentPaths).toBeUndefined();
    expect(next[0].isLoading).toBe(false);
  });

  it('leaves history untouched when no turn matches', () => {
    const history = [{ id: 'q-1', role: ROLES.User }];
    expect(applyInputGuardrailBlocked(history, { messageId: 'x', questionId: 'y' })).toBe(history);
  });

  it('replaces the optimistic text with the redacted copy', () => {
    const history = [
      {
        id: 'q-1',
        role: ROLES.User,
        message_items: [
          { item_type: 'attachment_message', item_details: { name: 'a.txt' } },
          { item_type: 'text_message', item_details: { content: 'typed' } },
        ],
      },
    ];
    const verdict = { action: 'redact', categories: ['credentials'] };
    const next = applyInputGuardrailNotice(history, { questionId: 'q-1', verdict, content: '[REDACTED]' });
    expect(next[0].inputGuardrail).toEqual(verdict);
    expect(next[0].message_items[0]).toBe(history[0].message_items[0]);
    expect(next[0].message_items[1].item_details.content).toBe('[REDACTED]');
    expect(next[0]).not.toHaveProperty('content');
  });

  it('keeps the text of a warn-only notice', () => {
    const history = [
      {
        id: 'q-1',
        role: ROLES.User,
        message_items: [{ item_type: 'text_message', item_details: { content: 'typed' } }],
      },
    ];
    const next = applyInputGuardrailNotice(history, {
      questionId: 'q-1',
      verdict: { action: 'warn' },
      content: null,
    });
    expect(next[0].message_items).toBe(history[0].message_items);
    expect(next[0].inputGuardrail.action).toBe('warn');
  });
});

describe('SDK / indexer input guardrail events (#6886)', () => {
  it('turns the agent_exception verdict into a card verdict with the user message', () => {
    expect(
      getAgentGuardrailVerdict({
        input_guardrail: {
          code: 'input_guardrail_blocked',
          action: 'block',
          user_message: 'Not sent to the model.',
          message_key: 'credentials',
          categories: ['credentials'],
        },
      }),
    ).toMatchObject({
      action: 'block',
      message: 'Not sent to the model.',
      message_key: 'credentials',
      categories: ['credentials'],
    });
  });

  it('has no verdict for an ordinary exception', () => {
    expect(getAgentGuardrailVerdict({ human_readable: 'boom' })).toBeUndefined();
    expect(getAgentGuardrailVerdict(undefined)).toBeUndefined();
  });

  it('reads the warn / redact event payload', () => {
    expect(
      getAgentGuardrailEventVerdict({
        name: 'input_guardrail',
        action: 'redact',
        categories: ['credentials'],
        detection_count: 2,
      }),
    ).toEqual({ action: 'redact', categories: ['credentials'], rules: [], segments: [], detection_count: 2 });
    expect(getAgentGuardrailEventVerdict({ name: 'input_guardrail' })).toBeUndefined();
  });
});

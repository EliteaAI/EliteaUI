import { describe, expect, it } from 'vitest';

import {
  buildTraceListParams,
  convertToAIAnswer,
  convertToUserQuestion,
  traceRowToStep,
} from './convertChatConversationMessages';

describe('normalized trace rows', () => {
  it('restores canonical hierarchy for a lazy thinking pin', () => {
    const parentPath = [{ name: 'Full Name resolver', call_id: 'root-1', sibling_ordinal: 1 }];
    const step = traceRowToStep({
      id: 42,
      message_group_id: 7,
      kind: 'thinking_step',
      model_name: 'model',
      parent_agent_name: 'Name Resolver',
      parent_agent_call_id: 'leaf-1',
      attrs: {
        parent_agent_path: parentPath,
        response_metadata: { tool_name: 'Name LLM' },
      },
    });

    expect(step).toMatchObject({
      parent_agent_name: 'Name Resolver',
      parent_agent_call_id: 'leaf-1',
      parent_agent_path: parentPath,
      _traceStepId: 42,
      _traceMessageGroupId: 7,
    });
    expect(step.message.response_metadata.tool_name).toBe('Name LLM');
  });

  it('scopes trace-list reads to unique loaded message groups', () => {
    expect(buildTraceListParams([{ id: 9 }, { id: 7 }, { id: 9 }, null])).toEqual({
      message_group_ids: '9,7',
      limit: 2000,
    });
    expect(buildTraceListParams([])).toBeUndefined();
  });

  it('restores promoted tool-call ownership when attrs are sparse', () => {
    const step = traceRowToStep({
      id: 43,
      message_group_id: 7,
      kind: 'tool_call',
      tool_name: 'read_file',
      parent_agent_name: 'Name Resolver',
      parent_agent_call_id: 'leaf-1',
      attrs: {},
    });

    expect(step).toMatchObject({
      parent_agent_name: 'Name Resolver',
      parent_agent_call_id: 'leaf-1',
      _traceMessageGroupId: 7,
    });
  });
});

describe('pipeline HITL history conversion', () => {
  const promptItem = {
    id: 11,
    item_type: 'text_message',
    item_details: { content: 'Review this joke' },
    meta: { kind: 'pipeline_hitl_prompt', interrupt_id: 'hitl-1' },
  };
  const answerItem = {
    id: 12,
    item_type: 'text_message',
    item_details: { content: 'Earlier assistant output' },
    meta: {},
  };
  const baseGroup = {
    id: 2,
    uuid: 'assistant-1',
    author_participant_id: 20,
    reply_to_id: 1,
    content: '',
    message_items: [promptItem, answerItem],
    created_at: '2026-08-27 10:00:00',
    updated_at: '2026-08-27 10:00:00',
    is_streaming: false,
    meta: {},
  };
  const question = { id: 1, uuid: 'user-1' };

  it('hides the persisted prompt only while its matching interrupt card is active', () => {
    const active = convertToAIAnswer(
      {
        ...baseGroup,
        meta: {
          hitl_interrupt: {
            interaction_type: 'pipeline_hitl_node',
            history_contract_version: 1,
            interrupt_id: 'hitl-1',
            message: 'Review this joke',
          },
        },
      },
      [question, baseGroup],
      [],
    );

    expect(active.message_items).toEqual([answerItem]);
    expect(active.hitlInterrupt?.interrupt_id).toBe('hitl-1');

    const resolved = convertToAIAnswer(baseGroup, [question, baseGroup], []);
    expect(resolved.message_items).toEqual([promptItem, answerItem]);
    expect(resolved.hitlInterrupt).toBeUndefined();
  });
});

describe('continuation error history conversion', () => {
  it('restores the structured error after a conversation reload', () => {
    const question = { id: 1, uuid: 'user-1' };
    const continuationError = {
      code: 'output_continuation_exhausted',
      user_message: 'The model response is incomplete.',
      partial_output: '# Partial response',
      attempts: 4,
    };
    const answer = convertToAIAnswer(
      {
        id: 2,
        uuid: 'assistant-1',
        author_participant_id: 20,
        reply_to_id: 1,
        content: 'The model response is incomplete.',
        message_items: [],
        created_at: '2026-09-01 10:00:00',
        updated_at: '2026-09-01 10:00:00',
        is_streaming: false,
        meta: {
          is_error: true,
          error: 'technical trace',
          continuation_error: continuationError,
        },
      },
      [question],
      [],
    );

    expect(answer.continuationError).toEqual(continuationError);
    expect(answer.exception).toBe('technical trace');
  });
});

describe('imported chat authors', () => {
  const importer = { id: 1, entity_meta: { id: 3 }, meta: { user_name: 'Me', user_avatar: 'me.png' } };
  const group = importedAuthor => ({
    author_participant_id: 1,
    message_items: [],
    created_at: '2026-10-16T00:00:00',
    uuid: 'g1',
    meta: { imported_author: importedAuthor },
  });

  it('shows the avatar of the original author the import resolved', () => {
    const question = convertToUserQuestion(group({ name: 'Jane', avatar: 'jane.png' }), [importer], []);
    expect(question.name).toBe('Jane');
    expect(question.avatar).toBe('jane.png');
  });

  it('shows no avatar for an original author that was not found', () => {
    expect(convertToUserQuestion(group({ name: 'Jane' }), [importer], []).avatar).toBe('');
  });

  it("keeps the importer's avatar on their own messages", () => {
    expect(convertToUserQuestion(group({ name: 'Me', avatar: 'old.png' }), [importer], []).avatar).toBe(
      'me.png',
    );
  });
});

describe('input guardrail history conversion (#6886)', () => {
  it('carries a stored redaction verdict on the user message', () => {
    const verdict = { action: 'redact', categories: ['credentials'], rules: ['github_pat'] };
    const question = convertToUserQuestion(
      {
        author_participant_id: 1,
        message_items: [],
        created_at: '2026-10-20T00:00:00',
        uuid: 'g1',
        meta: { input_guardrail: verdict },
      },
      [],
      [],
    );
    expect(question.inputGuardrail).toEqual(verdict);
  });

  it('carries a refused application run on the assistant message', () => {
    const verdict = {
      action: 'block',
      categories: ['credentials'],
      message_key: 'input_guardrail.blocked.credentials',
    };
    const answer = convertToAIAnswer(
      {
        id: 2,
        uuid: 'assistant-1',
        author_participant_id: 20,
        reply_to_id: 1,
        content: 'It was not sent to the model.',
        message_items: [],
        created_at: '2026-10-20 10:00:00',
        is_streaming: false,
        meta: { is_error: true, error: 'It was not sent to the model.', input_guardrail: verdict },
      },
      [{ id: 1, uuid: 'user-1' }],
      [],
    );
    expect(answer.inputGuardrail).toEqual(verdict);
    expect(answer.exception).toBe('It was not sent to the model.');
  });
});

// #7264 P1: chip durations read only the trace-row stamps, never the message-time fallbacks.
describe('history action duration stamps', () => {
  const group = {
    id: 5,
    uuid: 'assistant-5',
    author_participant_id: 20,
    reply_to_id: 1,
    content: 'done',
    message_items: [],
    created_at: '2026-10-28 10:00:00',
    updated_at: '2026-10-28 10:00:05',
    is_streaming: false,
    meta: {},
  };

  it('carries started_at/finished_at onto tool and LLM actions', () => {
    const answer = convertToAIAnswer(
      group,
      [group],
      [],
      [
        {
          id: 1,
          message_group_id: 5,
          kind: 'thinking_step',
          model_name: 'model',
          started_at: '2026-10-28T10:00:00.100Z',
          finished_at: '2026-10-28T10:00:00.950Z',
          attrs: {},
        },
        {
          id: 2,
          message_group_id: 5,
          kind: 'tool_call',
          tool_name: 'list_issues',
          started_at: '2026-10-28T10:00:01.000Z',
          finished_at: '2026-10-28T10:00:03.400Z',
          attrs: {},
        },
      ],
    );
    const [llm, tool] = answer.toolActions;
    expect(llm).toMatchObject({
      startedAt: '2026-10-28T10:00:00.100Z',
      finishedAt: '2026-10-28T10:00:00.950Z',
    });
    expect(tool).toMatchObject({
      startedAt: '2026-10-28T10:00:01.000Z',
      finishedAt: '2026-10-28T10:00:03.400Z',
    });
  });

  it('leaves the stamps unset for a legacy row without times', () => {
    const answer = convertToAIAnswer(
      group,
      [group],
      [],
      [{ id: 3, message_group_id: 5, kind: 'tool_call', tool_name: 'list_issues', attrs: {} }],
    );
    const [tool] = answer.toolActions;
    expect(tool.created_at).toBeTruthy();
    expect(tool.startedAt).toBeUndefined();
    expect(tool.finishedAt).toBeUndefined();
  });
  it('marks a deferred (approval-paused) row for the tooltip without restoring hitl_deferred', () => {
    const answer = convertToAIAnswer(
      group,
      [group],
      [],
      [
        {
          id: 4,
          message_group_id: 5,
          kind: 'tool_call',
          tool_name: 'Sub',
          attrs: { metadata: { hitl_deferred: true } },
        },
        { id: 6, message_group_id: 5, kind: 'tool_call', tool_name: 'list_issues', attrs: {} },
      ],
    );
    const [deferred, plain] = answer.toolActions;
    expect(deferred.approvalWaited).toBe(true);
    expect(deferred.hitlDeferred).toBeUndefined();
    expect(plain.approvalWaited).toBe(false);
  });
});

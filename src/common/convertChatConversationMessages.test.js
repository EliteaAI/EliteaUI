import { describe, expect, it } from 'vitest';

import { buildTraceListParams, convertToAIAnswer, traceRowToStep } from './convertChatConversationMessages';

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

import { describe, expect, it } from 'vitest';

import {
  buildTraceListParams,
  convertConversationToChatHistory,
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

describe('reloaded index Activity contract', () => {
  const participants = [
    { id: 11, entity_name: 'user', entity_meta: { id: 7 }, meta: { user_name: 'User' } },
    { id: 22, entity_name: 'toolkit', entity_meta: { id: 5 }, meta: {} },
  ];
  const activityGroup = {
    id: 31,
    uuid: '4f135e13-c74a-eef2-4035-bdd9e5224001',
    author_participant_id: 22,
    sent_to_id: null,
    sent_to: null,
    reply_to_id: null,
    task_id: 'index-execution-1',
    created_at: '2026-07-27T10:00:00Z',
    updated_at: '2026-07-27T10:00:02Z',
    is_streaming: false,
    meta: {
      activity_kind: 'indexing',
      context: { included: true, priority: 1, weight: 1 },
      is_error: false,
    },
    message_items: [
      {
        id: 41,
        uuid: '4f135e13-c74a-eef2-4035-bdd9e5224001',
        item_type: 'text_message',
        order_index: 0,
        meta: {},
        item_details: { item_type: 'text_message', content: 'Successfully indexed 10 files.' },
      },
    ],
  };
  const traces = [
    {
      id: 51,
      message_group_id: 31,
      kind: 'tool_call',
      run_id: 'run-1',
      tool_name: 'index_data',
      started_at: '2026-07-27T10:00:00Z',
      finished_at: '2026-07-27T10:00:02Z',
      is_error: false,
      has_visible_content: true,
      attrs: { metadata: { display_name: 'configurations' } },
    },
    {
      id: 52,
      message_group_id: 31,
      kind: 'thinking_step',
      run_id: 'run-1',
      step_type: 'ChatGenerationChunk',
      model_name: 'index-progress-model',
      text: '10 files processed',
      started_at: '2026-07-27T10:00:01Z',
      finished_at: '2026-07-27T10:00:01Z',
      is_error: false,
      has_visible_content: true,
      attrs: { response_metadata: { tool_name: 'loader' } },
    },
  ];

  it('renders the exact current conversation DTO as one assistant Activity and no user row', () => {
    const history = convertConversationToChatHistory(
      { message_groups: [activityGroup], participants },
      traces,
    );

    expect(history).toHaveLength(1);
    expect(history.filter(message => message.role === 'user')).toHaveLength(0);
    expect(history[0]).toMatchObject({
      id: activityGroup.uuid,
      role: 'assistant',
      participant_id: 22,
      task_id: 'index-execution-1',
      isStreaming: false,
    });
    expect(history[0].message_items[0].item_details.content).toBe(
      'Successfully indexed 10 files.',
    );
    expect(history[0].toolActions).toHaveLength(2);
    expect(history[0].toolActions[1]).toMatchObject({
      type: 'llm',
      name: 'loader',
      traceStepId: 52,
      toolMeta: { ls_model_name: 'index-progress-model' },
    });
  });

  it('does not reclassify ordinary orphan toolkit or user-authored groups', () => {
    const ordinaryToolkit = {
      ...activityGroup,
      uuid: '4f135e13-c74a-eef2-4035-bdd9e5224002',
      task_id: null,
      meta: { context: { included: true } },
    };
    const userAuthored = {
      ...activityGroup,
      uuid: '4f135e13-c74a-eef2-4035-bdd9e5224003',
      author_participant_id: 11,
    };
    const history = convertConversationToChatHistory(
      { message_groups: [ordinaryToolkit, userAuthored], participants },
      [],
    );

    expect(history.map(message => message.role)).toEqual(['user', 'user']);
  });
});

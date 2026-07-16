import { describe, expect, it } from 'vitest';

import { buildTraceListParams, traceRowToStep } from './convertChatConversationMessages';

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

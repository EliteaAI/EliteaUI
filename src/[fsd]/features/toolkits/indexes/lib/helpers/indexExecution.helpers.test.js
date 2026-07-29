import { describe, expect, it } from 'vitest';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

import {
  ACTIVE_INDEX_CONFLICT_MESSAGE,
  INDEX_EXECUTION_COMPLETED_EVENT,
  INDEX_EXECUTION_FAILED_EVENT,
  INDEX_EXECUTION_NODE_EVENT,
  buildIndexExecutionEventsUrl,
  buildPendingIndexExecutionKey,
  canStartToolkitRun,
  findAuthoritativeActiveIndex,
  parseIndexExecutionEvent,
  parseIndexNodeEvent,
  parseIndexStartConflictTaskId,
  resolveAuthoritativeIndexExecutionTaskId,
  resolveIndexExecutionState,
  resolveIndexExecutionTaskId,
  sameIndexExecution,
} from './indexExecution.helpers';

describe('index execution contract', () => {
  it.each([
    ['ok', IndexStatuses.success, 'Indexed 12 files', '✅ Indexed 12 files'],
    ['partly_indexed', IndexStatuses.partlyOk, 'Indexed 10 of 12 files', '⚠️ Indexed 10 of 12 files'],
    ['error', IndexStatuses.fail, 'Repository access failed', '❌ Repository access failed'],
  ])('maps the %s completion status', (status, state, message, content) => {
    expect(
      parseIndexExecutionEvent(INDEX_EXECUTION_COMPLETED_EVENT, JSON.stringify({ status, message })),
    ).toEqual({ state, content });
  });

  it('maps a safe runtime failure without exposing other fields', () => {
    expect(
      parseIndexExecutionEvent(
        INDEX_EXECUTION_FAILED_EVENT,
        JSON.stringify({
          code: 'WORKER_UNAVAILABLE',
          safe_message: 'The indexing worker is temporarily unavailable.',
          internal_detail: 'must not be rendered',
        }),
      ),
    ).toEqual({
      state: IndexStatuses.fail,
      content: '❌ The indexing worker is temporarily unavailable.',
    });
  });

  it('keeps cancellation distinct from a failed execution', () => {
    expect(
      parseIndexExecutionEvent(
        INDEX_EXECUTION_FAILED_EVENT,
        JSON.stringify({ code: 'CANCELLED', safe_message: 'Indexing was stopped.' }),
      ),
    ).toEqual({
      state: IndexStatuses.cancelled,
      content: '⏹️ Indexing was stopped.',
    });
  });

  it('fails closed on malformed terminal data and ignores unrelated events', () => {
    expect(parseIndexExecutionEvent(INDEX_EXECUTION_COMPLETED_EVENT, '{')).toEqual({
      state: IndexStatuses.fail,
      content: '❌ Indexing returned an invalid terminal response.',
    });
    expect(parseIndexExecutionEvent('execution.progress', '{}')).toBeNull();
  });

  it('builds encoded, project-scoped stream and recovery keys', () => {
    expect(buildIndexExecutionEventsUrl('/api/v2/', '7', 'task/one')).toBe(
      '/api/v2/executions/7/task%2Fone/events',
    );
    expect(buildPendingIndexExecutionKey({ projectId: 7, toolkitId: 9, indexName: 'Docs / Main' })).toBe(
      'elitea:index-execution:7:9:Docs%20%2F%20Main',
    );
  });

  it('keeps a terminal execution result authoritative over stale progress metadata', () => {
    expect(resolveIndexExecutionState(IndexStatuses.progress, IndexStatuses.fail)).toBe(IndexStatuses.fail);
    expect(resolveIndexExecutionState(IndexStatuses.progress, IndexStatuses.cancelled)).toBe(
      IndexStatuses.cancelled,
    );
    expect(resolveIndexExecutionState(IndexStatuses.success, null)).toBe(IndexStatuses.success);
  });

  it('uses the admitted execution task id for control actions', () => {
    expect(resolveIndexExecutionTaskId('metadata-task', 'admitted-task')).toBe('admitted-task');
    expect(resolveIndexExecutionTaskId('metadata-task', null)).toBe('metadata-task');
  });

  it('uses the active server metadata task for Stop ahead of a stale admitted task', () => {
    expect(
      resolveAuthoritativeIndexExecutionTaskId(
        IndexStatuses.progress,
        'metadata-task',
        'stale-admitted-task',
      ),
    ).toBe('metadata-task');
    expect(resolveAuthoritativeIndexExecutionTaskId(IndexStatuses.success, 'old-task', 'admitted-task')).toBe(
      'admitted-task',
    );
  });

  it('selects only exact active server metadata without requiring a conversation', () => {
    const active = {
      id: 9,
      metadata: {
        collection: 'docs',
        state: IndexStatuses.progress,
        task_id: 'task-active',
        conversation_id: null,
      },
    };
    expect(findAuthoritativeActiveIndex([active], 'docs', 'task-active')).toBe(active);
    expect(
      findAuthoritativeActiveIndex(
        [{ ...active, metadata: { ...active.metadata, task_id: 'other-task' } }],
        'docs',
        'task-active',
      ),
    ).toBeNull();
    expect(
      findAuthoritativeActiveIndex(
        [{ ...active, metadata: { ...active.metadata, collection: 'other-index' } }],
        'docs',
        'task-active',
      ),
    ).toBeNull();
    expect(
      findAuthoritativeActiveIndex(
        [{ ...active, metadata: { ...active.metadata, state: IndexStatuses.success } }],
        'docs',
        'task-active',
      ),
    ).toBeNull();
  });

  it('matches terminal guards by task and generation without confusing a new generation', () => {
    expect(sameIndexExecution({ taskId: 'task-1', generation: 3 }, { taskId: 'task-1', generation: 3 })).toBe(
      true,
    );
    expect(sameIndexExecution({ taskId: 'task-1', generation: 3 }, { taskId: 'task-1', generation: 4 })).toBe(
      false,
    );
    expect(
      sameIndexExecution({ taskId: 'task-1', generation: null }, { taskId: 'task-1', generation: 4 }),
    ).toBe(true);
  });

  it('suppresses duplicate index starts while admission or execution is active', () => {
    const ready = {
      indexing: true,
      isCreateIndexMode: false,
      isValidForm: true,
      isRunning: false,
      isIndexing: false,
      indexStartPending: false,
    };

    expect(canStartToolkitRun(ready)).toBe(true);
    expect(canStartToolkitRun({ ...ready, indexStartPending: true })).toBe(false);
    expect(canStartToolkitRun({ ...ready, isIndexing: true })).toBe(false);
    expect(canStartToolkitRun({ ...ready, isRunning: true })).toBe(false);
  });

  it('accepts only the exact current start conflict contract', () => {
    expect(
      parseIndexStartConflictTaskId({
        status: 409,
        data: {
          error: ACTIVE_INDEX_CONFLICT_MESSAGE,
          task_id: '0123456789abcdef0123456789abcdef',
        },
      }),
    ).toBe('0123456789abcdef0123456789abcdef');
  });

  it.each([
    ['generic conflict', { status: 409, data: { error: 'already active' } }],
    [
      'unexpected response field',
      {
        status: 409,
        data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: 'task-1', project_id: 7 },
      },
    ],
    ['missing task id', { status: 409, data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE } }],
    ['blank task id', { status: 409, data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: ' ' } }],
    [
      'control characters',
      { status: 409, data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: 'task\r\n2' } },
    ],
    [
      'oversized task id',
      {
        status: 409,
        data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: 'x'.repeat(513) },
      },
    ],
    [
      'authorization failure',
      {
        status: 403,
        data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: 'task-1' },
      },
    ],
  ])('rejects a %s as reattachment authority', (_, error) => {
    expect(parseIndexStartConflictTaskId(error)).toBeNull();
  });

  describe('NodeEvent execution correlation', () => {
    const event = {
      type: 'agent_index_data_status',
      stream_id: 'stream-1',
      message_id: 'message-1',
      question_id: null,
      content: { state: 'in_progress', indexed: 12 },
      thinking: null,
      response_metadata: {},
      references: [],
      sio_event: 'test_toolkit_tool',
      created_at: '2026-07-22T12:00:00Z',
      parent_message_id: null,
      agent_name: null,
      execution_generation: null,
    };

    it('uses the execution-scoped message id when the NodeEvent omits it', () => {
      const eventWithoutMessageId = { ...event };
      delete eventWithoutMessageId.message_id;

      expect(parseIndexNodeEvent(JSON.stringify(eventWithoutMessageId), 'message-1')).toEqual(event);
    });

    it('preserves a matching NodeEvent message id', () => {
      expect(parseIndexNodeEvent(JSON.stringify(event), 'message-1')).toEqual(event);
    });

    it('rejects a conflicting message id instead of correlating another execution', () => {
      expect(parseIndexNodeEvent(JSON.stringify(event), 'message-2')).toBeNull();
    });

    it('allows one execution-scoped message identity adoption during conflict recovery', () => {
      expect(parseIndexNodeEvent(JSON.stringify(event), 'recovery-placeholder', true)).toEqual(event);
    });

    it('keeps missing-id fallbacks local to each execution', () => {
      const eventWithoutMessageId = { ...event };
      delete eventWithoutMessageId.message_id;
      const data = JSON.stringify(eventWithoutMessageId);

      expect(parseIndexNodeEvent(data, 'execution-one-message')?.message_id).toBe('execution-one-message');
      expect(parseIndexNodeEvent(data, 'execution-two-message')?.message_id).toBe('execution-two-message');
    });

    it('rejects malformed NodeEvents', () => {
      expect(INDEX_EXECUTION_NODE_EVENT).toBe('execution.node_event');
      expect(parseIndexNodeEvent('{', 'message-1')).toBeNull();
      expect(parseIndexNodeEvent('[]', 'message-1')).toBeNull();
      expect(parseIndexNodeEvent('{"content":{}}', 'message-1')).toBeNull();
    });
  });
});

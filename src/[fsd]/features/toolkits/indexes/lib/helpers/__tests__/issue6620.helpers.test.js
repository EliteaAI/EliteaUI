// @vitest-environment jsdom
// Re-breaks if the traced run state is preferred over a freshly read row, or if a failed run's
// indexing report reaches the transcript as raw JSON.
import { describe, expect, it, vi } from 'vitest';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { generateChatMessageBasedOnResponse } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { shouldDropIndexStateOverride } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { SocketMessageType, ToolActionStatus } from '@/common/constants';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const TOOL_RUN_ID = 'tool-run-1';
const REPORT_JSON = JSON.stringify(
  {
    status: 'error',
    message: 'Indexing failed: the loader returned no content',
    report: {
      version: 1,
      status: 'error',
      item_labels: { singular: 'file', plural: 'files' },
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 0 },
      categories: [],
      errors: ['Indexing failed: the loader returned no content'],
      errors_total: 1,
    },
  },
  null,
  2,
);

const streamingMessage = () => ({
  id: 'msg-1',
  role: 'assistant',
  content: '🔄 Testing tool...',
  isStreaming: true,
  task_id: 'task-1',
  toolActions: [
    {
      id: TOOL_RUN_ID,
      name: 'index_data',
      status: ToolActionStatus.processing,
      execution_time_seconds: 1.457,
    },
  ],
});

const feed = (history, message) =>
  generateChatMessageBasedOnResponse({ message, chatHistory: history, onFinish: vi.fn() });

const toolEnd = (finishReason, contentType = 'json') => ({
  message_id: 'msg-1',
  type: SocketMessageType.AgentToolEnd,
  content: REPORT_JSON,
  response_metadata: {
    tool_run_id: TOOL_RUN_ID,
    tool_name: 'index_data',
    finish_reason: finishReason,
    content_type: contentType,
  },
});

const failedRun = () =>
  feed(feed([streamingMessage()], toolEnd('error')), {
    message_id: 'msg-1',
    type: SocketMessageType.AgentException,
    content: 'Indexing failed: the loader returned no content',
    response_metadata: {},
  })[0];

describe('what a declared failure renders', () => {
  it('renders the indexing report as text, not as a raw JSON blob', () => {
    const body = failedRun().content;

    expect(body).toContain('Failed to index files');
    expect(body).not.toContain('"item_labels"');
  });

  it('leaves a body that is not an indexing report alone', () => {
    const plain = feed([streamingMessage()], {
      message_id: 'msg-1',
      type: SocketMessageType.AgentToolEnd,
      content: 'Connection refused',
      response_metadata: { tool_run_id: TOOL_RUN_ID, finish_reason: 'error', content_type: 'text' },
    })[0];

    expect(plain.content).toBe('Connection refused');
  });

  it("does not turn another toolkit's JSON error into an indexing report", () => {
    const jiraFailure = JSON.stringify({ error: 'Issue not found', state: 'failed' });
    const rendered = feed([streamingMessage()], {
      message_id: 'msg-1',
      type: SocketMessageType.AgentToolEnd,
      content: jiraFailure,
      response_metadata: { tool_run_id: TOOL_RUN_ID, finish_reason: 'error', content_type: 'json' },
    })[0];

    expect(rendered.content).not.toContain('Failed to index');
    expect(rendered.content).toBe(jiraFailure);
  });

  it('still surfaces the failure as an exception', () => {
    expect(failedRun().exception).toBe('Indexing failed: the loader returned no content');
  });

  it('leaves a budget block with no body of its own', () => {
    const blocked = feed([streamingMessage()], {
      message_id: 'msg-1',
      type: SocketMessageType.AgentException,
      content: 'budget',
      response_metadata: { budget_error_code: 'project_budget_exceeded' },
    })[0];

    expect(blocked.content).toBe('');
  });
});

describe('optimistic run state vs the index row', () => {
  const ROW_READ_AFTER_OVERRIDE = true;
  const ROW_NOT_READ_SINCE = false;

  it('drops a traced success once a freshly read row records a failure', () => {
    expect(
      shouldDropIndexStateOverride(IndexStatuses.success, IndexStatuses.fail, ROW_READ_AFTER_OVERRIDE),
    ).toBe(true);
  });

  it('drops a traced failure once a freshly read row records a cancel', () => {
    expect(
      shouldDropIndexStateOverride(IndexStatuses.fail, IndexStatuses.cancelled, ROW_READ_AFTER_OVERRIDE),
    ).toBe(true);
  });

  it('keeps the trace while the row has not been read since the run', () => {
    expect(shouldDropIndexStateOverride(IndexStatuses.fail, IndexStatuses.success, ROW_NOT_READ_SINCE)).toBe(
      false,
    );
    expect(shouldDropIndexStateOverride(IndexStatuses.success, IndexStatuses.fail, ROW_NOT_READ_SINCE)).toBe(
      false,
    );
    expect(
      shouldDropIndexStateOverride(IndexStatuses.cancelled, IndexStatuses.success, ROW_NOT_READ_SINCE),
    ).toBe(false);
  });

  it('drops the trace once the row agrees with it, however stale the read', () => {
    expect(
      shouldDropIndexStateOverride(IndexStatuses.progress, IndexStatuses.progress, ROW_NOT_READ_SINCE),
    ).toBe(true);
  });

  it('keeps a traced in-progress run whatever the row says', () => {
    expect(
      shouldDropIndexStateOverride(IndexStatuses.progress, IndexStatuses.success, ROW_READ_AFTER_OVERRIDE),
    ).toBe(false);
    expect(
      shouldDropIndexStateOverride(IndexStatuses.progress, IndexStatuses.fail, ROW_READ_AFTER_OVERRIDE),
    ).toBe(false);
  });

  it('keeps a terminal trace while the row is still mid-run', () => {
    expect(
      shouldDropIndexStateOverride(IndexStatuses.success, IndexStatuses.progress, ROW_READ_AFTER_OVERRIDE),
    ).toBe(false);
  });

  it('has nothing to drop when either side is missing', () => {
    expect(shouldDropIndexStateOverride(undefined, IndexStatuses.fail, ROW_READ_AFTER_OVERRIDE)).toBe(false);
    expect(shouldDropIndexStateOverride(IndexStatuses.success, undefined, ROW_READ_AFTER_OVERRIDE)).toBe(
      false,
    );
  });
});

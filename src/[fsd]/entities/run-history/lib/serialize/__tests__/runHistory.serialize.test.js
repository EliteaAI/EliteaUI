import { describe, expect, it } from 'vitest';

import { serializeRunHistoryListResponse } from '../runHistory.serialize';

const agentRun = {
  id: 1,
  created_at: '2026-08-14T10:00:00Z',
  name: 'run',
  duration: 12,
  meta: { single_participant: { entity_settings: { version_id: 5 } } },
};

const indexRun = {
  id: 2,
  created_at: '2026-08-14T11:00:00Z',
  name: 'Toolkit conversation: 56',
  duration: 4,
  meta: {
    index_name: 'confluence_space',
    operation_type: 'index_data',
  },
};

describe('serializeRunHistory — index run details', () => {
  it('defaults the detail fields for rows that never carried them', () => {
    const { rows } = serializeRunHistoryListResponse([agentRun]);

    expect(rows[0].index_name).toBeNull();
    expect(rows[0].operation_type).toBeNull();
  });

  it('passes the index run identity through', () => {
    const { rows } = serializeRunHistoryListResponse([indexRun]);

    expect(rows[0].index_name).toBe('confluence_space');
    expect(rows[0].operation_type).toBe('index_data');
  });

  it('keeps the fields every row already carried', () => {
    const { rows } = serializeRunHistoryListResponse({ rows: [agentRun, indexRun], total: 2 });

    expect(rows.map(row => row.id)).toEqual([1, 2]);
    expect(rows[0].version_id).toBe(5);
    expect(rows[1].duration).toBe(4);
  });
});

describe('serializeRunHistory — skill chat runs', () => {
  const skillChatRun = {
    id: 3,
    created_at: '2026-10-26T16:36:00Z',
    name: 'chat',
    duration: 9,
    is_chat_run: true,
    skill_version_id: 88,
    meta: {},
  };
  const skillRunPanelRun = {
    id: 4,
    created_at: '2026-10-26T15:00:00Z',
    name: 'run',
    duration: 3,
    meta: {
      single_participant: {
        entity_name: 'skill',
        entity_meta: { id: 629, project_id: 2 },
        entity_settings: { version_id: 732 },
      },
    },
  };

  it('marks a row a chat run only when the server says so', () => {
    const { rows } = serializeRunHistoryListResponse([skillChatRun, skillRunPanelRun, indexRun]);

    expect(rows.map(row => row.is_chat_run)).toEqual([true, false, false]);
  });

  it('reads the version of a chat run from the run itself', () => {
    const { rows } = serializeRunHistoryListResponse([skillChatRun]);

    expect(rows[0].version_id).toBe(88);
  });

  it('dates a chat run by when the skill first ran in the chat', () => {
    const { rows } = serializeRunHistoryListResponse([
      { ...skillChatRun, created_at: '2026-10-19T09:00:00Z', run_started_at: '2026-10-26T16:36:00Z' },
    ]);

    expect(rows[0].created_at).toBe('2026-10-26T16:36:00Z');
  });

  it('reads the version of the skill own run even inside another entity Run panel', () => {
    const agentRunPanelChat = {
      ...skillChatRun,
      meta: {
        single_participant: {
          entity_name: 'application',
          entity_meta: { id: 111, project_id: 2 },
          entity_settings: { version_id: 40 },
        },
      },
    };
    const { rows } = serializeRunHistoryListResponse([agentRunPanelChat]);

    expect(rows[0].version_id).toBe(88);
  });

  it('keeps the skill own Run panel run a Run panel run', () => {
    const { rows } = serializeRunHistoryListResponse([skillRunPanelRun]);

    expect(rows[0].is_chat_run).toBe(false);
    expect(rows[0].version_id).toBe(732);
    expect(rows[0].created_at).toBe(skillRunPanelRun.created_at);
  });

  it('lists a row that has no meta instead of failing the whole history', () => {
    const { rows } = serializeRunHistoryListResponse([{ ...skillRunPanelRun, meta: null }, skillChatRun]);

    expect(rows.map(row => [row.id, row.version_id])).toEqual([
      [4, null],
      [3, 88],
    ]);
  });
});

describe('serializeRunHistory — execution type', () => {
  it('keeps the top-level execution_type on the row', () => {
    const { rows } = serializeRunHistoryListResponse([{ ...agentRun, execution_type: 'schedule' }]);

    expect(rows[0].execution_type).toBe('schedule');
  });

  it('defaults execution_type to null when the server omits it', () => {
    const { rows } = serializeRunHistoryListResponse([agentRun]);

    expect(rows[0].execution_type).toBeNull();
  });
});

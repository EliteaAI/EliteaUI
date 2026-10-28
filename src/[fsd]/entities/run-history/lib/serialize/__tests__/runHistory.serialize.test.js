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
  const SKILL_HISTORY = { source: 'skill', entityId: '629' };
  const skillChatRun = {
    id: 3,
    created_at: '2026-10-26T16:36:00Z',
    name: 'chat',
    duration: 9,
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

  it('reads the version of a chat run from the run itself', () => {
    const { rows } = serializeRunHistoryListResponse([skillChatRun], false, SKILL_HISTORY);

    expect(rows[0].version_id).toBe(88);
    expect(rows[0].is_chat_run).toBe(true);
  });

  it('dates a chat run by when the skill first ran in the chat', () => {
    const { rows } = serializeRunHistoryListResponse(
      [{ ...skillChatRun, created_at: '2026-10-19T09:00:00Z', run_started_at: '2026-10-26T16:36:00Z' }],
      false,
      SKILL_HISTORY,
    );

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
    const { rows } = serializeRunHistoryListResponse([agentRunPanelChat], false, SKILL_HISTORY);

    expect(rows[0].version_id).toBe(88);
  });

  it('tells a catalog skill from a local skill with the same id', () => {
    const localRunPanelRun = skillRunPanelRun;

    const catalogRows = serializeRunHistoryListResponse([localRunPanelRun], false, {
      ...SKILL_HISTORY,
      entityProjectId: 5,
    }).rows;
    const localRows = serializeRunHistoryListResponse([localRunPanelRun], false, {
      ...SKILL_HISTORY,
      entityProjectId: 2,
    }).rows;

    expect(catalogRows[0].is_chat_run).toBe(true);
    expect(localRows[0].is_chat_run).toBe(false);
  });

  it('keeps the skill own Run panel run a Run panel run', () => {
    const { rows } = serializeRunHistoryListResponse([skillRunPanelRun], false, SKILL_HISTORY);

    expect(rows[0].is_chat_run).toBe(false);
    expect(rows[0].version_id).toBe(732);
    expect(rows[0].created_at).toBe(skillRunPanelRun.created_at);
  });

  it('never marks a toolkit history row as a chat run, even one without a Run panel pin', () => {
    const { rows } = serializeRunHistoryListResponse([indexRun, agentRun], false, {
      source: 'toolkit',
      entityId: '56',
    });

    expect(rows.map(row => row.is_chat_run)).toEqual([false, false]);
  });

  it('never marks a row as a chat run outside a skill history', () => {
    const { rows } = serializeRunHistoryListResponse([skillChatRun, agentRun]);

    expect(rows.map(row => row.is_chat_run)).toEqual([false, false]);
    expect(rows[1].version_id).toBe(5);
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

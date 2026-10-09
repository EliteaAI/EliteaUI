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

const skillChatRun = {
  id: 3,
  created_at: '2026-10-08T17:44:07',
  name: 'Team chat',
  duration: 9,
  source: 'elitea',
  message_groups_count: 8,
  meta: {},
  run_summary: {
    version_id: 276,
    status: 'error',
    author: { id: 3, name: 'Admin', email: 'admin@centry.user' },
    models: ['opus'],
    tokens: 203,
    cost: 0.0023,
    last_run_id: 'run-1',
    usage_available: true,
  },
};

describe('serializeRunHistory — skill run summary', () => {
  it('reads the version from the run summary, since a chat the skill joined has no single participant', () => {
    const { rows } = serializeRunHistoryListResponse({ rows: [skillChatRun], total: 1 });

    expect(rows[0].version_id).toBe(276);
  });

  it('carries the run columns a skill history shows', () => {
    const { rows } = serializeRunHistoryListResponse({ rows: [skillChatRun], total: 1 });

    expect(rows[0]).toMatchObject({
      source: 'elitea',
      message_count: 8,
      status: 'error',
      author: { id: 3, name: 'Admin', email: 'admin@centry.user' },
      models: ['opus'],
      tokens: 203,
      cost: 0.0023,
      last_run_id: 'run-1',
      usage_available: true,
    });
  });

  it('keeps unknown usage empty rather than zero', () => {
    const unknownUsage = {
      ...skillChatRun,
      run_summary: {
        ...skillChatRun.run_summary,
        models: null,
        tokens: null,
        cost: null,
        usage_available: false,
      },
    };

    const { rows } = serializeRunHistoryListResponse({ rows: [unknownUsage], total: 1 });

    expect(rows[0]).toMatchObject({ models: null, tokens: null, cost: null, usage_available: false });
  });

  it('adds nothing to rows of other histories', () => {
    const { rows } = serializeRunHistoryListResponse({
      rows: [{ ...agentRun, run_summary: null }],
      total: 1,
    });

    expect(Object.keys(rows[0]).sort()).toEqual(
      [
        'created_at',
        'duration',
        'id',
        'index_name',
        'name',
        'operation_type',
        'updated_at',
        'version_id',
      ].sort(),
    );
  });

  it('passes the filter facets through', () => {
    const facets = { authors: [{ id: 3 }], models: ['opus'] };

    expect(serializeRunHistoryListResponse({ rows: [], total: 0, facets }).facets).toBe(facets);
    expect(serializeRunHistoryListResponse({ rows: [], total: 0 })).not.toHaveProperty('facets');
  });
});

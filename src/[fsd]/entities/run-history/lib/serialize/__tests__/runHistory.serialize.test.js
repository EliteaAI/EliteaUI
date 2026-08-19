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

import { describe, expect, it } from 'vitest';

import {
  buildIndexHistoryRows,
  indexHistoryRowId,
  resolveIndexRunDuration,
} from '../indexHistoryRow.helpers';

const build = history => buildIndexHistoryRows(history, 200);

describe('buildIndexHistoryRows', () => {
  it('derives a duration from the run boundaries', () => {
    const [row] = build([{ state: 'completed', created_on: 196.891, updated_on: 200 }]);

    expect(row.duration).toBe(3.11);
    expect(row.event_label).toBe('Indexed');
    expect(row.created_at).toBe(200);
  });

  it('prefers the server-side duration a Run Test row carries', () => {
    const [row] = build([
      {
        state: 'run_test',
        updated_on: 400,
        conversation_id: 9,
        duration: 12.5,
        operation_type: 'stepback_search_index',
      },
    ]);

    expect(row.duration).toBe(12.5);
    expect(row.event_label).toBe('Stepback Search Index');
  });

  it('reports no duration when the run boundaries cannot bound one', () => {
    const rows = build([
      { state: 'run_test', updated_on: 400, conversation_id: 9 },
      { state: 'completed', created_on: 200, updated_on: 200 },
      { state: 'failed', updated_on: 300 },
    ]);

    expect(rows.map(row => row.duration)).toEqual([null, null, null]);
  });

  it('shows the first indexing run under its Created label with its real duration', () => {
    const [row] = build([{ state: 'created', created_on: 150, updated_on: 200 }]);

    expect(row.event_label).toBe('Created');
    expect(row.duration).toBe(50);
  });

  it('separates a reindex from the initial run', () => {
    const rows = build([
      { state: 'completed', created_on: 190, updated_on: 200 },
      { state: 'completed', created_on: 290, updated_on: 300 },
    ]);

    expect(rows.map(row => row.event_label)).toEqual(['Indexed', 'Reindexed']);
  });

  it('keeps the unlabelled in-progress placeholders out of the list', () => {
    const rows = build([
      { state: 'in_progress', created_on: 100, updated_on: 100 },
      { state: 'completed', created_on: 190, updated_on: 200 },
      { state: 'unknown_state', updated_on: 300 },
      { state: 'failed' },
      null,
    ]);

    expect(rows.map(row => row.event_label)).toEqual(['Indexed']);
  });

  it('leaves the run actions to the surfaces that own a conversation', () => {
    const rows = build([{ state: 'completed', created_on: 190, updated_on: 200, conversation_id: 9 }]);

    expect(rows[0].hasConversation).toBe(false);
  });

  it('survives an index that has no history yet', () => {
    expect(build(undefined)).toEqual([]);
    expect(build([])).toEqual([]);
  });
});

describe('resolveIndexRunDuration', () => {
  it('refuses a blank boundary rather than measuring from the epoch', () => {
    expect(resolveIndexRunDuration({ created_on: null, updated_on: 1786973660 })).toBeNull();
    expect(resolveIndexRunDuration({ created_on: '', updated_on: 1786973660 })).toBeNull();
    expect(resolveIndexRunDuration({ created_on: false, updated_on: 1786973660 })).toBeNull();
    expect(resolveIndexRunDuration({ updated_on: 1786973660 })).toBeNull();
  });

  it('refuses a boundary it cannot read as a number', () => {
    expect(resolveIndexRunDuration({ created_on: '190', updated_on: 200 })).toBeNull();
    expect(resolveIndexRunDuration({ created_on: 190, updated_on: null })).toBeNull();
  });

  it('rounds the raw epoch floats to the precision conversation rows arrive at', () => {
    expect(resolveIndexRunDuration({ created_on: 196.891, updated_on: 200 })).toBe(3.11);
  });
});

describe('indexHistoryRowId', () => {
  it('distinguishes runs that share a timestamp', () => {
    expect(indexHistoryRowId({ updated_on: 200, conversation_id: 9 })).not.toBe(
      indexHistoryRowId({ updated_on: 200, conversation_id: 10 }),
    );
  });

  it('falls back to the state when a run produced no conversation', () => {
    expect(indexHistoryRowId({ updated_on: 200, state: 'scheduled_reindex' })).toBe('200_scheduled_reindex');
    expect(indexHistoryRowId({ updated_on: 200, conversation_id: null, state: 'failed' })).toBe('200_failed');
  });

  it('matches a row back to the entry the store holds', () => {
    const entry = { state: 'completed', created_on: 190, updated_on: 200, conversation_id: 9 };
    const [row] = build([entry]);

    expect(indexHistoryRowId(entry)).toBe(row.id);
  });

  it('matches a conversationless row back to the entry the store holds', () => {
    const entry = { state: 'scheduled_reindex', created_on: 190, updated_on: 200 };
    const [row] = build([entry]);

    expect(indexHistoryRowId(entry)).toBe(row.id);
  });
});

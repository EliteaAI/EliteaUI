import { describe, expect, it } from 'vitest';

import { buildRunHistoryRowDecorator } from '../indexRunRow.helpers';

const run = (state, updated_on, over = {}) => ({
  entry: { state, updated_on },
  indexName: 'docs',
  initialCompletedTs: 200,
  ...over,
});

const decorate = (row, lookupEntries = [], options = {}) =>
  buildRunHistoryRowDecorator({ lookup: new Map(lookupEntries), ...options })(row);

describe('buildRunHistoryRowDecorator — joined rows', () => {
  it('labels a run without adopting its entry — the transcript is the view', () => {
    const decorated = decorate({ id: 7 }, [[7, [run('completed', 200)]]]);

    expect(decorated.entry).toBeUndefined();
    expect(decorated.event_label).toBe('Indexed');
    expect(decorated.event_tooltip).toBe('Indexed — docs');
  });

  it('counts the runs a conversation carries but sorts by the bare label', () => {
    const decorated = decorate({ id: 7 }, [
      [7, [run('completed', 200), run('completed', 300), run('failed', 400)]],
    ]);

    expect(decorated.event_label).toBe('Failed (3 runs)');
    expect(decorated.event_sort).toBe('Failed');
  });

  it('names the index of the last run when a conversation spans two', () => {
    const decorated = decorate({ id: 7 }, [
      [7, [run('completed', 200), run('completed', 300, { indexName: 'code' })]],
    ]);

    expect(decorated.event_tooltip).toBe('Reindexed (2 runs) — code');
  });

  it('leaves the serialized row fields untouched', () => {
    const decorated = decorate({ id: 7, index_name: 'original', name: 'row name' }, [
      [7, [run('completed', 300, { indexName: 'code' })]],
    ]);

    expect(decorated.index_name).toBe('original');
    expect(decorated.name).toBe('row name');
  });
});

describe('buildRunHistoryRowDecorator — rows with no index run', () => {
  it('labels them by the tool they ran', () => {
    expect(decorate({ id: 1, operation_type: 'get_issues' }).event_label).toBe('Get issues');
    expect(decorate({ id: 1, operation_type: null }).event_label).toBeNull();
  });

  it("hedges the tooltip — the stamp is only the conversation's first tool", () => {
    expect(decorate({ id: 1, operation_type: 'get_issues' }).event_tooltip).toBe('Started with Get issues');
    expect(decorate({ id: 1, operation_type: null }).event_tooltip).toBeUndefined();
  });

  it('tolerates a missing lookup', () => {
    const decorated = buildRunHistoryRowDecorator({ lookup: null })({ id: 1, operation_type: 'read_file' });

    expect(decorated.event_label).toBe('Read file');
  });
});

describe('buildRunHistoryRowDecorator — lookup still loading', () => {
  it('holds the label of a row that may yet join a run instead of guessing from its tool', () => {
    const row = { id: 9, index_name: 'docs', operation_type: 'index_data' };
    const loading = decorate(row, [], { isLookupReady: false });

    expect(loading.event_label).toBeNull();
    expect(loading.event_tooltip).toBeUndefined();
  });

  it('labels rows that cannot join a run without waiting', () => {
    const row = { id: 1, operation_type: 'get_issues' };

    expect(decorate(row, [], { isLookupReady: false }).event_label).toBe('Get issues');
  });
});

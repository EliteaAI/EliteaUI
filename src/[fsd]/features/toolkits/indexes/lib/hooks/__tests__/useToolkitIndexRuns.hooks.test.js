import { describe, expect, it, vi } from 'vitest';

import { buildIndexRunLookup } from '../useToolkitIndexRuns.hooks';

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  useGetIndexesListQuery: vi.fn(),
}));

const entry = (state, over = {}) => ({
  state,
  conversation_id: null,
  created_on: 100,
  updated_on: 200,
  ...over,
});

const indexOf = (collection, history) => ({ metadata: { collection, history } });

describe('buildIndexRunLookup', () => {
  it('joins terminal conversation-backed runs by conversation id', () => {
    const report = '{"version": 1, "status": "ok"}';
    const lookup = buildIndexRunLookup([
      indexOf('docs', [entry('completed', { conversation_id: 876, report })]),
    ]);

    expect(lookup.get(876)).toEqual([
      {
        entry: entry('completed', { conversation_id: 876, report }),
        indexName: 'docs',
        initialCompletedTs: 200,
      },
    ]);
  });

  it('keeps every run of a conversation that produced several', () => {
    const lookup = buildIndexRunLookup([
      indexOf('docs', [
        entry('completed', { conversation_id: 9, updated_on: 200 }),
        entry('completed', { conversation_id: 9, updated_on: 300 }),
        entry('failed', { conversation_id: 9, updated_on: 400 }),
      ]),
    ]);

    expect(lookup.get(9).map(run => run.entry.updated_on)).toEqual([200, 300, 400]);
  });

  it('exposes what the shared label rule needs to tell a reindex from the first run', () => {
    const lookup = buildIndexRunLookup([
      indexOf('docs', [
        entry('completed', { conversation_id: 1, updated_on: 300 }),
        entry('completed', { conversation_id: 2, updated_on: 200 }),
      ]),
    ]);

    expect(lookup.get(1)[0].initialCompletedTs).toBe(200);
    expect(lookup.get(2)[0].initialCompletedTs).toBe(200);
  });

  it("orders a conversation's runs by time, not by which index listed them first", () => {
    const lookup = buildIndexRunLookup([
      indexOf('docs', [entry('completed', { conversation_id: 9, updated_on: 200 })]),
      indexOf('code', [entry('completed', { conversation_id: 9, updated_on: 100 })]),
    ]);

    expect(lookup.get(9).map(run => run.indexName)).toEqual(['code', 'docs']);
  });

  it('skips runs without a conversation and non-terminal runs', () => {
    const lookup = buildIndexRunLookup([
      indexOf('docs', [
        entry('completed'),
        entry('in_progress', { conversation_id: 5 }),
        entry('created', { conversation_id: 6 }),
      ]),
    ]);

    expect(lookup.size).toBe(0);
  });

  it('joins a reclaimed interrupted run so the Event column can name its outcome', () => {
    const lookup = buildIndexRunLookup([indexOf('docs', [entry('interrupted', { conversation_id: 7 })])]);

    expect(lookup.get(7)).toHaveLength(1);
    expect(lookup.get(7)[0].indexName).toBe('docs');
  });

  it('scopes the first-run heuristic to each index', () => {
    const lookup = buildIndexRunLookup([
      indexOf('docs', [entry('completed', { conversation_id: 1, updated_on: 900 })]),
      indexOf('code', [
        entry('completed', { conversation_id: 2, updated_on: 100 }),
        entry('completed', { conversation_id: 3, updated_on: 300 }),
      ]),
    ]);

    expect(lookup.get(1)[0].initialCompletedTs).toBe(900);
    expect(lookup.get(2)[0].initialCompletedTs).toBe(100);
    expect(lookup.get(3)[0].indexName).toBe('code');
  });

  it('tolerates malformed input', () => {
    expect(buildIndexRunLookup(null).size).toBe(0);
    expect(buildIndexRunLookup([{}, indexOf('x', 'not-an-array'), { metadata: {} }]).size).toBe(0);
  });
});

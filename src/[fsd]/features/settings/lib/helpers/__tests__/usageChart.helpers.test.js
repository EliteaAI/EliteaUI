import { describe, expect, it } from 'vitest';

import * as UsageHelpers from '../usage.helpers.js';

// ─── buildGroups ─────────────────────────────────────────────────────────────

describe('buildGroups', () => {
  const sources = [
    { source: 'agents', spend: 72.3 },
    { source: 'chat', spend: 34.6 },
    { source: 'pipelines', spend: 19.4 },
    { source: 'indexing', spend: 9.8 },
    { source: 'skills', spend: 4.57 },
    { source: 'external', spend: 2.2 },
  ];

  it('returns all items when max is Infinity, so external is never collapsed', () => {
    const groups = UsageHelpers.buildGroups(sources, 'source', 'spend', Infinity);

    expect(groups.map(g => g.key)).toEqual(['agents', 'chat', 'pipelines', 'indexing', 'skills', 'external']);
    expect(groups.find(g => g.key === '__other')).toBeUndefined();
  });

  it('caps to the default 5 and bundles the rest into __other', () => {
    const groups = UsageHelpers.buildGroups(sources, 'source', 'spend');

    expect(groups).toHaveLength(6); // 5 top + __other
    expect(groups[5].key).toBe('__other');
    expect(groups[5].w).toBeCloseTo(2.2);
  });

  it('respects an explicit numeric max', () => {
    const groups = UsageHelpers.buildGroups(sources, 'source', 'spend', 3);

    expect(groups).toHaveLength(4); // 3 top + __other
    const otherW = groups.find(g => g.key === '__other').w;

    // Top 3: agents(72.3), chat(34.6), pipelines(19.4) — rest: indexing + skills + external
    expect(otherW).toBeCloseTo(9.8 + 4.57 + 2.2);
  });

  it('sorts items by weight descending before slicing', () => {
    const groups = UsageHelpers.buildGroups(sources, 'source', 'spend', Infinity);

    expect(groups[0].key).toBe('agents');
    expect(groups[groups.length - 1].key).toBe('external');
  });

  it('returns an empty array for empty input', () => {
    expect(UsageHelpers.buildGroups([], 'source', 'spend')).toEqual([]);
    expect(UsageHelpers.buildGroups(null, 'source', 'spend')).toEqual([]);
  });

  it('does not append __other when all items fit within the max', () => {
    const two = sources.slice(0, 2);
    const groups = UsageHelpers.buildGroups(two, 'source', 'spend');

    expect(groups.find(g => g.key === '__other')).toBeUndefined();
  });

  it('returns empty when every item has zero weight', () => {
    const zeroes = sources.map(s => ({ ...s, spend: 0 }));
    const groups = UsageHelpers.buildGroups(zeroes, 'source', 'spend');

    expect(groups).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const copy = [...sources];

    UsageHelpers.buildGroups(sources, 'source', 'spend');
    expect(sources).toEqual(copy);
  });
});

// ─── buildSeriesFromDaily ─────────────────────────────────────────────────────

describe('buildSeriesFromDaily', () => {
  const daily = [
    { date: '2026-10-01', spend: 10, total_tokens: 1000 },
    { date: '2026-10-02', spend: 20, total_tokens: 2000 },
  ];

  const models = [
    { model: 'gpt-4o', spend: 18, total_tokens: 1800 },
    { model: 'claude-3', spend: 12, total_tokens: 1200 },
  ];

  const bySource = [
    { source: 'agents', spend: 20, total_tokens: 2000 },
    { source: 'chat', spend: 10, total_tokens: 1000 },
  ];

  it('returns { data: [], keys: [] } for empty daily', () => {
    const result = UsageHelpers.buildSeriesFromDaily([], 'model', models, bySource, 'spend');

    expect(result).toEqual({ data: [], keys: [] });
  });

  it('groups by total when groupBy is "total"', () => {
    const { data, keys } = UsageHelpers.buildSeriesFromDaily(daily, 'total', models, bySource, 'spend');

    expect(keys).toEqual(['total']);
    expect(data[0].total).toBe(10);
    expect(data[1].total).toBe(20);
  });

  it('distributes spend proportionally across models when groupBy is "model"', () => {
    const { data, keys } = UsageHelpers.buildSeriesFromDaily(daily, 'model', models, bySource, 'spend');

    // gpt-4o has 18/(18+12) = 60% weight
    expect(keys).toEqual(['gpt-4o', 'claude-3']);
    expect(data[0]['gpt-4o']).toBeCloseTo(6); // 10 * 0.6
    expect(data[0]['claude-3']).toBeCloseTo(4); // 10 * 0.4
  });

  it('distributes spend proportionally across sources when groupBy is "source"', () => {
    const { data, keys } = UsageHelpers.buildSeriesFromDaily(daily, 'source', models, bySource, 'spend');

    // agents has 20/(20+10) = 66.67% weight
    expect(keys).toEqual(['agents', 'chat']);
    expect(data[0]['agents']).toBeCloseTo(6.667, 2);
    expect(data[0]['chat']).toBeCloseTo(3.333, 2);
  });

  it('includes all source keys when bySource has 6 entries (external is not collapsed)', () => {
    const sixSources = [
      { source: 'agents', spend: 72 },
      { source: 'chat', spend: 34 },
      { source: 'pipelines', spend: 19 },
      { source: 'indexing', spend: 9 },
      { source: 'skills', spend: 4 },
      { source: 'external', spend: 2 },
    ];
    const { keys } = UsageHelpers.buildSeriesFromDaily(daily, 'source', models, sixSources, 'spend');

    expect(keys).toContain('external');
    expect(keys).not.toContain('__other');
  });

  it('falls back to total for an unknown groupBy value', () => {
    const { keys } = UsageHelpers.buildSeriesFromDaily(daily, 'member', models, bySource, 'spend');

    expect(keys).toEqual(['total']);
  });

  it('falls back to total when models list is empty for groupBy "model"', () => {
    const { keys } = UsageHelpers.buildSeriesFromDaily(daily, 'model', [], bySource, 'spend');

    expect(keys).toEqual(['total']);
  });

  it('uses total_tokens as metricKey when canSeeAmounts is false', () => {
    const { data } = UsageHelpers.buildSeriesFromDaily(daily, 'total', models, bySource, 'total_tokens');

    expect(data[0].total).toBe(1000);
    expect(data[1].total).toBe(2000);
  });
});

// ─── splitDailyByGroup / dailyBreakdownKey ────────────────────────────────────

describe('dailyBreakdownKey', () => {
  it('maps spend → by_model for model dimension', () => {
    expect(UsageHelpers.dailyBreakdownKey('model', 'spend')).toBe('by_model');
  });

  it('maps total_tokens → by_model_tokens for model dimension', () => {
    expect(UsageHelpers.dailyBreakdownKey('model', 'total_tokens')).toBe('by_model_tokens');
  });

  it('maps spend → by_source for source dimension', () => {
    expect(UsageHelpers.dailyBreakdownKey('source', 'spend')).toBe('by_source');
  });

  it('maps total_tokens → by_source_tokens for source dimension', () => {
    expect(UsageHelpers.dailyBreakdownKey('source', 'total_tokens')).toBe('by_source_tokens');
  });
});

describe('splitDailyByGroup', () => {
  const groups = [
    { key: 'gpt-4o', w: 18 },
    { key: 'claude-3', w: 12 },
  ];

  const daily = [
    { date: '2026-10-01', spend: 10, by_model: { 'gpt-4o': 8, 'claude-3': 2 } },
    { date: '2026-10-02', spend: 20, by_model: { 'gpt-4o': 5, 'claude-3': 15 } },
  ];

  it('reads each day from its own breakdown, not the month share', () => {
    const rows = UsageHelpers.splitDailyByGroup(daily, groups, 'by_model', 'spend');

    expect(rows[0]['gpt-4o']).toBe(8);
    expect(rows[0]['claude-3']).toBe(2);
    expect(rows[1]['gpt-4o']).toBe(5);
    expect(rows[1]['claude-3']).toBe(15);
  });

  it('preserves the date key', () => {
    const rows = UsageHelpers.splitDailyByGroup(daily, groups, 'by_model', 'spend');

    expect(rows[0].date).toBe('2026-10-01');
  });

  it('puts the remainder into __other when that group is present', () => {
    const groupsWithOther = [...groups, { key: '__other', w: 0 }];
    const rows = UsageHelpers.splitDailyByGroup(daily, groupsWithOther, 'by_model', 'spend');

    // day 0: spend=10, named=8+2=10, other=0
    expect(rows[0].__other).toBe(0);
    // day 1: spend=20, named=5+15=20, other=0
    expect(rows[1].__other).toBe(0);
  });

  it('other is non-negative even when breakdown exceeds day total', () => {
    const over = [{ date: '2026-10-01', spend: 5, by_model: { 'gpt-4o': 4, 'claude-3': 3 } }];
    const groupsWithOther = [...groups, { key: '__other', w: 0 }];
    const rows = UsageHelpers.splitDailyByGroup(over, groupsWithOther, 'by_model', 'spend');

    expect(rows[0].__other).toBe(0);
  });

  it('returns zero for a key absent from breakdown', () => {
    const sparse = [{ date: '2026-10-01', spend: 10, by_model: { 'gpt-4o': 7 } }];
    const rows = UsageHelpers.splitDailyByGroup(sparse, groups, 'by_model', 'spend');

    expect(rows[0]['claude-3']).toBe(0);
  });
});

describe('buildSeriesFromDaily — real breakdown path', () => {
  const daily = [
    { date: '2026-10-01', spend: 10, by_model: { 'gpt-4o': 8, 'claude-3': 2 } },
    { date: '2026-10-02', spend: 20, by_model: { 'gpt-4o': 5, 'claude-3': 15 } },
  ];
  const models = [
    { model: 'gpt-4o', spend: 18 },
    { model: 'claude-3', spend: 12 },
  ];

  it('uses the real per-day breakdown when by_model is present', () => {
    const { data } = UsageHelpers.buildSeriesFromDaily(daily, 'model', models, [], 'spend');

    // Day 1: gpt-4o=8, not the proportional 10*0.6=6
    expect(data[0]['gpt-4o']).toBe(8);
    expect(data[0]['claude-3']).toBe(2);
    // Day 2: real values, not proportional
    expect(data[1]['gpt-4o']).toBe(5);
    expect(data[1]['claude-3']).toBe(15);
  });

  it('falls back to distributeByWeight when no breakdown fields are present', () => {
    const noBreakdown = [
      { date: '2026-10-01', spend: 10 },
      { date: '2026-10-02', spend: 20 },
    ];
    const { data } = UsageHelpers.buildSeriesFromDaily(noBreakdown, 'model', models, [], 'spend');

    // Falls back to proportional: gpt-4o = 18/30 = 60%
    expect(data[0]['gpt-4o']).toBeCloseTo(6);
  });
});

// ─── distributeByWeight ───────────────────────────────────────────────────────

describe('distributeByWeight', () => {
  it('allocates each day proportionally and preserves the date key', () => {
    const daily = [{ date: '2026-10-01', spend: 30, total_tokens: 3000 }];
    const groups = [
      { key: 'a', w: 60 },
      { key: 'b', w: 40 },
    ];
    const rows = UsageHelpers.distributeByWeight(daily, groups, 'spend');

    expect(rows[0].date).toBe('2026-10-01');
    expect(rows[0].a).toBeCloseTo(18); // 30 * 0.6
    expect(rows[0].b).toBeCloseTo(12); // 30 * 0.4
  });

  it('sums to the day total across all series', () => {
    const daily = [{ date: '2026-10-01', spend: 50 }];
    const groups = [
      { key: 'x', w: 3 },
      { key: 'y', w: 1 },
      { key: 'z', w: 1 },
    ];
    const rows = UsageHelpers.distributeByWeight(daily, groups, 'spend');
    const sum = rows[0].x + rows[0].y + rows[0].z;

    expect(sum).toBeCloseTo(50);
  });
});

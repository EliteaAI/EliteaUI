// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useUsageChartData } from '../useUsageChartData.hooks.js';

afterEach(() => cleanup());

const daily = [
  { date: '2026-10-01', spend: 10, total_tokens: 1000 },
  { date: '2026-10-02', spend: 20, total_tokens: 2000 },
  { date: '2026-10-03', spend: 15, total_tokens: 1500 },
];

const models = [
  { model: 'gpt-4o', spend: 25, total_tokens: 2500 },
  { model: 'claude-3', spend: 20, total_tokens: 2000 },
];

const bySource = [
  { source: 'agents', spend: 30, total_tokens: 3000 },
  { source: 'chat', spend: 15, total_tokens: 1500 },
];

const baseProps = {
  daily,
  models,
  bySource,
  periodStart: '2026-10-01',
  periodEnd: '2026-10-03',
  compData: null,
  groupBy: 'total',
  granularity: 'daily',
  compareEnabled: false,
  metricKey: 'spend',
};

describe('useUsageChartData — groupBy total', () => {
  it('returns a data point per day with a "total" key', () => {
    const { result } = renderHook(() => useUsageChartData(baseProps));

    expect(result.current.seriesKeys).toEqual(['total']);
    expect(result.current.chartData).toHaveLength(3);
    expect(result.current.chartData[0]).toMatchObject({ date: '2026-10-01', total: 10 });
  });

  it('hasData is true when at least one day has spend > 0', () => {
    const { result } = renderHook(() => useUsageChartData(baseProps));

    expect(result.current.hasData).toBe(true);
  });

  it('hasData is false when all days are zero', () => {
    const zeroDays = daily.map(d => ({ ...d, spend: 0 }));
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, daily: zeroDays }));

    expect(result.current.hasData).toBe(false);
  });
});

describe('useUsageChartData — groupBy model', () => {
  it('returns one series key per model', () => {
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, groupBy: 'model' }));

    expect(result.current.seriesKeys).toContain('gpt-4o');
    expect(result.current.seriesKeys).toContain('claude-3');
  });

  it('distributes each day proportionally across models', () => {
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, groupBy: 'model' }));

    // gpt-4o weight = 25/(25+20) ≈ 55.56%
    const firstDay = result.current.chartData[0];

    expect(firstDay['gpt-4o']).toBeCloseTo(10 * (25 / 45), 2);
    expect(firstDay['claude-3']).toBeCloseTo(10 * (20 / 45), 2);
  });
});

describe('useUsageChartData — groupBy source', () => {
  it('returns one key per source with no __other collapse', () => {
    const sixSources = [
      { source: 'agents', spend: 72 },
      { source: 'chat', spend: 34 },
      { source: 'pipelines', spend: 19 },
      { source: 'indexing', spend: 9 },
      { source: 'skills', spend: 4 },
      { source: 'external', spend: 2 },
    ];
    const { result } = renderHook(() =>
      useUsageChartData({ ...baseProps, bySource: sixSources, groupBy: 'source' }),
    );

    expect(result.current.seriesKeys).toContain('external');
    expect(result.current.seriesKeys).not.toContain('__other');
    expect(result.current.seriesKeys).toHaveLength(6);
  });
});

describe('useUsageChartData — weekly granularity', () => {
  it('aggregates days into weeks', () => {
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, granularity: 'weekly' }));

    // All 3 days fall in the same ISO week — should collapse to 1 row
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].total).toBeCloseTo(45); // 10 + 20 + 15
  });
});

describe('useUsageChartData — compare mode', () => {
  it('merges __prev totals when compareEnabled and compData are provided', () => {
    const compData = {
      daily: [
        { date: '2026-09-01', spend: 5, total_tokens: 500 },
        { date: '2026-09-02', spend: 8, total_tokens: 800 },
        { date: '2026-09-03', spend: 7, total_tokens: 700 },
      ],
      period_start: '2026-09-01',
      period_end: '2026-09-03',
    };
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, compData, compareEnabled: true }));

    expect(result.current.mergedChartData[0]).toHaveProperty('__prev');
    expect(result.current.mergedChartData[0].__prev).toBeCloseTo(5);
  });

  it('returns plain chartData when compareEnabled is false', () => {
    const { result } = renderHook(() => useUsageChartData(baseProps));

    expect(result.current.mergedChartData[0]).not.toHaveProperty('__prev');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useUsageChartData } from '../useUsageChartData.hooks.js';

afterEach(() => cleanup());

const daily = [
  {
    date: '2026-10-01',
    spend: 10,
    total_tokens: 1000,
    by_model: { 'gpt-4o': 10, 'claude-3': 0 },
    by_source: { agents: 10, chat: 0 },
  },
  {
    date: '2026-10-02',
    spend: 20,
    total_tokens: 2000,
    by_model: { 'gpt-4o': 5, 'claude-3': 15 },
    by_source: { agents: 10, chat: 10 },
  },
  {
    date: '2026-10-03',
    spend: 15,
    total_tokens: 1500,
    by_model: { 'gpt-4o': 10, 'claude-3': 5 },
    by_source: { agents: 5, chat: 10 },
  },
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

  it('stacks each day by its own model split', () => {
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, groupBy: 'model' }));

    expect(result.current.chartData[0]).toMatchObject({ 'gpt-4o': 10, 'claude-3': 0 });
    expect(result.current.chartData[1]).toMatchObject({ 'gpt-4o': 5, 'claude-3': 15 });
  });

  it('uses raw model id as series key and exposes display_name in seriesLabels', () => {
    const modelsWithDisplay = [
      { model: 'gpt-4o', display_name: 'GPT-4o', spend: 25, total_tokens: 2500 },
      { model: 'claude-3', display_name: 'Claude 3', spend: 20, total_tokens: 2000 },
    ];
    const { result } = renderHook(() =>
      useUsageChartData({ ...baseProps, models: modelsWithDisplay, groupBy: 'model' }),
    );

    // Chart data is keyed by raw model id (always unique)
    expect(result.current.seriesKeys).toContain('gpt-4o');
    expect(result.current.seriesKeys).toContain('claude-3');
    expect(result.current.chartData[0]).toMatchObject({ 'gpt-4o': 10, 'claude-3': 0 });
    expect(result.current.chartData[1]).toMatchObject({ 'gpt-4o': 5, 'claude-3': 15 });
    // Display names are surfaced in seriesLabels, not as chart keys
    expect(result.current.seriesLabels['gpt-4o']).toBe('GPT-4o');
    expect(result.current.seriesLabels['claude-3']).toBe('Claude 3');
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

describe('useUsageChartData — groupBy member', () => {
  const dailyWithMembers = [
    {
      date: '2026-10-01',
      spend: 10,
      total_tokens: 1000,
      by_model: { 'gpt-4o': 10 },
      by_source: { agents: 10 },
      by_member: { 'alice@example.com': 6, 'bob@example.com': 4 },
    },
    {
      date: '2026-10-02',
      spend: 20,
      total_tokens: 2000,
      by_model: { 'gpt-4o': 20 },
      by_source: { agents: 20 },
      by_member: { 'alice@example.com': 8, 'bob@example.com': 12 },
    },
  ];

  it('returns one series key per member', () => {
    const { result } = renderHook(() =>
      useUsageChartData({ ...baseProps, daily: dailyWithMembers, groupBy: 'member' }),
    );

    expect(result.current.seriesKeys).toContain('alice@example.com');
    expect(result.current.seriesKeys).toContain('bob@example.com');
  });

  it('stacks each day by its own member split', () => {
    const { result } = renderHook(() =>
      useUsageChartData({ ...baseProps, daily: dailyWithMembers, groupBy: 'member' }),
    );

    expect(result.current.chartData[0]).toMatchObject({
      'alice@example.com': 6,
      'bob@example.com': 4,
    });
    expect(result.current.chartData[1]).toMatchObject({
      'alice@example.com': 8,
      'bob@example.com': 12,
    });
  });

  it('falls back to total when daily rows have no by_member field', () => {
    const { result } = renderHook(() => useUsageChartData({ ...baseProps, groupBy: 'member' }));

    expect(result.current.seriesKeys).toEqual(['total']);
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

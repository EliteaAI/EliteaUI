// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useUsageModelData } from '../useUsageModelData.hooks.js';

vi.mock('@/[fsd]/shared/config/theme', async importOriginal => {
  const actual = await importOriginal();

  return {
    ...actual,
    CHART_COLORS: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
  };
});

afterEach(() => cleanup());

const models = [
  { model: 'gpt-4o', display_name: 'GPT-4o', spend: 55.7, total_tokens: 278500 },
  { model: 'claude-sonnet', display_name: 'Claude Sonnet', spend: 30.2, total_tokens: 150000 },
  { model: 'gpt-4o-mini', display_name: 'GPT-4o Mini', spend: 12.1, total_tokens: 403333 },
];

const baseProps = {
  models,
  comparisonModels: [],
  canSeeAmounts: true,
  showAll: false,
  sortKey: 'spend',
  sortDir: 'desc',
};

describe('useUsageModelData — basic enrichment', () => {
  it('computes share percentages that sum to 100', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));
    const total = result.current.mainModels.reduce((s, m) => s + m.share, 0);

    expect(total).toBeCloseTo(100);
  });

  it('assigns a color to every model', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));

    result.current.mainModels.forEach(m => {
      expect(m.color).toBeTruthy();
    });
  });

  it('uses display_name when available', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));

    expect(result.current.mainModels[0].displayName).toBe('GPT-4o');
  });

  it('falls back to formatModelName when display_name is absent', () => {
    const noNames = models.map(m => ({ ...m, display_name: undefined }));
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, models: noNames }));

    expect(result.current.mainModels[0].displayName).toBe('gpt-4o');
  });

  it('detects Image type for DALL-E models', () => {
    const withImage = [
      ...models,
      { model: 'dall-e-3', display_name: 'DALL-E 3', spend: 5, total_tokens: 50 },
    ];
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, models: withImage }));
    const dalle = result.current.mainModels.find(m => m.model === 'dall-e-3');

    expect(dalle?.modelType).toBe('Image');
  });
});

describe('useUsageModelData — sorting', () => {
  it('sorts by spend descending by default', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));
    const spends = result.current.mainModels.map(m => m.spend);

    expect(spends).toEqual([...spends].sort((a, b) => b - a));
  });

  it('sorts by spend ascending when sortDir is asc', () => {
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, sortDir: 'asc' }));
    const spends = result.current.mainModels.map(m => m.spend);

    expect(spends).toEqual([...spends].sort((a, b) => a - b));
  });

  it('sorts by name alphabetically', () => {
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, sortKey: 'name', sortDir: 'asc' }));
    const names = result.current.mainModels.map(m => m.displayName.toLowerCase());

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('sorts by total_tokens when sortKey is "tokens"', () => {
    const { result } = renderHook(() =>
      useUsageModelData({ ...baseProps, sortKey: 'tokens', sortDir: 'desc' }),
    );
    const tokens = result.current.mainModels.map(m => m.total_tokens);

    expect(tokens).toEqual([...tokens].sort((a, b) => b - a));
  });
});

describe('useUsageModelData — showAll / hasMore', () => {
  // USAGE_DEFAULT_VISIBLE_MODELS = 8, so we need > 8 models for hasMore to fire
  const manyModels = Array.from({ length: 11 }, (_, i) => ({
    model: `model-${i}`,
    display_name: `Model ${i}`,
    spend: (11 - i) * 10,
    total_tokens: (11 - i) * 1000,
  }));

  it('truncates to USAGE_DEFAULT_VISIBLE_MODELS (8) when showAll is false', () => {
    const { result } = renderHook(() =>
      useUsageModelData({ ...baseProps, models: manyModels, showAll: false }),
    );

    expect(result.current.hasMore).toBe(true);
    expect(result.current.visibleModels.length).toBeLessThanOrEqual(9); // 8 main + possible otherRow
  });

  it('shows all mainModels when showAll is true', () => {
    const { result } = renderHook(() =>
      useUsageModelData({ ...baseProps, models: manyModels, showAll: true }),
    );

    expect(result.current.visibleModels.length).toBeGreaterThanOrEqual(result.current.mainModels.length);
  });
});

describe('useUsageModelData — comparison delta', () => {
  it('computes delta direction for models that also appear in comparisonModels', () => {
    const compModels = [{ model: 'gpt-4o', spend: 40 }];
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, comparisonModels: compModels }));
    const gpt4o = result.current.mainModels.find(m => m.model === 'gpt-4o');

    // spend went from 40 → 55.7, so direction should be 'up'
    expect(gpt4o?.delta?.direction).toBe('up');
  });

  it('marks direction as "none" for models absent from comparison', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));

    result.current.mainModels.forEach(m => {
      expect(m.delta?.direction).toBe('none');
    });
  });
});

describe('useUsageModelData — otherRow', () => {
  it('adds an otherRow for models below the minimum share threshold', () => {
    const withTiny = [
      ...models,
      { model: 'tiny-model', display_name: 'Tiny', spend: 0.01, total_tokens: 10 },
    ];
    const { result } = renderHook(() => useUsageModelData({ ...baseProps, models: withTiny }));

    expect(result.current.otherRow).not.toBeNull();
    expect(result.current.otherRow?.isOther).toBe(true);
  });

  it('has no otherRow when all models clear the share threshold', () => {
    const { result } = renderHook(() => useUsageModelData(baseProps));

    expect(result.current.otherRow).toBeNull();
  });
});

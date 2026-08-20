// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useToolkitIndexes } from '../useToolkitIndexes.hooks';

const mockIndexesList = vi.hoisted(() => ({ current: {} }));

vi.mock('react-redux', () => ({
  useSelector: () => mockIndexesList.current,
}));

const givenIndexes = (toolkitId, data, isLoading = false) => {
  mockIndexesList.current = { data, toolkitId, isLoading };
};

const anIndex = (collection = 'docs') => ({ id: collection, metadata: { collection } });

describe('useToolkitIndexes', () => {
  it('returns the indexes of the requested toolkit', () => {
    givenIndexes(7, [anIndex('a'), anIndex('b')]);

    const { result } = renderHook(() => useToolkitIndexes(7));

    expect(result.current.count).toBe(2);
    expect(result.current.label).toBe('2 indexes');
    expect(result.current.indexes).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('labels a single index in the singular', () => {
    givenIndexes(7, [anIndex('a')]);

    const { result } = renderHook(() => useToolkitIndexes(7));

    expect(result.current.label).toBe('1 index');
  });

  it('matches the toolkit id across string and number forms', () => {
    givenIndexes('7', [anIndex('a')]);

    const { result } = renderHook(() => useToolkitIndexes(7));

    expect(result.current.count).toBe(1);
  });

  it('hides a list still holding another toolkit rows and keeps loading', () => {
    givenIndexes(7, [anIndex('a'), anIndex('b')]);

    const { result } = renderHook(() => useToolkitIndexes(8));

    expect(result.current.indexes).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it('reports the slice loading flag for the current toolkit', () => {
    givenIndexes(7, [], true);

    const { result } = renderHook(() => useToolkitIndexes(7));

    expect(result.current.isLoading).toBe(true);
  });
});

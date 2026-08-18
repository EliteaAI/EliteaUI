// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useIndexesSectionSummary } from '../useIndexesSectionSummary.hooks';

const mockIndexesList = vi.hoisted(() => ({ current: {} }));

vi.mock('react-redux', () => ({
  useSelector: () => mockIndexesList.current,
}));

const givenIndexes = (toolkitId, data) => {
  mockIndexesList.current = { data, toolkitId };
};

const indexWith = (state, extra = {}) => ({ metadata: { state }, ...extra });

describe('useIndexesSectionSummary', () => {
  it('counts the indexes of the requested toolkit', () => {
    givenIndexes(7, [indexWith('completed'), indexWith('completed')]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.count).toBe(2);
    expect(result.current.label).toBe('2 indexes');
    expect(result.current.status).toBeNull();
  });

  it('ignores a list still holding another toolkit rows', () => {
    givenIndexes(7, [indexWith('failed'), indexWith('completed')]);

    const { result } = renderHook(() => useIndexesSectionSummary(8));

    expect(result.current.count).toBe(0);
    expect(result.current.status).toBeNull();
  });

  it('matches the toolkit id across string and number forms', () => {
    givenIndexes('7', [indexWith('completed')]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.count).toBe(1);
  });

  it('reports an error for failed indexes', () => {
    givenIndexes(7, [indexWith('failed'), indexWith('cancelled')]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.status).toEqual({ status: 'error', message: '1 index failed to build' });
  });

  it('treats a stale in_progress run as failed', () => {
    givenIndexes(7, [indexWith('in_progress', { stale: true })]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.status.status).toBe('error');
  });

  it('reports a warning for incomplete indexes only', () => {
    givenIndexes(7, [indexWith('partly_indexed'), indexWith('completed')]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.status).toEqual({ status: 'warning', message: '1 index did not complete' });
  });

  it('leaves a running index without a status', () => {
    givenIndexes(7, [indexWith('in_progress')]);

    const { result } = renderHook(() => useIndexesSectionSummary(7));

    expect(result.current.status).toBeNull();
  });
});

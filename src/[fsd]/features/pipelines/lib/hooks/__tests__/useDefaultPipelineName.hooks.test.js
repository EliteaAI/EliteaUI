// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

const useTotalApplicationsQuery = vi.fn();

vi.mock('@/api/applications', () => ({
  useTotalApplicationsQuery: (...args) => useTotalApplicationsQuery(...args),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 42,
}));

const { useDefaultPipelineName } = await import('../useDefaultPipelineName.hooks');

describe('useDefaultPipelineName', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('requests only the project pipelines total', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: undefined, isFetching: true, isError: false });

    renderHook(() => useDefaultPipelineName());

    expect(useTotalApplicationsQuery).toHaveBeenCalledWith(
      { projectId: 42, params: { agents_type: 'pipeline' } },
      { skip: false },
    );
  });

  it('reports loading until the first total arrives', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: undefined, isFetching: true, isError: false });

    const { result } = renderHook(() => useDefaultPipelineName());

    expect(result.current.isLoading).toBe(true);
  });

  it('suggests total + 1', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: { total: 4 }, isFetching: false, isError: false });

    const { result } = renderHook(() => useDefaultPipelineName());

    expect(result.current).toEqual({ defaultName: 'Pipeline 5', isLoading: false });
  });

  it('does not block on a background refetch of a cached total', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: { total: 2 }, isFetching: true, isError: false });

    const { result } = renderHook(() => useDefaultPipelineName());

    expect(result.current).toEqual({ defaultName: 'Pipeline 3', isLoading: false });
  });

  it('falls back to "Pipeline 1" when the request fails', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true });

    const { result } = renderHook(() => useDefaultPipelineName());

    expect(result.current.defaultName).toBe('Pipeline 1');
  });

  it('keeps the first resolved name when the total is refetched after saving', () => {
    useTotalApplicationsQuery.mockReturnValue({ data: { total: 2 }, isFetching: false, isError: false });

    const { result, rerender } = renderHook(() => useDefaultPipelineName());

    useTotalApplicationsQuery.mockReturnValue({ data: { total: 3 }, isFetching: false, isError: false });
    rerender();

    expect(result.current).toEqual({ defaultName: 'Pipeline 3', isLoading: false });
  });
});

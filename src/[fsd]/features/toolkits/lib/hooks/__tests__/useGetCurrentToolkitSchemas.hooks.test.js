// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useGetCurrentToolkitSchemas } from '../useGetCurrentToolkitSchemas.hooks';

const shared = vi.hoisted(() => ({ request: {}, schemas: {}, isFetching: false }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ applications: { toolkitSchemas: shared.schemas } }),
}));

vi.mock('@/api/eliteaApi.js', () => ({
  eliteaApi: { endpoints: { toolkitTypes: { select: () => () => shared.request } } },
}));

vi.mock('@/api/toolkits', () => ({
  useLazyToolkitTypesQuery: () => [
    () => ({ unwrap: () => Promise.resolve({}) }),
    { isFetching: shared.isFetching },
  ],
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useSocket', () => ({ default: () => {} }));
vi.mock('@/common/constants', () => ({ sioEvents: { mcp_status: 'mcp_status' } }));

const givenSharedRequest = (request, schemas = {}) => {
  shared.request = request;
  shared.schemas = schemas;
};

const PENDING = { isSuccess: false, isError: false };
const SUCCEEDED = { isSuccess: true, isError: false };
const FAILED = { isSuccess: false, isError: true };

describe('useGetCurrentToolkitSchemas settled signal', () => {
  beforeEach(() => {
    shared.isFetching = false;
  });

  it('is unsettled while a sibling owns the request, even though this instance is not fetching', () => {
    givenSharedRequest(PENDING);

    const { result } = renderHook(() => useGetCurrentToolkitSchemas({}));

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSettled).toBe(false);
  });

  it('settles when the shared request fails, since nothing retries it', () => {
    givenSharedRequest(FAILED);

    const { result } = renderHook(() => useGetCurrentToolkitSchemas({}));

    expect(result.current.isSettled).toBe(true);
  });

  it('settles from the slice when the cache entry has been evicted', () => {
    givenSharedRequest(PENDING, { github: {} });

    const { result } = renderHook(() => useGetCurrentToolkitSchemas({}));

    expect(result.current.isSettled).toBe(true);
  });

  it('stays settled once the request goes back in flight', () => {
    givenSharedRequest(SUCCEEDED, { github: {} });

    const { result, rerender } = renderHook(() => useGetCurrentToolkitSchemas({}));
    expect(result.current.isSettled).toBe(true);

    givenSharedRequest(PENDING);
    shared.isFetching = true;
    rerender();

    expect(result.current.isSettled).toBe(true);
  });
});

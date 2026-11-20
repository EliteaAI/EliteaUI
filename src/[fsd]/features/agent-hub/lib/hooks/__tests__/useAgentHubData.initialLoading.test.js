// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

import { useAgentHubData } from '../useAgentHubData.hooks';

const fixture = vi.hoisted(() => ({
  categories: { data: undefined, isFetching: true, isError: false },
  isCacheValid: false,
  pendingFetches: [],
  fetchApplications: null,
  dispatch: () => {},
  hubData: { applicationsByTag: {}, totalCountsByTag: {}, currentPageByTag: {} },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => fixture.dispatch,
  useSelector: select => select({}),
}));
vi.mock('@/slices/agentHub', () => ({
  actions: new Proxy({}, { get: () => payload => ({ type: 'agentHub', payload }) }),
  selectAgentHubData: () => fixture.hubData,
  selectIsCacheValid: () => fixture.isCacheValid,
  selectLastRefreshedAt: () => null,
}));
vi.mock('@/[fsd]/entities/version/api', () => ({
  useGetAgentCategoriesQuery: () => fixture.categories,
}));
vi.mock('@/api/applications', () => ({
  useLazyPublicApplicationsListQuery: () => [fixture.fetchApplications],
}));

const pendingFetch = () =>
  vi.fn(() => ({
    unwrap: () =>
      new Promise(resolve => {
        fixture.pendingFetches.push(() => resolve({ rows: [], total: 0 }));
      }),
  }));

describe('useAgentHubData isInitialLoading', () => {
  beforeEach(() => {
    fixture.categories = { data: undefined, isFetching: true, isError: false };
    fixture.isCacheValid = false;
    fixture.pendingFetches = [];
    fixture.fetchApplications = pendingFetch();
  });
  afterEach(() => cleanup());

  it('stays loading between the categories and the agents, until the agents arrive', async () => {
    const { result, rerender } = renderHook(() => useAgentHubData('', []));
    expect(result.current.isInitialLoading).toBe(true);

    fixture.categories = { data: { categories: [{ name: 'Coding' }] }, isFetching: false, isError: false };
    rerender();
    expect(result.current.isInitialLoading).toBe(true);

    expect(fixture.pendingFetches.length).toBeGreaterThan(0);
    await act(async () => fixture.pendingFetches.forEach(resolve => resolve()));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
  });

  it('is done when there are no categories to load', async () => {
    fixture.categories = { data: { categories: [] }, isFetching: false, isError: false };
    const { result } = renderHook(() => useAgentHubData('', []));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
  });

  it('is done when the categories fail', async () => {
    fixture.categories = { data: undefined, isFetching: false, isError: true };
    const { result } = renderHook(() => useAgentHubData('', []));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
  });

  it('is not loading with a valid cache', () => {
    fixture.isCacheValid = true;
    const { result } = renderHook(() => useAgentHubData('', []));
    expect(result.current.isInitialLoading).toBe(false);
  });
});

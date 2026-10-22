// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useUserList } from '../useUserList.hooks.js';

const mockUserListQuery = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 99 } }),
}));
vi.mock('@/api/admin', () => ({ useUserListQuery: mockUserListQuery }));
vi.mock('../useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 1 }));

const PAGE_SIZE = 20;
const requestedPages = () => mockUserListQuery.mock.calls.map(([args]) => args.page);

describe('useUserList pagination', () => {
  beforeEach(() => {
    mockUserListQuery.mockReset();
    mockUserListQuery.mockReturnValue({ data: { rows: [] }, isFetching: false });
  });

  it('never requests the old page with a new query', () => {
    const { result, rerender } = renderHook(props => useUserList({ pageSize: PAGE_SIZE, ...props }), {
      initialProps: { query: 'ann' },
    });

    act(() => result.current.onLoadMoreUsers());
    act(() => result.current.onLoadMoreUsers());
    expect(requestedPages().at(-1)).toBe(2);

    mockUserListQuery.mockClear();
    rerender({ query: 'bob' });

    const calls = mockUserListQuery.mock.calls.map(([args]) => args);
    expect(calls.length).toBeGreaterThan(0);
    calls.forEach(args => {
      expect(args.params.query).toBe('bob');
      expect(args.page).toBe(0);
    });
  });
});

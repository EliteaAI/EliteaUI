// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useUserList } from '../useUserList.hooks.js';

const mockUserListQuery = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 99 } }),
}));
vi.mock('@/api/admin', () => ({ useUserListQuery: mockUserListQuery }));
const mockProjectId = vi.hoisted(() => ({ current: 1 }));
vi.mock('../useSelectedProject.hooks', () => ({ useSelectedProjectId: () => mockProjectId.current }));

const PAGE_SIZE = 20;
const requestedPages = () => mockUserListQuery.mock.calls.map(([args]) => args.page);

describe('useUserList pagination', () => {
  beforeEach(() => {
    mockProjectId.current = 1;
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

  const scrollToPageTwo = props => {
    const hook = renderHook(p => useUserList({ pageSize: PAGE_SIZE, ...p }), { initialProps: props });
    act(() => hook.result.current.onLoadMoreUsers());
    act(() => hook.result.current.onLoadMoreUsers());
    expect(requestedPages().at(-1)).toBe(2);
    return hook;
  };

  it('keeps the page when the tag list is a new array with the same items', () => {
    const { rerender } = scrollToPageTwo({ selectedTagIds: [1, 2] });
    rerender({ selectedTagIds: [1, 2] });
    expect(requestedPages().at(-1)).toBe(2);
  });

  it('starts at page 0 when the tag list changes', () => {
    const { rerender } = scrollToPageTwo({ selectedTagIds: [1, 2] });
    rerender({ selectedTagIds: [1, 3] });
    expect(requestedPages().at(-1)).toBe(0);
  });

  it('starts at page 0 when the query returns to an earlier value', () => {
    const { rerender } = scrollToPageTwo({ query: 'ann' });
    rerender({ query: 'bob' });
    rerender({ query: 'ann' });
    expect(requestedPages().at(-1)).toBe(0);
  });

  it('starts at page 0 when the tag filter changes', () => {
    const tagsA = ['a'];
    const tagsB = ['b'];
    const { rerender } = scrollToPageTwo({ query: 'ann', selectedTagIds: tagsA });
    rerender({ query: 'ann', selectedTagIds: tagsB });
    expect(requestedPages().at(-1)).toBe(0);
    rerender({ query: 'ann', selectedTagIds: tagsA });
    expect(requestedPages().at(-1)).toBe(0);
  });

  it('starts at page 0 when the project changes', () => {
    const { rerender } = scrollToPageTwo({ query: 'ann' });
    mockProjectId.current = 2;
    rerender({ query: 'ann' });
    expect(requestedPages().at(-1)).toBe(0);
    mockProjectId.current = 1;
    rerender({ query: 'ann' });
    expect(requestedPages().at(-1)).toBe(0);
  });
});

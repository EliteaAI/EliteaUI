// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useTimeLineGroups } from '../useTimeLineGroups.hooks';

// Steps 1-3 belong to one group, step 0 and step 4 stand alone.
const steps = [{ group_id: 'a' }, { group_id: 'b' }, { group_id: 'b' }, { group_id: 'b' }, { group_id: 'c' }];
const indexes = result => result.current.visibleSteps.map(row => row.index);

afterEach(cleanup);

describe('useTimeLineGroups', () => {
  it('starts with every group collapsed', () => {
    const { result } = renderHook(() => useTimeLineGroups(steps, 0, vi.fn()));

    expect(result.current.expandAll).toBe(false);
    expect(result.current.hasGroups).toBe(true);
    expect(indexes(result)).toEqual([0, 1, 4]);
  });

  it('reports no groups when every step stands alone', () => {
    const { result } = renderHook(() =>
      useTimeLineGroups([{ group_id: 'a' }, { group_id: 'b' }, {}, {}], 0, vi.fn()),
    );

    expect(result.current.hasGroups).toBe(false);
  });

  it('expands and collapses a single group', () => {
    const { result } = renderHook(() => useTimeLineGroups(steps, 0, vi.fn()));

    act(() => result.current.toggleGroup(1, 3, false));
    expect(indexes(result)).toEqual([0, 1, 2, 3, 4]);

    act(() => result.current.toggleGroup(1, 3, true));
    expect(indexes(result)).toEqual([0, 1, 4]);
  });

  it('expands every group with expand-all and lets one group be collapsed again', () => {
    const { result } = renderHook(() => useTimeLineGroups(steps, 0, vi.fn()));

    act(() => result.current.toggleExpandAll({}, true));
    expect(result.current.expandAll).toBe(true);
    expect(indexes(result)).toEqual([0, 1, 2, 3, 4]);

    act(() => result.current.toggleGroup(1, 3, true));
    expect(indexes(result)).toEqual([0, 1, 4]);
  });

  it('clears per-group changes when expand-all is switched', () => {
    const { result } = renderHook(() => useTimeLineGroups(steps, 0, vi.fn()));

    act(() => result.current.toggleGroup(1, 3, false));
    act(() => result.current.toggleExpandAll({}, true));
    expect(indexes(result)).toEqual([0, 1, 2, 3, 4]);

    act(() => result.current.toggleExpandAll({}, false));
    expect(indexes(result)).toEqual([0, 1, 4]);
  });

  it('applies expand-all to groups that arrive later', () => {
    const { result, rerender } = renderHook(({ list }) => useTimeLineGroups(list, 0, vi.fn()), {
      initialProps: { list: steps },
    });

    act(() => result.current.toggleExpandAll({}, true));
    rerender({ list: [...steps, { group_id: 'd' }, { group_id: 'd' }] });

    expect(indexes(result)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  describe('selection hand-off', () => {
    it('moves the selection to the group head when collapsing a group that holds it', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useTimeLineGroups(steps, 2, onSelect));

      act(() => result.current.toggleGroup(1, 3, true));

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('keeps the selection when the group head itself is selected', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useTimeLineGroups(steps, 1, onSelect));

      act(() => result.current.toggleGroup(1, 3, true));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('keeps the selection when expanding, or when it sits in another group', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useTimeLineGroups(steps, 4, onSelect));

      act(() => result.current.toggleGroup(1, 3, false));
      act(() => result.current.toggleGroup(1, 3, true));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('moves the selection to its group head when expand-all is switched off', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useTimeLineGroups(steps, 3, onSelect));

      act(() => result.current.toggleExpandAll({}, true));
      expect(onSelect).not.toHaveBeenCalled();

      act(() => result.current.toggleExpandAll({}, false));
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('leaves the selection alone when expand-all is switched off and it is not inside a group', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useTimeLineGroups(steps, 0, onSelect));

      act(() => result.current.toggleExpandAll({}, true));
      act(() => result.current.toggleExpandAll({}, false));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});

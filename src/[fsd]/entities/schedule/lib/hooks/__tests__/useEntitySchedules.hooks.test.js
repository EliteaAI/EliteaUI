// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useEntitySchedules } from '../useEntitySchedules.hooks';

// the schedule list of one agent or pipeline, 20 cards per page

const mocks = vi.hoisted(() => ({ listQuery: vi.fn() }));

vi.mock('../../../api/scheduleApi.js', () => ({ useGetScheduleListQuery: mocks.listQuery }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 5 }));

const rowsOf = count => Array.from({ length: count }, (_, index) => ({ id: index + 1 }));

describe('useEntitySchedules', () => {
  afterEach(() => vi.clearAllMocks());

  it('TC-US35-04 requests the first 20 schedules of the entity', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(2), total: 2 } });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12 }));

    expect(mocks.listQuery).toHaveBeenLastCalledWith(
      { projectId: 5, entityType: 'agent', entityId: 12, pageSize: 20 },
      { skip: false },
    );
    expect(result.current.rows).toEqual(rowsOf(2));
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('TC-US35-06 loads 20 more on Show more while more rows exist', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'pipeline', entityId: 4 }));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    expect(mocks.listQuery).toHaveBeenLastCalledWith(
      { projectId: 5, entityType: 'pipeline', entityId: 4, pageSize: 40 },
      { skip: false },
    );
  });

  it('TC-US35-06 starts again at 20 rows when the editor opens another entity', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result, rerender } = renderHook(props => useEntitySchedules(props), {
      initialProps: { entityType: 'agent', entityId: 12 },
    });
    act(() => result.current.loadMore());
    rerender({ entityType: 'agent', entityId: 13 });

    expect(mocks.listQuery).toHaveBeenLastCalledWith(
      { projectId: 5, entityType: 'agent', entityId: 13, pageSize: 20 },
      { skip: false },
    );
  });

  it('sends no request without an entity id or when skipped', () => {
    mocks.listQuery.mockReturnValue({});

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: undefined }));
    expect(mocks.listQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);

    renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 3, skip: true }));
    expect(mocks.listQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
  });

  it('stops at the 100 rows the list API answers at most', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(100), total: 130 } });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12 }));
    for (let page = 0; page < 6; page += 1) act(() => result.current.loadMore());

    expect(mocks.listQuery.mock.calls.at(-1)[0].pageSize).toBe(100);
    expect(result.current.hasMore).toBe(false);
  });

  it('sends the version_id of the editor version to the list query', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(1), total: 1 } });

    renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12, versionId: 71 }));

    expect(mocks.listQuery).toHaveBeenLastCalledWith(
      { projectId: 5, entityType: 'agent', entityId: 12, versionId: 71, pageSize: 20 },
      { skip: false },
    );
  });

  it('reloads from the first 20 rows when the editor version changes', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result, rerender } = renderHook(props => useEntitySchedules(props), {
      initialProps: { entityType: 'agent', entityId: 12, versionId: 71 },
    });
    act(() => result.current.loadMore());
    expect(mocks.listQuery.mock.calls.at(-1)[0].pageSize).toBe(40);
    rerender({ entityType: 'agent', entityId: 12, versionId: 72 });

    expect(mocks.listQuery).toHaveBeenLastCalledWith(
      { projectId: 5, entityType: 'agent', entityId: 12, versionId: 72, pageSize: 20 },
      { skip: false },
    );
  });
});

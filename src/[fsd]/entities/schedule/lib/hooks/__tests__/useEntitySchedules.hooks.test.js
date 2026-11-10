// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useEntitySchedules } from '../useEntitySchedules.hooks';

// the schedule list of one agent or pipeline, 20 cards per page

const mocks = vi.hoisted(() => ({ listQuery: vi.fn() }));

vi.mock('../../../api/scheduleApi.js', () => ({ useGetScheduleListQuery: mocks.listQuery }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 5 }));

const rowsOf = (count, from = 1) => Array.from({ length: count }, (_, index) => ({ id: index + from }));

// The hook asks for the first 100 rows in one growing request, and for later pages by offset
const firstPageCalls = () => mocks.listQuery.mock.calls.filter(([args]) => args.page === undefined);
const lastFirstPageCall = () => firstPageCalls().at(-1);
const offsetCalls = () => mocks.listQuery.mock.calls.filter(([args]) => args.page !== undefined);

describe('useEntitySchedules', () => {
  afterEach(() => vi.clearAllMocks());

  it('TC-US35-04 requests the first 20 schedules of the entity', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(2), total: 2 } });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12 }));

    expect(lastFirstPageCall()).toEqual([
      { projectId: 5, entityType: 'agent', entityId: 12, pageSize: 20 },
      { skip: false },
    ]);
    expect(result.current.rows).toEqual(rowsOf(2));
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('TC-US35-06 loads 20 more on Show more while more rows exist', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'pipeline', entityId: 4 }));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    expect(lastFirstPageCall()).toEqual([
      { projectId: 5, entityType: 'pipeline', entityId: 4, pageSize: 40 },
      { skip: false },
    ]);
  });

  it('TC-US35-06 starts again at 20 rows when the editor opens another entity', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result, rerender } = renderHook(props => useEntitySchedules(props), {
      initialProps: { entityType: 'agent', entityId: 12 },
    });
    act(() => result.current.loadMore());
    rerender({ entityType: 'agent', entityId: 13 });

    expect(lastFirstPageCall()).toEqual([
      { projectId: 5, entityType: 'agent', entityId: 13, pageSize: 20 },
      { skip: false },
    ]);
  });

  it('sends no request without an entity id or when skipped', () => {
    mocks.listQuery.mockReturnValue({});

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: undefined }));
    expect(lastFirstPageCall()[1]).toEqual({ skip: true });
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);

    renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 3, skip: true }));
    expect(lastFirstPageCall()[1]).toEqual({ skip: true });
  });

  it('reads the rows past 100 by offset, so Show more never stops early', () => {
    // A skipped query answers nothing, as RTK Query does
    mocks.listQuery.mockImplementation((args, { skip }) => {
      if (skip) return {};
      if (args.page === 1) return { currentData: { rows: rowsOf(30, 101), total: 130 } };
      return { data: { rows: rowsOf(Math.min(args.pageSize, 100)), total: 130 } };
    });

    const { result } = renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12 }));
    // 20 shown, then 4 x Show more: the first 100 rows, all from the one growing request
    for (let page = 0; page < 4; page += 1) act(() => result.current.loadMore());
    expect(lastFirstPageCall()[0].pageSize).toBe(100);
    expect(result.current.rows).toHaveLength(100);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    // Rows 101 to 200 come from the second page of 100, asked for only now
    expect(
      offsetCalls().some(([args, options]) => args.page === 1 && args.pageSize === 100 && !options.skip),
    ).toBe(true);
    expect(result.current.rows).toHaveLength(120);
    expect(result.current.rows.at(-1).id).toBe(120);

    act(() => result.current.loadMore());
    expect(result.current.rows).toHaveLength(130);
    expect(result.current.hasMore).toBe(false);
  });

  it('sends the version_id of the editor version to the list query', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(1), total: 1 } });

    renderHook(() => useEntitySchedules({ entityType: 'agent', entityId: 12, versionId: 71 }));

    expect(lastFirstPageCall()).toEqual([
      { projectId: 5, entityType: 'agent', entityId: 12, versionId: 71, pageSize: 20 },
      { skip: false },
    ]);
  });

  it('reloads from the first 20 rows when the editor version changes', () => {
    mocks.listQuery.mockReturnValue({ data: { rows: rowsOf(20), total: 25 } });

    const { result, rerender } = renderHook(props => useEntitySchedules(props), {
      initialProps: { entityType: 'agent', entityId: 12, versionId: 71 },
    });
    act(() => result.current.loadMore());
    expect(lastFirstPageCall()[0].pageSize).toBe(40);
    rerender({ entityType: 'agent', entityId: 12, versionId: 72 });

    expect(lastFirstPageCall()).toEqual([
      { projectId: 5, entityType: 'agent', entityId: 12, versionId: 72, pageSize: 20 },
      { skip: false },
    ]);
  });
});

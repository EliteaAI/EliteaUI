// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useAllEntitySchedules } from '../useAllEntitySchedules.hooks';

// EL-7011 US-38: the run history page reads every schedule of the entity, 100 rows per request (R4.1, R4.2)

const mocks = vi.hoisted(() => ({ listQuery: vi.fn() }));

vi.mock('../../../api/scheduleApi.js', () => ({ useGetScheduleListQuery: mocks.listQuery }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 5 }));

const rowsOf = (count, from = 1) => Array.from({ length: count }, (_, index) => ({ id: from + index }));
const baseArgs = { projectId: 5, entityType: 'agent', entityId: 12, pageSize: 100 };

describe('useAllEntitySchedules EL-7011 US-38', () => {
  afterEach(() => vi.clearAllMocks());

  it('R4.1 EL-7011 asks for the next page while the last page is full, then stops', () => {
    // Like RTK Query, a skipped query has no data
    mocks.listQuery.mockImplementation(({ page }, { skip }) => ({
      currentData: skip ? undefined : { rows: page === 0 ? rowsOf(100) : rowsOf(30, 101) },
    }));

    const { result } = renderHook(() => useAllEntitySchedules({ entityType: 'agent', entityId: 12 }));

    expect(result.current.rows).toHaveLength(130);
    expect(mocks.listQuery).toHaveBeenCalledWith({ ...baseArgs, page: 1 }, { skip: false });
    expect(mocks.listQuery).toHaveBeenLastCalledWith({ ...baseArgs, page: 2 }, { skip: true });
  });

  it('R4.1 EL-7011 makes one request when the first page is not full', () => {
    mocks.listQuery.mockImplementation((_args, { skip }) => ({
      currentData: skip ? undefined : { rows: rowsOf(3) },
    }));

    const { result } = renderHook(() => useAllEntitySchedules({ entityType: 'agent', entityId: 12 }));

    expect(result.current.rows).toEqual(rowsOf(3));
    expect(mocks.listQuery).toHaveBeenLastCalledWith({ ...baseArgs, page: 1 }, { skip: true });
  });

  it('R4.1 EL-7011 sends no request while skipped', () => {
    mocks.listQuery.mockReturnValue({ currentData: undefined });

    const { result } = renderHook(() =>
      useAllEntitySchedules({ entityType: 'agent', entityId: 12, skip: true }),
    );

    expect(result.current.rows).toEqual([]);
    expect(mocks.listQuery).toHaveBeenLastCalledWith({ ...baseArgs, page: 0 }, { skip: true });
  });
});

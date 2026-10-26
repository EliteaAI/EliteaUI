// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleRowActions } from '../useScheduleRowActions.hooks';

// row hook for calls, toasts and busy state.

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  remove: vi.fn(),
  exportSchedules: vi.fn(),
  exportState: { isFetching: false },
  canExport: true,
  download: vi.fn(),
  state: { isLoading: false },
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  cacheKeys: [],
}));

const mutationHook = trigger => options => {
  mocks.cacheKeys.push(options?.fixedCacheKey);
  return [trigger, mocks.state];
};

vi.mock('@/[fsd]/entities/schedule/api/scheduleApi.js', () => ({
  useRunScheduleMutation: options => mutationHook(mocks.run)(options),
  usePauseScheduleMutation: options => mutationHook(mocks.pause)(options),
  useResumeScheduleMutation: options => mutationHook(mocks.resume)(options),
  useDeleteScheduleMutation: options => mutationHook(mocks.remove)(options),
  useLazyExportSchedulesQuery: () => [mocks.exportSchedules, mocks.exportState],
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => mocks.canExport }),
}));
vi.mock('@/common/utils', async importOriginal => ({
  ...(await importOriginal()),
  downloadBlobFile: (...args) => mocks.download(...args),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({
  useSelectedProjectId: () => 3,
}));

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = error => ({ unwrap: () => Promise.reject(error) });

const setup = () => renderHook(() => useScheduleRowActions({ id: 7, name: 'Nightly digest' })).result;

describe('useScheduleRowActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.isLoading = false;
    mocks.exportState.isFetching = false;
    mocks.canExport = true;
    mocks.cacheKeys.length = 0;
  });

  it('runs the schedule and shows a success toast', async () => {
    mocks.run.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current.onRun());
    expect(mocks.run).toHaveBeenCalledWith({ projectId: 3, scheduleId: 7 });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Run started');
  });

  it('shows the server text of a 409 on run', async () => {
    mocks.run.mockReturnValue(fail({ status: 409, data: { error: 'run is active', active_run_id: 5 } }));
    const result = setup();
    await act(() => result.current.onRun());
    expect(mocks.toastError).toHaveBeenCalledWith('run is active');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('shows the server text of a 409 on pause, resume and delete', async () => {
    mocks.pause.mockReturnValue(fail({ status: 409, data: { error: 'Schedule is locked' } }));
    mocks.resume.mockReturnValue(fail({ status: 409, data: { error: 'Schedule is locked' } }));
    mocks.remove.mockReturnValue(fail({ status: 409, data: { error: 'Delete blocked' } }));
    const result = setup();
    await act(() => result.current.onPause());
    await act(() => result.current.onResume());
    expect(mocks.toastError).toHaveBeenNthCalledWith(1, 'Schedule is locked');
    expect(mocks.toastError).toHaveBeenNthCalledWith(2, 'Schedule is locked');
    await act(() => result.current.onDelete());
    expect(mocks.toastError).toHaveBeenLastCalledWith('Delete blocked');
  });

  it('pause and resume call their own mutations and toast', async () => {
    mocks.pause.mockReturnValue(ok());
    mocks.resume.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current.onPause());
    expect(mocks.pause).toHaveBeenLastCalledWith({ projectId: 3, scheduleId: 7 });
    expect(mocks.toastSuccess).toHaveBeenLastCalledWith('Schedule paused');
    await act(() => result.current.onResume());
    expect(mocks.resume).toHaveBeenLastCalledWith({ projectId: 3, scheduleId: 7 });
    expect(mocks.toastSuccess).toHaveBeenLastCalledWith('Schedule resumed');
  });

  it('shows the server text when the pause fails', async () => {
    mocks.pause.mockReturnValue(fail({ status: 500, data: { message: 'Server broke' } }));
    const result = setup();
    await act(() => result.current.onPause());
    expect(mocks.toastError).toHaveBeenCalledWith('Server broke');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('deletes the schedule and toasts; a failure shows the error', async () => {
    mocks.remove.mockReturnValueOnce(ok()).mockReturnValueOnce(fail({ status: 404, originalStatus: 404 }));
    const result = setup();
    await act(() => result.current.onDelete());
    expect(mocks.remove).toHaveBeenCalledWith({ projectId: 3, scheduleId: 7 });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Schedule "Nightly digest" deleted');
    await act(() => result.current.onDelete());
    expect(mocks.toastError).toHaveBeenCalledWith('The requested resource was not found!');
  });

  it('onExport exports ids=[row.id] and saves the blob', async () => {
    const blob = new Blob(['schedules: []']);
    mocks.exportSchedules.mockResolvedValue({ data: { blob, filename: 'schedules_3.yaml' } });
    const result = setup();
    await act(() => result.current.onExport());
    expect(mocks.exportSchedules).toHaveBeenCalledWith({ projectId: 3, ids: [7] });
    expect(mocks.download).toHaveBeenCalledWith(blob, 'schedules_3.yaml');
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('a failed export shows the error toast and saves nothing', async () => {
    mocks.exportSchedules.mockResolvedValue({
      error: { status: 400, data: { code: 'invalid_input', error: 'ids must be numbers', field: 'ids' } },
    });
    const result = setup();
    await act(() => result.current.onExport());
    expect(mocks.toastError).toHaveBeenCalledWith('ids must be numbers');
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it('gives no onExport without the export permission', () => {
    mocks.canExport = false;
    expect(setup().current.onExport).toBeUndefined();
  });

  it('reports busy while the export runs', () => {
    mocks.exportState.isFetching = true;
    expect(setup().current.isBusy).toBe(true);
  });

  it('reports busy while a call runs, with one cache key per row', () => {
    mocks.state.isLoading = true;
    const result = setup();
    expect(result.current.isBusy).toBe(true);
    expect(new Set(mocks.cacheKeys)).toEqual(new Set(['schedule-row-7']));
  });

  it('is not busy when idle', () => {
    expect(setup().current.isBusy).toBe(false);
  });
});

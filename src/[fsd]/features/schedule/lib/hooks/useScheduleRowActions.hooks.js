import { useCallback } from 'react';

import {
  useDeleteScheduleMutation,
  useLazyExportSchedulesQuery,
  usePauseScheduleMutation,
  useResumeScheduleMutation,
  useRunScheduleMutation,
} from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

// Calls, toasts and the busy state of one schedule row. The one fixedCacheKey for
// run, pause, resume and delete is on purpose: the menu and the Enabled switch share the busy state.
export const useScheduleRowActions = row => {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const fixedCacheKey = `schedule-row-${row.id}`;
  const [runSchedule, runState] = useRunScheduleMutation({ fixedCacheKey });
  const [pauseSchedule, pauseState] = usePauseScheduleMutation({ fixedCacheKey });
  const [resumeSchedule, resumeState] = useResumeScheduleMutation({ fixedCacheKey });
  const [deleteSchedule, deleteState] = useDeleteScheduleMutation({ fixedCacheKey });
  const [exportSchedules, exportState] = useLazyExportSchedulesQuery();
  const { checkPermission } = useCheckPermission();

  const perform = useCallback(
    async (call, successText) => {
      try {
        await call.unwrap();
        toastSuccess(successText);
      } catch (error) {
        toastError(buildErrorMessage(error));
      }
    },
    [toastError, toastSuccess],
  );

  const scheduleId = row.id;
  const onRun = useCallback(
    () => perform(runSchedule({ projectId, scheduleId }), 'Run started'),
    [perform, runSchedule, projectId, scheduleId],
  );
  const onPause = useCallback(
    () => perform(pauseSchedule({ projectId, scheduleId }), 'Schedule paused'),
    [perform, pauseSchedule, projectId, scheduleId],
  );
  const onResume = useCallback(
    () => perform(resumeSchedule({ projectId, scheduleId }), 'Schedule resumed'),
    [perform, resumeSchedule, projectId, scheduleId],
  );
  const onDelete = useCallback(
    () => perform(deleteSchedule({ projectId, scheduleId }), `Schedule "${row.name}" deleted`),
    [perform, deleteSchedule, projectId, scheduleId, row.name],
  );

  // One schedule in the list export format; no onExport means no Export item
  const onExport = useCallback(async () => {
    const { data, error } = await exportSchedules({ projectId, ids: [scheduleId] });
    if (error) toastError(buildErrorMessage(error));
    else downloadBlobFile(data.blob, data.filename);
  }, [exportSchedules, projectId, scheduleId, toastError]);

  return {
    onRun,
    onPause,
    onResume,
    onDelete,
    onExport: checkPermission(PERMISSIONS.schedules.export) ? onExport : undefined,
    isBusy:
      runState.isLoading ||
      pauseState.isLoading ||
      resumeState.isLoading ||
      deleteState.isLoading ||
      exportState.isFetching,
  };
};

import { useCallback } from 'react';

import {
  useDeleteScheduleMutation,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
} from '@/[fsd]/entities/schedule/api/scheduleApi.js';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';
import { useToast } from '@/[fsd]/shared/lib/hooks/useToast.hooks';
import { buildErrorMessage } from '@/common/utils';

const VERSION_DELETED_TEXT = 'The version of this schedule was deleted. Choose another version first.';
const ALREADY_RUNNING_TEXT = 'This schedule is already running';

const errorText = error => {
  if (error?.status !== 409) return buildErrorMessage(error);
  const reason = error.data?.reason ?? error.data?.code;
  return reason === 'version_deleted' ? VERSION_DELETED_TEXT : ALREADY_RUNNING_TEXT;
};

// Calls, toasts and the busy state of one schedule row. The per-row cache key
// lets the menu and the Enabled switch share the busy state.
export const useScheduleRowActions = row => {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const fixedCacheKey = `schedule-row-${row.id}`;
  const [runSchedule, runState] = useRunScheduleMutation({ fixedCacheKey });
  const [updateSchedule, updateState] = useUpdateScheduleMutation({ fixedCacheKey });
  const [deleteSchedule, deleteState] = useDeleteScheduleMutation({ fixedCacheKey });

  const perform = useCallback(
    async (call, successText) => {
      try {
        await call.unwrap();
        toastSuccess(successText);
      } catch (error) {
        toastError(errorText(error));
      }
    },
    [toastError, toastSuccess],
  );

  const scheduleId = row.id;
  const onRun = useCallback(
    () => perform(runSchedule({ projectId, scheduleId }), 'Run started'),
    [perform, runSchedule, projectId, scheduleId],
  );
  const setEnabled = useCallback(
    (enabled, text) => perform(updateSchedule({ projectId, scheduleId, enabled }), text),
    [perform, updateSchedule, projectId, scheduleId],
  );
  const onPause = useCallback(() => setEnabled(false, 'Schedule paused'), [setEnabled]);
  const onResume = useCallback(() => setEnabled(true, 'Schedule resumed'), [setEnabled]);
  const onDelete = useCallback(
    () => perform(deleteSchedule({ projectId, scheduleId }), `Schedule "${row.name}" deleted`),
    [perform, deleteSchedule, projectId, scheduleId, row.name],
  );

  return {
    onRun,
    onPause,
    onResume,
    onDelete,
    isBusy: runState.isLoading || updateState.isLoading || deleteState.isLoading,
  };
};

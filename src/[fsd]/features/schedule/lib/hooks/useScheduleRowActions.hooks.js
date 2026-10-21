import { useCallback } from 'react';

import {
  useDeleteScheduleMutation,
  usePauseScheduleMutation,
  useResumeScheduleMutation,
  useRunScheduleMutation,
} from '@/[fsd]/entities/schedule/api/scheduleApi.js';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';
import { useToast } from '@/[fsd]/shared/lib/hooks/useToast.hooks';
import { buildErrorMessage } from '@/common/utils';

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

  return {
    onRun,
    onPause,
    onResume,
    onDelete,
    isBusy: runState.isLoading || pauseState.isLoading || resumeState.isLoading || deleteState.isLoading,
  };
};

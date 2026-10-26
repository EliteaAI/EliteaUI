import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';

// Owner-only approve or reject of a waiting schedule run. Returns undefined for any other
// user, so the run detail shows the buttons disabled. The server still checks the owner.
export const useWaitingRunDecision = ({ schedule, onDecided }) => {
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user.id);
  const { toastError, toastInfo } = useToast();
  const [decideWaitingRun] = RunHistoryApi.useDecideWaitingRunMutation();

  const onHitlResume = useCallback(
    async ({ action, conversationUuid, messageId }) => {
      try {
        await decideWaitingRun({ projectId, conversationUuid, messageId, action }).unwrap();
        onDecided?.();
      } catch (error) {
        if (error?.status === 400 || error?.status === 409) {
          toastInfo('The run no longer waits for approval.');
          onDecided?.();
        } else {
          toastError(buildErrorMessage(error));
        }
      }
    },
    [decideWaitingRun, projectId, onDecided, toastError, toastInfo],
  );

  return schedule?.owner?.id === userId ? onHitlResume : undefined;
};

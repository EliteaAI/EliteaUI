import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { useDecideRunWithoutChatMutation } from '@/[fsd]/entities/schedule';
import { McpAuthHelpers } from '@/[fsd]/features/mcp';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';

// Owner-only approve or reject of a waiting schedule run. Returns undefined for any other
// user, so the run detail shows the buttons disabled. The server still checks the owner.
// A run without a chat (`conversationUuid` empty) is decided through the schedule route with `runId`.
// `authRequest` (from the sign-in pause) switches the call to the mcp_auth resume, with the token of the
// paused server read now. Other stored tokens stay in the browser.
const getPausedServerTokens = serverUrl => {
  const key = McpAuthHelpers.getStorageKey({ serverUrl });
  const token = key ? McpAuthHelpers.getAllTokens()[key] : undefined;
  return token ? { [key]: token } : {};
};

export const useWaitingRunDecision = ({ schedule, onDecided }) => {
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user.id);
  const { toastError, toastInfo } = useToast();
  const [decideWaitingRun] = RunHistoryApi.useDecideWaitingRunMutation();
  const [decideRunWithoutChat] = useDecideRunWithoutChatMutation();

  const onHitlResume = useCallback(
    async ({ action, conversationUuid, messageId, authRequest, runId }) => {
      try {
        if (!conversationUuid) {
          // A run that waits for credentials has no chat; the schedule route decides it
          await decideRunWithoutChat({ projectId, scheduleId: schedule?.id, runId, action }).unwrap();
          onDecided?.();
          return;
        }
        const mcpAuth = authRequest && {
          authorizationRequestId: authRequest.authorizationRequestId,
          toolCallId: authRequest.toolCallId,
          childThreadId: authRequest.childThreadId,
          mcpTokens: getPausedServerTokens(authRequest.serverUrl),
        };
        await decideWaitingRun({
          projectId,
          conversationUuid,
          messageId,
          action,
          ...(mcpAuth && { mcpAuth }),
        }).unwrap();
        onDecided?.();
      } catch (error) {
        if (error?.status === 409) {
          toastInfo('The run no longer waits for approval.');
          onDecided?.();
        } else {
          toastError(buildErrorMessage(error));
        }
      }
    },
    [decideWaitingRun, decideRunWithoutChat, projectId, schedule?.id, onDecided, toastError, toastInfo],
  );

  return schedule?.owner?.id === userId ? onHitlResume : undefined;
};

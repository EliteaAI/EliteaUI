import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import {
  useDecideRunWithoutChatMutation,
  useDecideTestRunWithoutChatMutation,
} from '@/[fsd]/entities/schedule';
import { McpAuthHelpers } from '@/[fsd]/features/mcp';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';

// Owner-only approve or reject of a waiting schedule run. Returns undefined for any other
// user, so the run detail shows the buttons disabled. The server still checks the owner.
// A run without a chat (`conversationUuid` empty) is decided through the schedule route with `runId`.
// `authRequest` (from the sign-in pause) switches the call to the mcp_auth resume. It sends every stored token,
// as the chat resume does, because the resumed run may call other signed-in servers.
// A 409 with `credential_missing` is not a stale run: the run still waits, so the server text is shown.
const CREDENTIAL_MISSING = 'credential_missing';

// A Test run has no schedule: the user who started it (`requested_by`) decides it, through the test run route.
export const useWaitingRunDecision = ({ schedule, run, onDecided }) => {
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user.id);
  const { toastError, toastInfo } = useToast();
  const [decideWaitingRun] = RunHistoryApi.useDecideWaitingRunMutation();
  const [decideRunWithoutChat] = useDecideRunWithoutChatMutation();
  const [decideTestRunWithoutChat] = useDecideTestRunWithoutChatMutation();
  const isTestRun = Boolean(run?.isDraftRun);

  const onHitlResume = useCallback(
    async ({ action, conversationUuid, messageId, authRequest, runId }) => {
      try {
        if (!conversationUuid) {
          // A run that waits for credentials has no chat; a route without a chat decides it
          if (isTestRun) await decideTestRunWithoutChat({ projectId, runId, action }).unwrap();
          else await decideRunWithoutChat({ projectId, scheduleId: schedule?.id, runId, action }).unwrap();
          onDecided?.();
          return;
        }
        const mcpAuth = authRequest && {
          authorizationRequestId: authRequest.authorizationRequestId,
          toolCallId: authRequest.toolCallId,
          childThreadId: authRequest.childThreadId,
          mcpTokens: McpAuthHelpers.getAllTokens(),
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
        if (error?.status === 409 && error?.data?.code === CREDENTIAL_MISSING) {
          toastError(error.data.error || buildErrorMessage(error));
        } else if (error?.status === 409) {
          toastInfo('The run no longer waits for approval.');
          onDecided?.();
        } else {
          toastError(buildErrorMessage(error));
        }
      }
    },
    [
      decideWaitingRun,
      decideRunWithoutChat,
      decideTestRunWithoutChat,
      isTestRun,
      projectId,
      schedule?.id,
      onDecided,
      toastError,
      toastInfo,
    ],
  );

  const mayDecide = isTestRun ? run?.requested_by === userId : schedule?.owner?.id === userId;
  return mayDecide ? onHitlResume : undefined;
};

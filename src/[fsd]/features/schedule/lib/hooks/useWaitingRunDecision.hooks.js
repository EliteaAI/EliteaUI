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

import { getRunDeciderId } from '../helpers/waitingRun.helpers';

// Approve or reject of a waiting run by the user the server names in `decider_id`: the schedule owner at the
// start of a schedule or webhook run (also when an admin started it), the starter of a Test run. Any other user,
// an admin included, gets undefined, so the run detail shows the buttons disabled. The server still checks the caller. This hook sends only approve, reject and the sign-in answers,
// never text.
// A run without a chat (`conversationUuid` empty) is decided through the schedule route with `runId`.
// `authRequest` (from the sign-in pause) switches the call to the mcp_auth resume. It sends every stored token,
// as the chat resume does, because the resumed run may call other signed-in servers.
// `approveAll` (Approve all tools for this run) goes only with a sensitive-tool pause that has a chat: the
// no-chat route and the sign-in resume never send it.
// A 409 with `credential_missing` is not a stale run: the run still waits, so the server text is shown.
// A 409 `approve_all_off` (the project does not allow Run without asking) and a 403 on an approve all (the caller
// did not start the run) also leave the run waiting: the reason is shown and the list loads again, so the box hides.
const CREDENTIAL_MISSING = 'credential_missing';
const APPROVE_ALL_OFF = 'approve_all_off';
const APPROVE_ALL_WEBHOOK = 'approve_all_webhook';
const APPROVE_ALL_NOT_ACTOR = 'Only the person who started this run can approve all its tools.';

// Only the webhook refusal has a server text that fits; any other 403 keeps the fixed sentence
const getApproveAllRefusalText = data => {
  const { code, error: serverText } = data || {};
  return code === APPROVE_ALL_WEBHOOK && serverText ? serverText : APPROVE_ALL_NOT_ACTOR;
};

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
    async ({ action, conversationUuid, messageId, authRequest, runId, approveAll }) => {
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
          ...(approveAll && !mcpAuth && { approveAll }),
          ...(mcpAuth && { mcpAuth }),
        }).unwrap();
        onDecided?.();
      } catch (error) {
        if (error?.status === 409 && [CREDENTIAL_MISSING, APPROVE_ALL_OFF].includes(error?.data?.code)) {
          toastError(error.data.error || buildErrorMessage(error));
          if (error.data.code === APPROVE_ALL_OFF) onDecided?.();
        } else if (error?.status === 403 && approveAll) {
          toastError(getApproveAllRefusalText(error?.data));
          onDecided?.();
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

  const deciderId = getRunDeciderId(run, schedule);
  const mayDecide = deciderId != null && deciderId === userId;
  return mayDecide ? onHitlResume : undefined;
};

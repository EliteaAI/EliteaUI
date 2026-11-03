import { useEffect, useMemo, useState } from 'react';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import {
  useGetDraftTestRunQuery,
  useGetDraftTestRunsQuery,
  useGetScheduleRunQuery,
  useGetScheduleRunsQuery,
} from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils.jsx';

import { findPendingAuthAction, findRunAnswer, isRunActive } from '../helpers';

const POLLING_INTERVAL_MS = 3000;
const RUN_POLLING_INTERVAL_MS = 2000;
// The usage is written a moment after the run ends; the detail is read again for this long
const USAGE_WAIT_MS = 10_000;
// lean: the newest 100 runs, the server maximum per request; page the runs when one schedule keeps more
const RUNS_PAGE = { page: 0, pageSize: 100 };
const NO_RUNS = [];

const isRunning = runs => runs?.some(run => run.status === 'running');

// The page asks before its schedule has loaded; a missing schedule has no runs to load
const toRunsArgs = (projectId, scheduleId) => ({
  args: { projectId, scheduleId, ...RUNS_PAGE },
  skip: !projectId || scheduleId == null,
});

// True once the runs of the schedule have arrived, an empty list included: the scroll and focus wait for it
export const useScheduleRunsLoaded = scheduleId => {
  const projectId = useSelectedProjectId();
  const { args, skip } = toRunsArgs(projectId, scheduleId);
  return !!useGetScheduleRunsQuery(args, { skip }).currentData;
};

// The run total the list API sends with the page; undefined until the runs arrive
export const useScheduleRunsTotal = scheduleId => {
  const projectId = useSelectedProjectId();
  const { args, skip } = toRunsArgs(projectId, scheduleId);
  return useGetScheduleRunsQuery(args, { skip }).currentData?.total;
};

// The runs of one schedule, refreshed every 3 seconds while one of them is running
export const useScheduleRuns = scheduleId => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const { args, skip } = toRunsArgs(projectId, scheduleId);
  const { currentData, isError, error } = useGetScheduleRunsQuery(args, { skip });
  const runs = currentData?.rows ?? NO_RUNS;
  const polling = !isError && isRunning(runs);
  // The same args share one cache entry; this subscription only adds the polling the rows ask for
  useGetScheduleRunsQuery(args, { skip, pollingInterval: polling ? POLLING_INTERVAL_MS : 0 });

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  return runs;
};

// One run with its log, polled every 2 seconds while it runs or waits
export const useScheduleRun = (scheduleId, runId) => {
  const projectId = useSelectedProjectId();

  const args = { projectId, scheduleId, runId };
  const skip = !projectId || runId == null;
  const { currentData, isError, refetch } = useGetScheduleRunQuery(args, { skip });
  const [usageWaitOver, setUsageWaitOver] = useState(false);
  // A finished run with a conversation gets its tokens and cost shortly after the end
  const waitingForUsage =
    !!currentData &&
    !isRunActive(currentData.status) &&
    currentData.conversation_id != null &&
    currentData.summary?.tokens == null &&
    !usageWaitOver;
  const polling = !isError && (isRunActive(currentData?.status) || waitingForUsage);

  useEffect(() => setUsageWaitOver(false), [runId]);
  useEffect(() => {
    if (!waitingForUsage) return undefined;
    const timer = setTimeout(() => setUsageWaitOver(true), USAGE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waitingForUsage]);
  useGetScheduleRunQuery(args, { skip, pollingInterval: polling ? RUN_POLLING_INTERVAL_MS : 0 });

  return { run: currentData, isError, refetch };
};

// The conversation of a paused or ended run: the decision call needs its uuid and paused message
export const useScheduleRunConversation = run => {
  const projectId = useSelectedProjectId();
  const conversationId = run?.conversation_id;
  const status = run?.status;

  // The status is in the args only so that a pause or an end loads the new messages
  const { currentData } = RunHistoryApi.useGetRunHistoryDetailsQuery(
    { projectId, conversationId, status },
    { skip: !projectId || conversationId == null || status === 'running' },
  );

  return useMemo(() => {
    const messages = currentData ? convertConversationToChatHistory(currentData) : [];
    return {
      conversationUuid: currentData?.uuid,
      pausedMessageId: messages.at(-1)?.id,
      authAction: findPendingAuthAction(messages.at(-1)),
      answer: findRunAnswer(messages),
    };
  }, [currentData]);
};

// The Test runs the caller started from the form. The server keeps them on a hidden draft, so they are
// not in the runs of the saved schedule; each row is marked `isDraftRun` and loads its detail from the draft route.
export const useDraftTestRuns = (applicationId, skipRequest = false) => {
  const projectId = useSelectedProjectId();
  const args = { projectId, applicationId, ...RUNS_PAGE };
  const skip = skipRequest || !projectId || applicationId == null;
  const { currentData, isError } = useGetDraftTestRunsQuery(args, { skip });
  const rows = useMemo(
    () => (currentData?.rows ?? NO_RUNS).map(row => ({ ...row, isDraftRun: true })),
    [currentData],
  );
  const polling = !isError && isRunning(rows);
  useGetDraftTestRunsQuery(args, { skip, pollingInterval: polling ? POLLING_INTERVAL_MS : 0 });

  // settled: the list arrived or failed, so a Test Run started now cannot land in the baseline
  return { rows, loaded: !!currentData, failed: isError, settled: skip || !!currentData || isError };
};

// One draft Test run with its log, polled every 2 seconds while it runs or waits
const useDraftTestRun = (applicationId, runId) => {
  const projectId = useSelectedProjectId();
  const args = { projectId, applicationId, runId };
  const skip = !projectId || runId == null || applicationId == null;
  const { currentData, isError, refetch } = useGetDraftTestRunQuery(args, { skip });
  const polling = !isError && isRunActive(currentData?.status);
  useGetDraftTestRunQuery(args, { skip, pollingInterval: polling ? RUN_POLLING_INTERVAL_MS : 0 });

  return { run: currentData, isError, refetch };
};

// The detail of a row of the merged Runs list, from the saved schedule or from the draft
export const useRunDetail = (scheduleId, applicationId, row) => {
  const saved = useScheduleRun(scheduleId, row?.isDraftRun ? undefined : row?.id);
  const draft = useDraftTestRun(applicationId, row?.isDraftRun ? row.id : undefined);

  return row?.isDraftRun ? draft : saved;
};

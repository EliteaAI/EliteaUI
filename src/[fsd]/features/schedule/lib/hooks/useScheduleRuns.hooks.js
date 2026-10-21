import { useEffect } from 'react';

import { useGetScheduleRunsQuery } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils.jsx';

const POLLING_INTERVAL_MS = 3000;
// lean: the newest 100 runs, the server maximum per request; page the runs when one schedule keeps more
const RUNS_PAGE = { page: 0, pageSize: 100 };
const NO_RUNS = [];

const isRunning = runs => runs?.some(run => run.status === 'running');

// The runs of one schedule, refreshed every 3 seconds while one of them is running (R4.3, R4.4)
export const useScheduleRuns = scheduleId => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const args = { projectId, scheduleId, ...RUNS_PAGE };
  const { currentData, isError, error } = useGetScheduleRunsQuery(args, { skip: !projectId });
  const runs = currentData?.rows ?? NO_RUNS;
  const polling = !isError && isRunning(runs);
  // The same args share one cache entry; this subscription only adds the polling the rows ask for
  useGetScheduleRunsQuery(args, { skip: !projectId, pollingInterval: polling ? POLLING_INTERVAL_MS : 0 });

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  return runs;
};

import { memo, useEffect, useMemo, useRef } from 'react';

import { useDispatch } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { useGetScheduleRunsQuery } from '@/[fsd]/entities/schedule';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi.js';
import { buildErrorMessage } from '@/common/utils.jsx';

import { buildScheduleRowDecorator, toHistoryRows, toWord } from '../lib/helpers';

const POLLING_INTERVAL_MS = 3000;
// lean: the newest 100 runs, the server maximum per request; page the runs when one schedule keeps more
const RUNS_PAGE = { page: 0, pageSize: 100 };

const isRunning = rows => rows?.some(run => run.status === 'running');

// Status and reason of a run that created no conversation (R4.2)
const ScheduleRunDetail = memo(({ row }) => (
  <Box sx={{ padding: '1rem' }}>
    <Typography
      variant="headingSmall"
      color="text.primary"
    >
      {toWord(row.entry.status)}
    </Typography>
    {row.entry.reason && (
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {row.entry.reason}
      </Typography>
    )}
  </Box>
));

ScheduleRunDetail.displayName = 'ScheduleRunDetail';

const ScheduleRunList = memo(({ schedule }) => {
  const projectId = useSelectedProjectId();
  const dispatch = useDispatch();
  const { toastError } = useToast();

  const args = { projectId, scheduleId: schedule.id, ...RUNS_PAGE };
  const { currentData, isError, error } = useGetScheduleRunsQuery(args, { skip: !projectId });
  const runs = currentData?.rows;
  const polling = !isError && isRunning(runs);
  // The same args share one cache entry; this subscription only adds the polling the rows ask for
  useGetScheduleRunsQuery(args, { skip: !projectId, pollingInterval: polling ? POLLING_INTERVAL_MS : 0 });

  const { data: application } = useApplicationDetailsQuery(
    { projectId, applicationId: schedule.application_id },
    { skip: !projectId || !schedule.application_id },
  );

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  // The run that just ended has its conversation now: reload the conversation rows (R4.4)
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning(runs))
      dispatch(eliteaApi.util.invalidateTags([RunHistoryApi.HISTORY_ITEMS_TAG]));
    wasRunning.current = isRunning(runs);
  }, [runs, dispatch]);

  const queryParams = useMemo(() => ({ schedule_id: schedule.id }), [schedule.id]);
  const additionalRows = useMemo(() => toHistoryRows(runs), [runs]);
  const decorateRow = useMemo(() => buildScheduleRowDecorator(runs), [runs]);

  return (
    <RunHistoryContainer
      entityId={schedule.application_id}
      source={schedule.entity_type}
      versions={application?.versions}
      queryParams={queryParams}
      additionalRows={additionalRows}
      decorateRow={decorateRow}
      DetailComponent={ScheduleRunDetail}
      layout="stacked"
      ChatMessageListComponent={ChatMessageList}
    />
  );
});

ScheduleRunList.displayName = 'ScheduleRunList';

export default ScheduleRunList;

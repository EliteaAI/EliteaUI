import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import {
  findVisibleIndexSchedule,
  indexScheduleIndicator,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import {
  selectIsSchedulerForListedToolkit,
  selectToolkitScheduler,
} from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';

export const useIndexScheduleIndicator = indexName => {
  const toolkitScheduler = useSelector(selectToolkitScheduler);
  const isSchedulerForListedToolkit = useSelector(selectIsSchedulerForListedToolkit);
  const userId = useSelector(state => state.user.id);

  return useMemo(() => {
    if (!isSchedulerForListedToolkit) return null;
    return indexScheduleIndicator(findVisibleIndexSchedule(toolkitScheduler, indexName, userId)?.schedule);
  }, [indexName, isSchedulerForListedToolkit, toolkitScheduler, userId]);
};

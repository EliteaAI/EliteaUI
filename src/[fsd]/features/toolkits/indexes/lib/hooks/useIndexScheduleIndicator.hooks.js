import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetToolkitIndexOptionsQuery } from '@/[fsd]/entities/schedule';
import { IndexScheduleIndicatorLabel } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { selectIndexesListToolkitId } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

// The clock icon of an index in the listed toolkit; the index summary tells whether the index has a schedule.
// The summary has no tag that a schedule save clears, so each mount asks again.
export const useIndexScheduleIndicator = indexName => {
  const projectId = useSelectedProjectId();
  const toolkitId = useSelector(selectIndexesListToolkitId);
  const { data: options } = useGetToolkitIndexOptionsQuery(
    { projectId, toolkitId },
    { skip: !projectId || !toolkitId || !indexName, refetchOnMountOrArgChange: true },
  );

  return useMemo(() => {
    const isScheduled = options?.some(option => option.name === indexName && option.scheduled);

    return isScheduled ? { enabled: true, tooltip: IndexScheduleIndicatorLabel.enabled } : null;
  }, [options, indexName]);
};

import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { SectionStatusConstants } from '@/[fsd]/features/toolkits/lib/constants';

const { SECTION_STATUS } = SectionStatusConstants;

const INCOMPLETE_STATES = [IndexStatuses.cancelled, IndexStatuses.partlyOk];

const isAbandonedRun = index => index?.stale && index?.metadata?.state === IndexStatuses.progress;

const isFailedRun = index => index?.metadata?.state === IndexStatuses.fail || isAbandonedRun(index);

const isIncompleteRun = index => INCOMPLETE_STATES.includes(index?.metadata?.state);

const pluralizeIndexes = count => `${count} ${count === 1 ? 'index' : 'indexes'}`;

const buildStatus = indexes => {
  const failedCount = indexes.filter(isFailedRun).length;
  if (failedCount > 0) {
    return { status: SECTION_STATUS.error, message: `${pluralizeIndexes(failedCount)} failed to build` };
  }

  const incompleteCount = indexes.filter(isIncompleteRun).length;
  if (incompleteCount > 0) {
    return {
      status: SECTION_STATUS.warning,
      message: `${pluralizeIndexes(incompleteCount)} did not complete`,
    };
  }

  return null;
};

export const useIndexesSectionSummary = toolkitId => {
  const { data, toolkitId: loadedToolkitId } = useSelector(selectIndexesList);

  const indexesOfThisToolkit = useMemo(
    () => (String(loadedToolkitId) === String(toolkitId) ? (data ?? []) : []),
    [data, loadedToolkitId, toolkitId],
  );

  return useMemo(
    () => ({
      count: indexesOfThisToolkit.length,
      label: pluralizeIndexes(indexesOfThisToolkit.length),
      status: buildStatus(indexesOfThisToolkit),
    }),
    [indexesOfThisToolkit],
  );
};

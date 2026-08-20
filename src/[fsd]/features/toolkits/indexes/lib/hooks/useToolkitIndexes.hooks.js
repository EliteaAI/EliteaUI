import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';

const NO_INDEXES = [];

const pluralizeIndexes = count => `${count} ${count === 1 ? 'index' : 'indexes'}`;

export const useToolkitIndexes = toolkitId => {
  const { data, toolkitId: loadedToolkitId, isLoading } = useSelector(selectIndexesList);

  const isSliceForThisToolkit = String(loadedToolkitId) === String(toolkitId);
  const indexes = isSliceForThisToolkit ? (data ?? NO_INDEXES) : NO_INDEXES;

  return useMemo(
    () => ({
      indexes,
      count: indexes.length,
      label: pluralizeIndexes(indexes.length),
      isLoading: isLoading || !isSliceForThisToolkit,
    }),
    [indexes, isLoading, isSliceForThisToolkit],
  );
};

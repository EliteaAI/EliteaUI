import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';

export const useIndexNameValidation = () => {
  const { data: indexesList } = useSelector(selectIndexesList);

  const [indexNameError, setIndexNameError] = useState(null);

  const clearIndexNameError = () => setIndexNameError(null);

  const updateIndexNameError = name => setIndexNameError(`Index "${name}" already exists`);

  const isIndexNameValid = useCallback(
    name => !indexesList.some(idx => idx.metadata.collection === name),
    [indexesList],
  );

  return { indexNameError, clearIndexNameError, updateIndexNameError, isIndexNameValid };
};

import { useMemo } from 'react';

import { useAuthorNameFromUrl } from './useSearchParamValue.hooks';

export const useAuthorName = userName => {
  const authorNameFromUrl = useAuthorNameFromUrl();
  const authorName = useMemo(() => authorNameFromUrl || userName, [authorNameFromUrl, userName]);
  return authorName;
};

import { useMemo } from 'react';

import { useAuthorNameFromUrl } from '@/hooks/useSearchParamValue';

export const useAuthorName = userName => {
  const authorNameFromUrl = useAuthorNameFromUrl();
  const authorName = useMemo(() => authorNameFromUrl || userName, [authorNameFromUrl, userName]);
  return authorName;
};

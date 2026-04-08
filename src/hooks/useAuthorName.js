import { useMemo } from 'react';

import { useAuthorNameFromUrl } from './useSearchParamValue';

export default function useAuthorName(userName) {
  const authorNameFromUrl = useAuthorNameFromUrl();
  const authorName = useMemo(() => authorNameFromUrl || userName, [authorNameFromUrl, userName]);
  return authorName;
}

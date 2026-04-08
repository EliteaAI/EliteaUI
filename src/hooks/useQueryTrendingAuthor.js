import { useEffect } from 'react';

import { useSelector } from 'react-redux';

import { useLazyTrendingAuthorsDetailsQuery } from '@/api/trendingAuthor';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import useViewMode from '@/hooks/useViewMode';

const useQueryTrendingAuthor = projectId => {
  const viewMode = useViewMode();
  const authorId = useAuthorIdFromUrl();
  const { id: userId } = useSelector(state => state.user);
  const [getAuthorDetail, { isLoading: isLoadingAuthor }] = useLazyTrendingAuthorsDetailsQuery();
  const { id: authorIdFromState } = useSelector(state => state.trendingAuthor.authorDetails);

  useEffect(() => {
    if (authorId || userId) {
      getAuthorDetail(authorId || userId);
    }
  }, [authorId, authorIdFromState, getAuthorDetail, projectId, userId, viewMode]);

  return {
    isLoadingAuthor,
    authorId,
  };
};

export default useQueryTrendingAuthor;

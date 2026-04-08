import { useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { useLazyTrendingAuthorsDetailsQuery } from '@/api/trendingAuthor';

const useQueryAuthor = () => {
  const { id: userId } = useSelector(state => state.user);
  const [getAuthorDetail, { isFetching }] = useLazyTrendingAuthorsDetailsQuery();

  const refetch = useCallback(() => {
    if (userId !== null && userId !== undefined) {
      getAuthorDetail(userId);
    }
  }, [getAuthorDetail, userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    isFetching,
    refetch,
  };
};

export default useQueryAuthor;

import { useEffect, useMemo, useRef, useState } from 'react';

import { useArtifactListQuery, useLazyArtifactListQuery } from '@/api/artifacts';

/**
 * Fetches all pages of an artifact bucket in the background.
 * Returns the accumulated flat contents array, loading state, and error state.
 */
export const useAllArtifacts = ({ projectId, bucket, skip = false }) => {
  const skipQuery =
    skip ||
    !projectId ||
    !bucket ||
    typeof bucket !== 'string' ||
    bucket.trim() === '' ||
    projectId === 'null' ||
    projectId === 'undefined';

  const {
    data: firstPage,
    isFetching,
    isError,
    error,
    refetch,
  } = useArtifactListQuery(
    { projectId, bucket },
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      pollingInterval: 0,
      skip: skipQuery,
    },
  );

  const [fetchNextPage] = useLazyArtifactListQuery();
  const [extraContents, setExtraContents] = useState([]);
  const prevBucketRef = useRef(bucket);
  const firstPageDataRef = useRef(null);

  useEffect(() => {
    if (prevBucketRef.current !== bucket) {
      prevBucketRef.current = bucket;
      setExtraContents([]);
      firstPageDataRef.current = null;
    }
  }, [bucket]);

  useEffect(() => {
    if (!firstPage || firstPage === firstPageDataRef.current) return;
    firstPageDataRef.current = firstPage;
    setExtraContents([]);

    if (!firstPage.isTruncated) return;

    let cancelled = false;
    let token = firstPage.nextContinuationToken;
    const accumulated = [];

    const fetchAll = async () => {
      while (token && !cancelled) {
        const result = await fetchNextPage({ projectId, bucket, continuationToken: token });
        if (cancelled) break;
        if (result.data) {
          accumulated.push(...(result.data.contents ?? []));
          setExtraContents([...accumulated]);
          token = result.data.isTruncated ? result.data.nextContinuationToken : null;
        } else {
          break;
        }
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [firstPage, fetchNextPage, projectId, bucket]);

  const data = useMemo(() => {
    if (!firstPage) return firstPage;
    return { ...firstPage, contents: [...(firstPage.contents ?? []), ...extraContents] };
  }, [firstPage, extraContents]);

  return { data, isFetching, isError, error, refetch };
};

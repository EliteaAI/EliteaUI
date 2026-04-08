import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PropTypes from 'prop-types';

export default function ListInfiniteMoreLoader({
  listCurrentSize,
  totalAvailableCount = 0,
  onLoadMore,
  resetPageDependencies,
  isLoading = false,
}) {
  const loadingMoreRef = useRef(null);
  const observerRef = useRef(null);
  const [prevCount, setPrevCount] = useState(0);
  const isLoadingRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  const hasMoreData = useMemo(
    () => !!totalAvailableCount && totalAvailableCount > listCurrentSize,
    [listCurrentSize, totalAvailableCount],
  );

  // Update loading state ref to ensure we have the latest state in observer
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Enhanced load more handler with better state management
  const handleLoadMore = useCallback(() => {
    if (isLoadingRef.current || hasTriggeredRef.current || !hasMoreData) {
      return;
    }

    hasTriggeredRef.current = true;
    setPrevCount(listCurrentSize);
    onLoadMore();
  }, [hasMoreData, listCurrentSize, onLoadMore]);

  // Reset trigger flag when loading completes or list size changes
  useEffect(() => {
    if (!isLoading && listCurrentSize !== prevCount) {
      hasTriggeredRef.current = false;
    }
  }, [isLoading, listCurrentSize, prevCount]);

  // Create and manage intersection observer
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreData && !isLoadingRef.current && !hasTriggeredRef.current) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '50px', // Increased margin for better UX
        threshold: 0.1,
      },
    );

    observerRef.current = observer;

    const loadingDiv = loadingMoreRef.current;
    if (loadingDiv && hasMoreData) {
      observer.observe(loadingDiv);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMoreData, handleLoadMore]);

  // Reset state when dependencies change
  useEffect(() => {
    setPrevCount(0);
    hasTriggeredRef.current = false;
  }, [resetPageDependencies]);

  // Force re-check when hasMoreData changes from false to true
  useEffect(() => {
    if (hasMoreData && !isLoading && loadingMoreRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (observerRef.current && loadingMoreRef.current) {
          observerRef.current.unobserve(loadingMoreRef.current);
          observerRef.current.observe(loadingMoreRef.current);
        }
      }, 100);
    }
  }, [hasMoreData, isLoading]);

  return (
    <>
      {hasMoreData && (
        <div
          ref={loadingMoreRef}
          style={{
            width: '100%',
            height: '20px', // Slightly increased height
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
          data-testid="infinite-loader-trigger"
        />
      )}
    </>
  );
}

ListInfiniteMoreLoader.propTypes = {
  listCurrentSize: PropTypes.number.isRequired,
  totalAvailableCount: PropTypes.number,
  onLoadMore: PropTypes.func.isRequired,
  resetPageDependencies: PropTypes.any,
  isLoading: PropTypes.bool,
};

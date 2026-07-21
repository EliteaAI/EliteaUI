import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AgentHubConstants } from '@/[fsd]/features/agent-hub/lib/constants';
import { useGetAgentCategoriesQuery } from '@/[fsd]/features/agent/api/agentCategoriesApi';
import { useLazyPublicApplicationsListQuery } from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import {
  actions as agentHubActions,
  selectAgentHubData,
  selectIsCacheValid,
  selectLastRefreshedAt,
} from '@/slices/agentHub';

/** Single bulk-fetch limit — covers realistic max deployments (≤200 published agents). */
const ALL_AGENTS_LIMIT = 1000;
/** Search results limit. */
const SEARCH_AGENTS_LIMIT = 100;

/**
 * Custom hook to manage Agent Studio data fetching and state.
 *
 * Strategy: fetch ALL published agents in a single request, then bucket them
 * client-side by their category tag. This avoids N separate requests (one per
 * category) and restores the pre-EL-5204 performance profile.
 *
 * Special buckets (Trending, My Liked) still use their own targeted requests.
 * Redux caching (60 min) prevents re-fetching on navigation.
 */
export const useAgentHubData = (query, selectedTagNames) => {
  const dispatch = useDispatch();
  const { applicationsByTag, totalCountsByTag, currentPageByTag } = useSelector(selectAgentHubData);
  const isCacheValid = useSelector(state => selectIsCacheValid(state, query));
  const lastRefreshedAt = useSelector(selectLastRefreshedAt);

  const [loadingTags, setLoadingTags] = useState(new Set());
  const isRefetchingTrendingRef = useRef(false);
  const lastQueryRef = useRef(query);
  const stateRef = useRef({ applicationsByTag, totalCountsByTag, currentPageByTag });
  stateRef.current = { applicationsByTag, totalCountsByTag, currentPageByTag };

  const { data: categoriesData, isFetching: isFetchingCategories } = useGetAgentCategoriesQuery({
    projectId: PUBLIC_PROJECT_ID,
  });
  const categoryNames = useMemo(() => (categoriesData?.categories || []).map(c => c.name), [categoriesData]);

  const [fetchApplications] = useLazyPublicApplicationsListQuery();

  const updateApplicationData = useCallback(
    (categoryName, page, rows, total) => {
      if (categoryName === AgentHubConstants.TRENDING_CATEGORY) {
        isRefetchingTrendingRef.current = false;
      }
      dispatch(agentHubActions.updateCategoryData({ categoryName, page, rows, total }));
    },
    [dispatch],
  );

  const setLoading = useCallback((id, isLoading) => {
    setLoadingTags(prev => {
      const s = new Set(prev);
      isLoading ? s.add(id) : s.delete(id);
      return s;
    });
  }, []);

  /**
   * Bucket a flat list of apps into category buckets using their tags.
   * Each app is placed in the bucket matching its category tag name.
   * Apps with no active-category tag fall into "Other".
   */
  const bucketAppsByCategory = useCallback((rows, activeCategoryNames) => {
    const activeSet = new Set(activeCategoryNames);
    const buckets = {};

    rows.forEach(app => {
      const categoryTag = app.tags?.find(tag => activeSet.has(tag.name));
      const bucket = categoryTag ? categoryTag.name : AgentHubConstants.OTHER_CATEGORY;
      if (!buckets[bucket]) buckets[bucket] = [];
      buckets[bucket].push(app);
    });

    return buckets;
  }, []);

  /**
   * Single bulk fetch: one request for all published agents, categorized client-side.
   */
  const fetchAllAndCategorize = useCallback(
    async activeCategoryNames => {
      setLoading('bulk_fetch', true);
      try {
        const result = await fetchApplications({
          page: 0,
          pageSize: ALL_AGENTS_LIMIT,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
          },
        }).unwrap();

        if (!result?.rows) return;

        const buckets = bucketAppsByCategory(result.rows, activeCategoryNames);

        Object.entries(buckets).forEach(([categoryName, rows]) => {
          updateApplicationData(categoryName, 0, rows, rows.length);
        });
      } finally {
        setLoading('bulk_fetch', false);
      }
    },
    [fetchApplications, query, setLoading, bucketAppsByCategory, updateApplicationData],
  );

  const rebuildCategoryToDepth = useCallback(
    (categoryName, rows, total, depth) => {
      dispatch(agentHubActions.replaceCategoryData({ categoryName, page: depth, rows, total }));
    },
    [dispatch],
  );

  const fetchTrendingApplications = useCallback(
    async (page = 0, depth = null) => {
      const isRebuild = depth !== null;
      const category = AgentHubConstants.TRENDING_CATEGORY;
      if (!isRebuild) setLoading(category, true);
      try {
        const result = await fetchApplications({
          page: isRebuild ? 0 : page,
          pageSize: isRebuild ? (depth + 1) * AgentHubConstants.PAGE_SIZE : AgentHubConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            trend_start_period: AgentHubConstants.TRENDING_START_PERIOD,
            sort_by: 'likes',
            sort_order: 'desc',
          },
        }).unwrap();

        if (result?.rows) {
          if (isRebuild) rebuildCategoryToDepth(category, result.rows, result.total, depth);
          else updateApplicationData(category, page, result.rows, result.total);
        }
      } finally {
        if (!isRebuild) setLoading(category, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData, rebuildCategoryToDepth],
  );

  const fetchMyLikedApplications = useCallback(
    async (page = 0, depth = null) => {
      const isRebuild = depth !== null;
      const category = AgentHubConstants.MY_LIKED_CATEGORY;
      if (!isRebuild) setLoading(category, true);
      try {
        const result = await fetchApplications({
          page: isRebuild ? 0 : page,
          pageSize: isRebuild ? (depth + 1) * AgentHubConstants.PAGE_SIZE : AgentHubConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            my_liked: true,
          },
        }).unwrap();

        if (result?.rows) {
          if (isRebuild) rebuildCategoryToDepth(category, result.rows, result.total, depth);
          else updateApplicationData(category, page, result.rows, result.total);
        }
      } finally {
        if (!isRebuild) setLoading(category, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData, rebuildCategoryToDepth],
  );

  const resetSearchByTag = useCallback(() => {
    dispatch(agentHubActions.clearCache());
  }, [dispatch]);

  /**
   * Search: single request for up to 100 results, then bucket client-side.
   */
  const searchAndCategorize = useCallback(async () => {
    setLoading('global_search', true);
    resetSearchByTag();
    try {
      const result = await fetchApplications({
        page: 0,
        pageSize: SEARCH_AGENTS_LIMIT,
        params: {
          query,
          statuses: CollectionStatus.Published,
          agents_type: 'classic',
        },
      }).unwrap();

      if (!result?.rows) return;

      const buckets = bucketAppsByCategory(result.rows, categoryNames);

      dispatch(
        agentHubActions.setApplicationsData({
          applicationsByTag: buckets,
          totalCountsByTag: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
          currentPageByTag: {},
          query,
        }),
      );
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error('Failed to perform global search:', error);
      }
    } finally {
      setLoading('global_search', false);
    }
  }, [fetchApplications, query, setLoading, resetSearchByTag, bucketAppsByCategory, categoryNames, dispatch]);

  /**
   * Exposed for load-more compatibility. Since all category data is fetched
   * upfront (totalCount == items.length), this is only called on manual refresh.
   */
  const fetchApplicationsForCategoryName = useCallback(async () => {
    await fetchAllAndCategorize(categoryNames);
  }, [fetchAllAndCategorize, categoryNames]);

  const refresh = useCallback(() => {
    if (query) return;
    if (categoryNames.length === 0) return;
    const trendingDepth = currentPageByTag[AgentHubConstants.TRENDING_CATEGORY] || 0;
    const myLikedDepth = currentPageByTag[AgentHubConstants.MY_LIKED_CATEGORY] || 0;
    Promise.all([
      fetchAllAndCategorize(categoryNames),
      fetchTrendingApplications(0, trendingDepth),
      fetchMyLikedApplications(0, myLikedDepth),
    ]).catch(() => {});
  }, [
    query,
    categoryNames,
    currentPageByTag,
    fetchAllAndCategorize,
    fetchTrendingApplications,
    fetchMyLikedApplications,
  ]);

  // Main data fetching effect
  useEffect(() => {
    if (query !== lastQueryRef.current) {
      lastQueryRef.current = query;
    }

    if (categoryNames.length === 0) return;

    if (query) {
      if (!isCacheValid) {
        searchAndCategorize();
      }
      return;
    }

    if (!isCacheValid) {
      fetchAllAndCategorize(categoryNames);
      fetchTrendingApplications(0);
      fetchMyLikedApplications(0);
    }
  }, [
    categoryNames,
    query,
    isCacheValid,
    searchAndCategorize,
    fetchAllAndCategorize,
    fetchTrendingApplications,
    fetchMyLikedApplications,
  ]);

  const filteredApplicationsByTag = useMemo(() => {
    if (selectedTagNames.length === 0) return applicationsByTag;
    const filtered = {};
    selectedTagNames.forEach(tagName => {
      if (applicationsByTag[tagName]) filtered[tagName] = applicationsByTag[tagName];
    });
    return filtered;
  }, [applicationsByTag, selectedTagNames]);

  const filteredTotalCountsByTag = useMemo(() => {
    if (selectedTagNames.length === 0) return totalCountsByTag;
    const filtered = {};
    selectedTagNames.forEach(tagName => {
      if (totalCountsByTag[tagName] !== undefined) filtered[tagName] = totalCountsByTag[tagName];
    });
    return filtered;
  }, [totalCountsByTag, selectedTagNames]);

  const isFetching = useMemo(
    () => loadingTags.size > 0 || isFetchingCategories,
    [loadingTags.size, isFetchingCategories],
  );

  const refetchTrendingApplications = useCallback(
    (conditionForRefetching, updateFn, currentApp, currentLikes) => {
      if (conditionForRefetching) {
        const updatedApp = updateFn(currentApp);
        const newLikes = updatedApp?.likes || 0;
        if (newLikes !== currentLikes) {
          isRefetchingTrendingRef.current = true;
          fetchTrendingApplications(0).finally(() => {
            isRefetchingTrendingRef.current = false;
          });
        }
      }
    },
    [fetchTrendingApplications],
  );

  const updateApplicationInState = useCallback(
    (applicationId, updateFn) => {
      const { applicationsByTag: currentAppsByTag } = stateRef.current;
      const trendingCategory = currentAppsByTag[AgentHubConstants.TRENDING_CATEGORY] || [];
      const currentApp = trendingCategory.find(app => app.id === applicationId);
      const currentLikes = currentApp?.likes || 0;
      const conditionForRefetching = !!currentApp && !isRefetchingTrendingRef.current;

      dispatch(agentHubActions.updateApplicationInCategories({ applicationId, updateFn }));

      refetchTrendingApplications(conditionForRefetching, updateFn, currentApp, currentLikes);
    },
    [dispatch, refetchTrendingApplications],
  );

  const addToMyLiked = useCallback(
    application => {
      dispatch(
        agentHubActions.addToMyLiked({
          application,
          categoryName: AgentHubConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  const removeFromMyLiked = useCallback(
    applicationId => {
      dispatch(
        agentHubActions.removeFromMyLiked({
          applicationId,
          categoryName: AgentHubConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  return {
    categoryNames,
    applicationsByTag: filteredApplicationsByTag,
    totalCountsByTag: filteredTotalCountsByTag,
    currentPageByTag,
    loadingTags,
    isFetching,
    isCacheValid,
    lastRefreshedAt,
    fetchApplicationsForCategoryName,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    updateApplicationInState,
    addToMyLiked,
    removeFromMyLiked,
    refresh,
  };
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AgentHubConstants } from '@/[fsd]/features/agent-hub/lib/constants';
import { useGetAgentCategoriesQuery } from '@/[fsd]/features/agent/api/agentCategoriesApi';
import { useLazyPublicApplicationsListQuery } from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import { actions as agentHubActions, selectAgentHubData, selectIsCacheValid } from '@/slices/agentHub';

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

  const [loadingTags, setLoadingTags] = useState(new Set());
  const [refreshingTags, setRefreshingTags] = useState(new Set());
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

  const setRefreshing = useCallback((id, isRefreshing) => {
    setRefreshingTags(prev => {
      const s = new Set(prev);
      isRefreshing ? s.add(id) : s.delete(id);
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

  const fetchTrendingApplications = useCallback(
    async (page = 0) => {
      setLoading(AgentHubConstants.TRENDING_CATEGORY, true);
      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentHubConstants.PAGE_SIZE,
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
          updateApplicationData(AgentHubConstants.TRENDING_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(AgentHubConstants.TRENDING_CATEGORY, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const fetchMyLikedApplications = useCallback(
    async (page = 0) => {
      setLoading(AgentHubConstants.MY_LIKED_CATEGORY, true);
      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentHubConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            my_liked: true,
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(AgentHubConstants.MY_LIKED_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(AgentHubConstants.MY_LIKED_CATEGORY, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const fetchCategoryScoped = useCallback(
    async categoryName => {
      const result = await fetchApplications({
        page: 0,
        pageSize: ALL_AGENTS_LIMIT,
        params: {
          query,
          statuses: CollectionStatus.Published,
          agents_type: 'classic',
          category: categoryName,
        },
      }).unwrap();

      if (result?.rows) {
        updateApplicationData(categoryName, 0, result.rows, result.rows.length);
      }
    },
    [fetchApplications, query, updateApplicationData],
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

  const updateApplicationInCategoriesHelper = useCallback((appsByTag, applicationId, updateFn) => {
    const updated = { ...appsByTag };
    Object.keys(updated).forEach(category => {
      updated[category] = updated[category].map(app => (app.id === applicationId ? updateFn(app) : app));
    });
    return updated;
  }, []);

  const updateApplicationInState = useCallback(
    (applicationId, updateFn) => {
      const {
        applicationsByTag: currentAppsByTag,
        totalCountsByTag: currentTotals,
        currentPageByTag: currentPages,
      } = stateRef.current;
      const trendingCategory = currentAppsByTag[AgentHubConstants.TRENDING_CATEGORY] || [];
      const currentApp = trendingCategory.find(app => app.id === applicationId);
      const currentLikes = currentApp?.likes || 0;
      const conditionForRefetching = !!currentApp && !isRefetchingTrendingRef.current;

      const updated = updateApplicationInCategoriesHelper(currentAppsByTag, applicationId, updateFn);

      dispatch(
        agentHubActions.setApplicationsData({
          applicationsByTag: updated,
          totalCountsByTag: currentTotals,
          currentPageByTag: currentPages,
          query,
        }),
      );

      refetchTrendingApplications(conditionForRefetching, updateFn, currentApp, currentLikes);
    },
    [query, dispatch, updateApplicationInCategoriesHelper, refetchTrendingApplications],
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

  const onRefresh = useCallback(
    async categoryName => {
      setRefreshing(categoryName, true);
      try {
        if (categoryName === AgentHubConstants.TRENDING_CATEGORY) {
          await fetchTrendingApplications(0);
        } else if (categoryName === AgentHubConstants.MY_LIKED_CATEGORY) {
          await fetchMyLikedApplications(0);
        } else {
          await fetchCategoryScoped(categoryName);
        }
      } finally {
        setRefreshing(categoryName, false);
      }
    },
    [setRefreshing, fetchTrendingApplications, fetchMyLikedApplications, fetchCategoryScoped],
  );

  return {
    categoryNames,
    applicationsByTag: filteredApplicationsByTag,
    totalCountsByTag: filteredTotalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchApplicationsForCategoryName,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    updateApplicationInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  };
};

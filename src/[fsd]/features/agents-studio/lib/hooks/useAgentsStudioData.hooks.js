import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useGetAgentCategoriesQuery } from '@/[fsd]/features/agent/api/agentCategoriesApi';
import { AgentsStudioConstants } from '@/[fsd]/features/agents-studio/lib/constants';
import { useLazyPublicApplicationsListQuery } from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import {
  actions as agentsStudioActions,
  selectAgentsStudioData,
  selectIsCacheValid,
} from '@/slices/agentsStudio';

/**
 * Custom hook to manage Agent Studio data fetching and state.
 *
 * Categories are a predefined, constrained set (served by the agent categories
 * endpoint). Each category is fetched independently from the public listing via
 * the server-side `category` filter (which also resolves the "Other" catch-all),
 * plus the special Trending and My Liked buckets.
 *
 * Optimization: Uses Redux for state persistence across navigation. Data is
 * cached for 5 minutes, preventing unnecessary API calls when users navigate
 * away and return to the Agent Studio page.
 */
export const useAgentsStudioData = (query, selectedTagNames) => {
  const dispatch = useDispatch();
  const { applicationsByTag, totalCountsByTag, currentPageByTag } = useSelector(selectAgentsStudioData);
  const isCacheValid = useSelector(state => selectIsCacheValid(state, query));

  const [loadingTags, setLoadingTags] = useState(new Set());
  const [refreshingTags, setRefreshingTags] = useState(new Set());
  const isRefetchingTrendingRef = useRef(false);
  const fetchedCategoryNamesRef = useRef(new Set());
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
      if (categoryName === AgentsStudioConstants.TRENDING_CATEGORY) {
        isRefetchingTrendingRef.current = false;
      }

      dispatch(
        agentsStudioActions.updateCategoryData({
          categoryName,
          page,
          rows,
          total,
        }),
      );
    },
    [dispatch],
  );

  const setLoading = useCallback((categoryId, isLoading) => {
    setLoadingTags(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  }, []);

  const setRefreshing = useCallback((categoryId, isRefreshing) => {
    setRefreshingTags(prev => {
      const newSet = new Set(prev);
      if (isRefreshing) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  }, []);

  const fetchApplicationsForCategoryName = useCallback(
    async (categoryName, page = 0) => {
      setLoading(categoryName, true);

      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentsStudioConstants.PAGE_SIZE,
          params: {
            query,
            category: categoryName,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(categoryName, page, result.rows, result.total);
        }
      } finally {
        setLoading(categoryName, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const fetchTrendingApplications = useCallback(
    async (page = 0) => {
      setLoading(AgentsStudioConstants.TRENDING_CATEGORY, true);

      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentsStudioConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            trend_start_period: AgentsStudioConstants.TRENDING_START_PERIOD,
            sort_by: 'likes',
            sort_order: 'desc',
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(AgentsStudioConstants.TRENDING_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(AgentsStudioConstants.TRENDING_CATEGORY, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const fetchMyLikedApplications = useCallback(
    async (page = 0) => {
      setLoading(AgentsStudioConstants.MY_LIKED_CATEGORY, true);

      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentsStudioConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            my_liked: true,
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(AgentsStudioConstants.MY_LIKED_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(AgentsStudioConstants.MY_LIKED_CATEGORY, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const resetSearchByTag = useCallback(() => {
    dispatch(agentsStudioActions.clearCache());
  }, [dispatch]);

  const fetchAllCategories = useCallback(async () => {
    if (categoryNames.length === 0) return;
    await Promise.all(categoryNames.map(name => fetchApplicationsForCategoryName(name, 0)));
  }, [categoryNames, fetchApplicationsForCategoryName]);

  const searchAndCategorize = useCallback(async () => {
    setLoading('global_search', true);
    resetSearchByTag();

    try {
      await Promise.all(categoryNames.map(name => fetchApplicationsForCategoryName(name, 0)));
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error('Failed to perform global search:', error);
      }
    } finally {
      setLoading('global_search', false);
    }
  }, [categoryNames, fetchApplicationsForCategoryName, setLoading, resetSearchByTag]);

  // Main data fetching effect - uses Redux cache when valid
  useEffect(() => {
    // If query changed, reset tracking
    if (query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      fetchedCategoryNamesRef.current = new Set();
    }

    // Skip until the predefined category list has loaded
    if (categoryNames.length === 0) {
      return;
    }

    if (query) {
      if (!isCacheValid) {
        searchAndCategorize();
      }
      return;
    }

    if (!isCacheValid) {
      // Cache is invalid — fetch every predefined category plus the special buckets
      fetchedCategoryNamesRef.current = new Set();
      fetchAllCategories();
      fetchTrendingApplications(0);
      fetchMyLikedApplications(0);
      categoryNames.forEach(name => fetchedCategoryNamesRef.current.add(name));
    } else {
      // Cache is valid - initialize tracking from Redux if empty
      if (fetchedCategoryNamesRef.current.size === 0) {
        Object.keys(stateRef.current.applicationsByTag).forEach(categoryName => {
          if (stateRef.current.applicationsByTag[categoryName]?.length > 0) {
            fetchedCategoryNamesRef.current.add(categoryName);
          }
        });
      }

      // Fetch only categories not yet present
      const newCategories = categoryNames.filter(name => !fetchedCategoryNamesRef.current.has(name));
      if (newCategories.length > 0) {
        Promise.all(
          newCategories.map(name => {
            fetchedCategoryNamesRef.current.add(name);
            return fetchApplicationsForCategoryName(name, 0);
          }),
        );
      }
    }
  }, [
    categoryNames,
    query,
    isCacheValid,
    searchAndCategorize,
    fetchAllCategories,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    fetchApplicationsForCategoryName,
  ]);

  const filteredApplicationsByTag = useMemo(() => {
    if (selectedTagNames.length === 0) {
      return applicationsByTag;
    }

    const filtered = {};
    selectedTagNames.forEach(tagName => {
      if (applicationsByTag[tagName]) {
        filtered[tagName] = applicationsByTag[tagName];
      }
    });
    return filtered;
  }, [applicationsByTag, selectedTagNames]);

  const filteredTotalCountsByTag = useMemo(() => {
    if (selectedTagNames.length === 0) {
      return totalCountsByTag;
    }

    const filtered = {};
    selectedTagNames.forEach(tagName => {
      if (totalCountsByTag[tagName] !== undefined) {
        filtered[tagName] = totalCountsByTag[tagName];
      }
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
      updated[category] = updated[category].map(app => {
        if (app.id === applicationId) {
          return updateFn(app);
        }
        return app;
      });
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
      const trendingCategory = currentAppsByTag[AgentsStudioConstants.TRENDING_CATEGORY] || [];
      const currentApp = trendingCategory.find(app => app.id === applicationId);
      const isInTrending = !!currentApp;
      const currentLikes = currentApp?.likes || 0;
      const conditionForRefetching = isInTrending && currentApp && !isRefetchingTrendingRef.current;

      const updated = updateApplicationInCategoriesHelper(currentAppsByTag, applicationId, updateFn);

      dispatch(
        agentsStudioActions.setApplicationsData({
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
        agentsStudioActions.addToMyLiked({
          application,
          categoryName: AgentsStudioConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  const removeFromMyLiked = useCallback(
    applicationId => {
      dispatch(
        agentsStudioActions.removeFromMyLiked({
          applicationId,
          categoryName: AgentsStudioConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  const onRefresh = useCallback(
    async categoryName => {
      setRefreshing(categoryName, true);
      try {
        if (categoryName === AgentsStudioConstants.TRENDING_CATEGORY) {
          await fetchTrendingApplications(0);
        } else if (categoryName === AgentsStudioConstants.MY_LIKED_CATEGORY) {
          await fetchMyLikedApplications(0);
        } else {
          await fetchApplicationsForCategoryName(categoryName, 0);
        }
      } finally {
        setRefreshing(categoryName, false);
      }
    },
    [setRefreshing, fetchTrendingApplications, fetchMyLikedApplications, fetchApplicationsForCategoryName],
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

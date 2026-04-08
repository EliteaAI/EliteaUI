import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AgentsStudioConstants } from '@/[fsd]/features/agents-studio/lib/constants';
import { TagHelpers } from '@/[fsd]/features/agents-studio/lib/helpers';
import { useLazyTagListQuery } from '@/api';
import { useLazyPublicApplicationsListQuery } from '@/api/applications';
import { CollectionStatus } from '@/common/constants';
import {
  actions as agentsStudioActions,
  selectAgentsStudioData,
  selectIsCacheValid,
} from '@/slices/agentsStudio';

/**
 * Custom hook to manage Agent Studio data fetching and state
 *
 * Optimization: Uses Redux for state persistence across navigation.
 * Data is cached for 5 minutes, preventing unnecessary API calls when
 * users navigate away and return to the Agent Studio page.
 */
export const useAgentsStudioData = (query, selectedTagNames) => {
  const dispatch = useDispatch();
  const { applicationsByTag, totalCountsByTag, currentPageByTag } = useSelector(selectAgentsStudioData);
  const isCacheValid = useSelector(state => selectIsCacheValid(state, query));

  const [loadingTags, setLoadingTags] = useState(new Set());
  const [refreshingTags, setRefreshingTags] = useState(new Set());
  const [allTags, setAllTags] = useState([]);
  const [tags, setTags] = useState([]);
  const isRefetchingTrendingRef = useRef(false);
  const fetchedTagNamesRef = useRef(new Set()); // Track by formatted tag name, not ID
  const lastQueryRef = useRef(query);
  const stateRef = useRef({ applicationsByTag, totalCountsByTag, currentPageByTag });
  stateRef.current = { applicationsByTag, totalCountsByTag, currentPageByTag };

  const [fetchTags, { isFetching: isFetchingTags }] = useLazyTagListQuery();
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

  const fetchApplicationsForTag = useCallback(
    async (tag, page = 0) => {
      const formattedTagName = TagHelpers.formatTagName(tag.name);
      setLoading(tag.id, true);

      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentsStudioConstants.PAGE_SIZE,
          params: {
            query,
            tags: [tag.id],
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(formattedTagName, page, result.rows, result.total);
        }
      } finally {
        setLoading(tag.id, false);
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

  const fetchApplicationsWithoutTags = useCallback(
    async (page = 0) => {
      setLoading(AgentsStudioConstants.OTHER_CATEGORY, true);

      try {
        const result = await fetchApplications({
          page,
          pageSize: AgentsStudioConstants.PAGE_SIZE,
          params: {
            query,
            statuses: CollectionStatus.Published,
            agents_type: 'classic',
            without_tags: true,
          },
        }).unwrap();

        if (result?.rows) {
          updateApplicationData(AgentsStudioConstants.OTHER_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(AgentsStudioConstants.OTHER_CATEGORY, false);
      }
    },
    [fetchApplications, query, setLoading, updateApplicationData],
  );

  const resetSearchByTag = useCallback(() => {
    dispatch(agentsStudioActions.clearCache());
  }, [dispatch]);

  const createFetchApplications = useCallback(() => {
    fetchTrendingApplications(0);
    fetchMyLikedApplications(0);
    fetchApplicationsWithoutTags(0);
  }, [fetchTrendingApplications, fetchMyLikedApplications, fetchApplicationsWithoutTags]);

  const addAppToCategory = useCallback((categoryName, app, newAppsByTag) => {
    if (!newAppsByTag[categoryName]) {
      newAppsByTag[categoryName] = [];
    }
    if (!newAppsByTag[categoryName].some(existingApp => existingApp.id === app.id)) {
      newAppsByTag[categoryName].push(app);
    }

    return newAppsByTag;
  }, []);

  const createNewAppsByTag = useCallback(
    result => {
      let newAppsByTag = {};

      result.rows.forEach(app => {
        let placed = false;
        if (app.tags && app.tags.length > 0) {
          app.tags.forEach(tag => {
            const categoryName = TagHelpers.formatTagName(tag.name);
            newAppsByTag = addAppToCategory(categoryName, app, newAppsByTag);
            placed = true;
          });
        }

        if (!placed) {
          newAppsByTag = addAppToCategory(AgentsStudioConstants.OTHER_CATEGORY, app, newAppsByTag);
        }
      });

      return newAppsByTag;
    },
    [addAppToCategory],
  );

  const createNewTotalsByTag = useCallback(newAppsByTag => {
    const newTotalsByTag = {};

    Object.keys(newAppsByTag).forEach(categoryName => {
      newTotalsByTag[categoryName] = newAppsByTag[categoryName].length;
    });

    return newTotalsByTag;
  }, []);

  const setApplicationsAndTotalsByTag = useCallback(
    (newAppsByTag, newTotalsByTag) => {
      dispatch(
        agentsStudioActions.setApplicationsData({
          applicationsByTag: newAppsByTag,
          totalCountsByTag: newTotalsByTag,
          currentPageByTag: {},
          query,
        }),
      );
    },
    [dispatch, query],
  );

  const searchAndCategorize = useCallback(async () => {
    setLoading('global_search', true);
    resetSearchByTag();

    try {
      const result = await fetchApplications({
        page: 0,
        pageSize: 100,
        params: {
          query,
          statuses: CollectionStatus.Published,
          agents_type: 'classic',
        },
      }).unwrap();

      if (!result?.rows) return;

      const newAppsByTag = createNewAppsByTag(result);

      const newTotalsByTag = createNewTotalsByTag(newAppsByTag);

      setApplicationsAndTotalsByTag(newAppsByTag, newTotalsByTag);
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error('Failed to perform global search:', error);
        setLoading('global_search', false);
      }
    } finally {
      setLoading('global_search', false);
    }
  }, [
    fetchApplications,
    query,
    setLoading,
    resetSearchByTag,
    createNewAppsByTag,
    createNewTotalsByTag,
    setApplicationsAndTotalsByTag,
  ]);

  // Fetch tags on mount or when cache becomes invalid
  useEffect(() => {
    const loadTags = async () => {
      const result = await fetchTags(AgentsStudioConstants.TagsQueryParams).unwrap();
      setTags(result);
      setAllTags(result?.rows || []);
    };
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main data fetching effect - uses Redux cache when valid
  useEffect(() => {
    // If query changed, reset tracking
    if (query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      fetchedTagNamesRef.current = new Set();
    }

    if (query) {
      if (!isCacheValid) {
        searchAndCategorize();
      }
      return;
    }

    // Skip if tags haven't loaded yet
    if (allTags.length === 0) {
      return;
    }

    if (!isCacheValid) {
      // Cache is invalid, clear tracking and refetch everything
      fetchedTagNamesRef.current = new Set();
      createFetchApplications();
      Promise.all(
        allTags.map(tag => {
          const formattedName = TagHelpers.formatTagName(tag.name);
          fetchedTagNamesRef.current.add(formattedName);
          return fetchApplicationsForTag(tag, 0);
        }),
      );
    } else {
      // Cache is valid - initialize fetchedTagNamesRef from Redux if empty
      if (fetchedTagNamesRef.current.size === 0) {
        const categoryNames = Object.keys(stateRef.current.applicationsByTag);
        categoryNames.forEach(categoryName => {
          if (stateRef.current.applicationsByTag[categoryName]?.length > 0) {
            fetchedTagNamesRef.current.add(categoryName);
          }
        });
      }

      // Check for new tags that haven't been fetched yet
      const newTags = allTags.filter(tag => {
        const formattedName = TagHelpers.formatTagName(tag.name);
        return !fetchedTagNamesRef.current.has(formattedName);
      });

      if (newTags.length > 0) {
        // Fetch only the truly new tags
        Promise.all(
          newTags.map(tag => {
            const formattedName = TagHelpers.formatTagName(tag.name);
            fetchedTagNamesRef.current.add(formattedName);
            return fetchApplicationsForTag(tag, 0);
          }),
        );
      }
    }
  }, [allTags, query, isCacheValid, searchAndCategorize, createFetchApplications, fetchApplicationsForTag]);

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
    () => loadingTags.size > 0 || isFetchingTags,
    [loadingTags.size, isFetchingTags],
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
        } else if (categoryName === AgentsStudioConstants.OTHER_CATEGORY) {
          await fetchApplicationsWithoutTags(0);
        } else {
          const tag = allTags.find(t => TagHelpers.formatTagName(t.name) === categoryName);
          if (tag) {
            await fetchApplicationsForTag(tag, 0);
          }
        }
      } finally {
        setRefreshing(categoryName, false);
      }
    },
    [
      allTags,
      setRefreshing,
      fetchTrendingApplications,
      fetchMyLikedApplications,
      fetchApplicationsWithoutTags,
      fetchApplicationsForTag,
    ],
  );

  return {
    tags,
    applicationsByTag: filteredApplicationsByTag,
    totalCountsByTag: filteredTotalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchApplicationsForTag,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    fetchApplicationsWithoutTags,
    updateApplicationInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  };
};

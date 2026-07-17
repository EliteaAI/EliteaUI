import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useLazyPublicSkillsListQuery } from '@/[fsd]/features/skill-hub/api';
import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';
import { useGetSkillCategoriesQuery } from '@/[fsd]/features/skill/api';
import { PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';
import useToast from '@/hooks/useToast';
import { selectIsCacheValid, selectSkillHubData, actions as skillHubActions } from '@/slices/skillHub';

/** Single bulk-fetch limit — covers realistic max published-skill counts. */
const ALL_SKILLS_LIMIT = 1000;
/** Search results limit. */
const SEARCH_SKILLS_LIMIT = 100;

/**
 * Manage the ELITEA Catalog skills data: one bulk fetch of all published public
 * skills bucketed client-side by category, plus dedicated Trending / My Liked
 * requests. Mirrors useAgentHubData; Redux caching (60 min) avoids re-fetching
 * on navigation.
 */
export const useSkillHubData = (query, selectedTagNames) => {
  const dispatch = useDispatch();
  const { toastError } = useToast();
  const { skillsByTag, totalCountsByTag, currentPageByTag } = useSelector(selectSkillHubData);
  const isCacheValid = useSelector(state => selectIsCacheValid(state, query));

  const [loadingTags, setLoadingTags] = useState(new Set());
  const [refreshingTags, setRefreshingTags] = useState(new Set());

  const { data: categoriesData, isFetching: isFetchingCategories } = useGetSkillCategoriesQuery({
    projectId: PUBLIC_PROJECT_ID,
  });
  const categoryNames = useMemo(() => (categoriesData?.categories || []).map(c => c.name), [categoriesData]);

  const [fetchSkills] = useLazyPublicSkillsListQuery();

  const updateSkillData = useCallback(
    (categoryName, page, rows, total) => {
      dispatch(skillHubActions.updateCategoryData({ categoryName, page, rows, total }));
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
   * Bucket a flat list of skills into category buckets using their tags.
   * Skills with no active-category tag fall into "Other".
   */
  const bucketSkillsByCategory = useCallback((rows, activeCategoryNames) => {
    const activeSet = new Set(activeCategoryNames);
    const buckets = {};

    rows.forEach(skill => {
      const categoryTag = skill.tags?.find(tag => activeSet.has(tag.name));
      const bucket = categoryTag ? categoryTag.name : SkillHubConstants.OTHER_CATEGORY;
      if (!buckets[bucket]) buckets[bucket] = [];
      buckets[bucket].push(skill);
    });

    return buckets;
  }, []);

  const fetchAllAndCategorize = useCallback(
    async activeCategoryNames => {
      setLoading('bulk_fetch', true);
      try {
        const result = await fetchSkills({
          page: 0,
          pageSize: ALL_SKILLS_LIMIT,
          params: { query },
        }).unwrap();

        if (!result?.rows) return;

        // The catalog buckets client-side from one bulk fetch capped at
        // ALL_SKILLS_LIMIT; there is no per-category server pagination. If the
        // public catalog ever outgrows the cap, surface it instead of silently
        // dropping the overflow.
        if (result.total > result.rows.length) {
          // eslint-disable-next-line no-console
          console.warn(
            `ELITEA Catalog: showing ${result.rows.length} of ${result.total} published skills ` +
              `(bulk fetch capped at ${ALL_SKILLS_LIMIT}).`,
          );
        }

        const buckets = bucketSkillsByCategory(result.rows, activeCategoryNames);

        Object.entries(buckets).forEach(([categoryName, rows]) => {
          updateSkillData(categoryName, 0, rows, rows.length);
        });
      } finally {
        setLoading('bulk_fetch', false);
      }
    },
    [fetchSkills, query, setLoading, bucketSkillsByCategory, updateSkillData],
  );

  const fetchTrendingSkills = useCallback(
    async (page = 0) => {
      setLoading(SkillHubConstants.TRENDING_CATEGORY, true);
      try {
        const result = await fetchSkills({
          page,
          pageSize: PAGE_SIZE,
          params: {
            query,
            trend_start_period: SkillHubConstants.TRENDING_START_PERIOD,
            sort_by: 'likes',
            sort_order: 'desc',
          },
        }).unwrap();

        if (result?.rows) {
          updateSkillData(SkillHubConstants.TRENDING_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(SkillHubConstants.TRENDING_CATEGORY, false);
      }
    },
    [fetchSkills, query, setLoading, updateSkillData],
  );

  const fetchMyLikedSkills = useCallback(
    async (page = 0) => {
      setLoading(SkillHubConstants.MY_LIKED_CATEGORY, true);
      try {
        const result = await fetchSkills({
          page,
          pageSize: PAGE_SIZE,
          params: {
            query,
            my_liked: true,
          },
        }).unwrap();

        if (result?.rows) {
          updateSkillData(SkillHubConstants.MY_LIKED_CATEGORY, page, result.rows, result.total);
        }
      } finally {
        setLoading(SkillHubConstants.MY_LIKED_CATEGORY, false);
      }
    },
    [fetchSkills, query, setLoading, updateSkillData],
  );

  const fetchCategoryScoped = useCallback(
    async categoryName => {
      const result = await fetchSkills({
        page: 0,
        pageSize: ALL_SKILLS_LIMIT,
        params: { query, category: categoryName },
      }).unwrap();

      if (result?.rows) {
        updateSkillData(categoryName, 0, result.rows, result.rows.length);
      }
    },
    [fetchSkills, query, updateSkillData],
  );

  const resetSearchByTag = useCallback(() => {
    dispatch(skillHubActions.clearCache());
  }, [dispatch]);

  const searchAndCategorize = useCallback(async () => {
    setLoading('global_search', true);
    resetSearchByTag();
    try {
      const result = await fetchSkills({
        page: 0,
        pageSize: SEARCH_SKILLS_LIMIT,
        params: { query },
      }).unwrap();

      if (!result?.rows) return;

      const buckets = bucketSkillsByCategory(result.rows, categoryNames);

      dispatch(
        skillHubActions.setSkillsData({
          skillsByTag: buckets,
          totalCountsByTag: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
          currentPageByTag: {},
          query,
        }),
      );
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error('Failed to perform skill search:', error);
      }
    } finally {
      setLoading('global_search', false);
    }
  }, [fetchSkills, query, setLoading, resetSearchByTag, bucketSkillsByCategory, categoryNames, dispatch]);

  useEffect(() => {
    if (categoryNames.length === 0) return;

    if (query) {
      if (!isCacheValid) {
        searchAndCategorize();
      }
      return;
    }

    if (!isCacheValid) {
      fetchAllAndCategorize(categoryNames);
      fetchTrendingSkills(0);
      fetchMyLikedSkills(0);
    }
  }, [
    categoryNames,
    query,
    isCacheValid,
    searchAndCategorize,
    fetchAllAndCategorize,
    fetchTrendingSkills,
    fetchMyLikedSkills,
  ]);

  const filteredSkillsByTag = useMemo(() => {
    if (selectedTagNames.length === 0) return skillsByTag;
    const filtered = {};
    selectedTagNames.forEach(tagName => {
      if (skillsByTag[tagName]) filtered[tagName] = skillsByTag[tagName];
    });
    return filtered;
  }, [skillsByTag, selectedTagNames]);

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

  // Patch a skill in every category bucket. The reducer reads the CURRENT
  // store state, so concurrent updates in one tick cannot clobber each other
  // (and cache metadata like lastFetchedAt stays untouched).
  const updateSkillInState = useCallback(
    (skillId, patch) => {
      dispatch(skillHubActions.updateSkillInCategories({ skillId, patch }));
    },
    [dispatch],
  );

  const addToMyLiked = useCallback(
    skill => {
      dispatch(
        skillHubActions.addToMyLiked({
          skill,
          categoryName: SkillHubConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  const removeFromMyLiked = useCallback(
    skillId => {
      dispatch(
        skillHubActions.removeFromMyLiked({
          skillId,
          categoryName: SkillHubConstants.MY_LIKED_CATEGORY,
        }),
      );
    },
    [dispatch],
  );

  const onRefresh = useCallback(
    async categoryName => {
      setRefreshing(categoryName, true);
      try {
        if (categoryName === SkillHubConstants.TRENDING_CATEGORY) {
          await fetchTrendingSkills(0);
        } else if (categoryName === SkillHubConstants.MY_LIKED_CATEGORY) {
          await fetchMyLikedSkills(0);
        } else {
          await fetchCategoryScoped(categoryName);
        }
      } catch {
        toastError(`Failed to refresh ${categoryName}. Please try again.`);
      } finally {
        setRefreshing(categoryName, false);
      }
    },
    [setRefreshing, fetchTrendingSkills, fetchMyLikedSkills, fetchCategoryScoped, toastError],
  );

  return {
    categoryNames,
    skillsByTag: filteredSkillsByTag,
    totalCountsByTag: filteredTotalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchTrendingSkills,
    fetchMyLikedSkills,
    updateSkillInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  };
};

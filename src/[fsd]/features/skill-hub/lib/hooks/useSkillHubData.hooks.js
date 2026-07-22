import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useLazyPublicSkillsListQuery } from '@/[fsd]/features/skill-hub/api';
import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';
import { useGetSkillCategoriesQuery } from '@/[fsd]/features/skill/api';
import { PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';
import {
  selectIsCacheValid,
  selectLastRefreshedAt,
  selectSkillHubData,
  actions as skillHubActions,
} from '@/slices/skillHub';

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
  const { skillsByTag, totalCountsByTag, currentPageByTag } = useSelector(selectSkillHubData);
  const isCacheValid = useSelector(state => selectIsCacheValid(state, query));
  const lastRefreshedAt = useSelector(selectLastRefreshedAt);

  const [loadingTags, setLoadingTags] = useState(new Set());

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

  const rebuildCategoryToDepth = useCallback(
    (categoryName, rows, total, depth) => {
      dispatch(skillHubActions.replaceCategoryData({ categoryName, page: depth, rows, total }));
    },
    [dispatch],
  );

  const fetchTrendingSkills = useCallback(
    async (page = 0, depth = null) => {
      const isRebuild = depth !== null;
      const category = SkillHubConstants.TRENDING_CATEGORY;
      if (!isRebuild) setLoading(category, true);
      try {
        const result = await fetchSkills({
          page: isRebuild ? 0 : page,
          pageSize: isRebuild ? (depth + 1) * PAGE_SIZE : PAGE_SIZE,
          params: {
            query,
            trend_start_period: SkillHubConstants.TRENDING_START_PERIOD,
            sort_by: 'likes',
            sort_order: 'desc',
          },
        }).unwrap();

        if (result?.rows) {
          if (isRebuild) rebuildCategoryToDepth(category, result.rows, result.total, depth);
          else updateSkillData(category, page, result.rows, result.total);
        }
      } finally {
        if (!isRebuild) setLoading(category, false);
      }
    },
    [fetchSkills, query, setLoading, updateSkillData, rebuildCategoryToDepth],
  );

  const fetchMyLikedSkills = useCallback(
    async (page = 0, depth = null) => {
      const isRebuild = depth !== null;
      const category = SkillHubConstants.MY_LIKED_CATEGORY;
      if (!isRebuild) setLoading(category, true);
      try {
        const result = await fetchSkills({
          page: isRebuild ? 0 : page,
          pageSize: isRebuild ? (depth + 1) * PAGE_SIZE : PAGE_SIZE,
          params: {
            query,
            my_liked: true,
          },
        }).unwrap();

        if (result?.rows) {
          if (isRebuild) rebuildCategoryToDepth(category, result.rows, result.total, depth);
          else updateSkillData(category, page, result.rows, result.total);
        }
      } finally {
        if (!isRebuild) setLoading(category, false);
      }
    },
    [fetchSkills, query, setLoading, updateSkillData, rebuildCategoryToDepth],
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

  const refresh = useCallback(() => {
    if (query) return;
    if (categoryNames.length === 0) return;
    const trendingDepth = currentPageByTag[SkillHubConstants.TRENDING_CATEGORY] || 0;
    const myLikedDepth = currentPageByTag[SkillHubConstants.MY_LIKED_CATEGORY] || 0;
    Promise.all([
      fetchAllAndCategorize(categoryNames),
      fetchTrendingSkills(0, trendingDepth),
      fetchMyLikedSkills(0, myLikedDepth),
    ]).catch(() => {});
  }, [
    query,
    categoryNames,
    currentPageByTag,
    fetchAllAndCategorize,
    fetchTrendingSkills,
    fetchMyLikedSkills,
  ]);

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

  return {
    categoryNames,
    skillsByTag: filteredSkillsByTag,
    totalCountsByTag: filteredTotalCountsByTag,
    currentPageByTag,
    loadingTags,
    isFetching,
    isCacheValid,
    lastRefreshedAt,
    fetchTrendingSkills,
    fetchMyLikedSkills,
    updateSkillInState,
    addToMyLiked,
    removeFromMyLiked,
    refresh,
  };
};

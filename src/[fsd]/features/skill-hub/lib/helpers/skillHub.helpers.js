import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';

/**
 * Build the ordered category list shown in the catalog: the special Trending
 * and My Liked buckets first, then the predefined categories (with the "Other"
 * catch-all moved to the end).
 */
export const buildAllCategories = categoryNames => {
  const names = (categoryNames || []).filter(name => name !== SkillHubConstants.OTHER_CATEGORY);
  names.sort();
  return [
    SkillHubConstants.TRENDING_CATEGORY,
    SkillHubConstants.MY_LIKED_CATEGORY,
    ...names,
    SkillHubConstants.OTHER_CATEGORY,
  ];
};

/**
 * Transform skills by tag into menu items with proper category assignment.
 */
export const buildSkillMenuItems = (skillsByTag, selectedTagNames) => {
  const skillCategoriesMap = new Map();
  let tagsToShow = selectedTagNames.length === 0 ? Object.keys(skillsByTag) : selectedTagNames;

  if (selectedTagNames.length === 0 && tagsToShow.includes(SkillHubConstants.TRENDING_CATEGORY)) {
    tagsToShow = [
      SkillHubConstants.TRENDING_CATEGORY,
      ...tagsToShow.filter(tag => tag !== SkillHubConstants.TRENDING_CATEGORY),
    ];
  }

  const categoryOrderMap = new Map();

  tagsToShow.forEach(tagName => {
    const skills = skillsByTag[tagName];
    if (!skills) return;

    if (!categoryOrderMap.has(tagName)) {
      categoryOrderMap.set(tagName, []);
    }

    skills.forEach(skill => {
      if (!skillCategoriesMap.has(skill.id)) {
        skillCategoriesMap.set(skill.id, {
          skill,
          categories: new Set(),
        });
      }

      const skillData = skillCategoriesMap.get(skill.id);
      skillData.categories.add(tagName);

      if (!categoryOrderMap.get(tagName).includes(skill.id)) {
        categoryOrderMap.get(tagName).push(skill.id);
      }
    });
  });

  return Array.from(skillCategoriesMap.values()).map(({ skill, categories }) => {
    const categoryArray = Array.from(categories);

    if (categoryArray.length === 0) {
      categoryArray.push(SkillHubConstants.OTHER_CATEGORY);
    }

    const categoryOrderByServer = {};
    categoryArray.forEach(cat => {
      const order = categoryOrderMap.get(cat)?.indexOf(skill.id);
      if (order !== undefined && order !== -1) {
        categoryOrderByServer[cat] = order;
      }
    });

    return {
      key: skill.id,
      label: skill.name,
      icon: skill.icon_meta?.url || null,
      category: categoryArray,
      tags: skill.tags,
      value: skill,
      categoryOrderByServer,
    };
  });
};

/**
 * Determine which fetch function to call based on category.
 */
export const getFetchFunctionForCategory = (
  category,
  { fetchTrendingSkills, fetchMyLikedSkills, fetchSkillsForCategoryName },
) => {
  if (category === SkillHubConstants.TRENDING_CATEGORY) {
    return fetchTrendingSkills;
  }

  if (category === SkillHubConstants.MY_LIKED_CATEGORY) {
    return fetchMyLikedSkills;
  }

  return page => fetchSkillsForCategoryName(category, page);
};

export const getCategoryForSkill = skill => skill.category;

export const calculateNewLikesCount = (likesCount, isLiked, currentLikes) => {
  let strategy;
  if (likesCount > 0) {
    strategy = SkillHubConstants.LikeUpdateStrategy.USE_SERVER_COUNT;
  } else if (isLiked) {
    strategy = SkillHubConstants.LikeUpdateStrategy.OPTIMISTIC_INCREMENT;
  } else {
    strategy = SkillHubConstants.LikeUpdateStrategy.OPTIMISTIC_DECREMENT;
  }

  switch (strategy) {
    case SkillHubConstants.LikeUpdateStrategy.USE_SERVER_COUNT:
      return likesCount;
    case SkillHubConstants.LikeUpdateStrategy.OPTIMISTIC_INCREMENT:
      return currentLikes + 1;
    case SkillHubConstants.LikeUpdateStrategy.OPTIMISTIC_DECREMENT:
      return Math.max(0, currentLikes - 1);
    default:
      return currentLikes;
  }
};

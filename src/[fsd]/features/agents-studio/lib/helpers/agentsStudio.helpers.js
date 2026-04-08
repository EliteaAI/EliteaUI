import { AgentsStudioConstants } from '@/[fsd]/features/agents-studio/lib/constants';
import { formatTagName } from '@/[fsd]/features/agents-studio/lib/helpers/tag.helpers';

/**
 * Build all categories including special categories and tag-based categories
 */
export const buildAllCategories = tags => {
  const tagNames = tags?.rows?.map(tag => formatTagName(tag.name)).sort() || [];
  return [
    AgentsStudioConstants.TRENDING_CATEGORY,
    AgentsStudioConstants.MY_LIKED_CATEGORY,
    ...tagNames,
    AgentsStudioConstants.OTHER_CATEGORY,
  ];
};

/**
 * Transform applications by tag into menu items with proper category assignment
 */
export const buildApplicationMenuItems = (applicationsByTag, selectedTagNames) => {
  const appCategoriesMap = new Map();
  let tagsToShow = selectedTagNames.length === 0 ? Object.keys(applicationsByTag) : selectedTagNames;

  // First pass: collect all apps and their categories
  if (selectedTagNames.length === 0 && tagsToShow.includes(AgentsStudioConstants.TRENDING_CATEGORY)) {
    tagsToShow = [
      AgentsStudioConstants.TRENDING_CATEGORY,
      ...tagsToShow.filter(tag => tag !== AgentsStudioConstants.TRENDING_CATEGORY),
    ];
  }

  const categoryOrderMap = new Map();

  tagsToShow.forEach(tagName => {
    const apps = applicationsByTag[tagName];
    if (!apps) return;

    if (!categoryOrderMap.has(tagName)) {
      categoryOrderMap.set(tagName, []);
    }

    apps.forEach(app => {
      if (!appCategoriesMap.has(app.id)) {
        appCategoriesMap.set(app.id, {
          app,
          categories: new Set(),
        });
      }

      const appData = appCategoriesMap.get(app.id);

      // Assign category based on where the app came from
      assignCategory(appData, tagName, app);

      if (!categoryOrderMap.get(tagName).includes(app.id)) {
        categoryOrderMap.get(tagName).push(app.id);
      }
    });
  });

  // Second pass: create menu items
  return Array.from(appCategoriesMap.values()).map(({ app, categories }) => {
    const categoryArray = Array.from(categories);

    // Fallback to Other if no categories
    if (categoryArray.length === 0) {
      categoryArray.push(AgentsStudioConstants.OTHER_CATEGORY);
    }

    const categoryOrderByServer = {};
    categoryArray.forEach(cat => {
      const order = categoryOrderMap.get(cat)?.indexOf(app.id);
      if (order !== undefined && order !== -1) {
        categoryOrderByServer[cat] = order;
      }
    });

    return {
      key: app.id,
      label: app.name,
      icon: app.icon_meta?.url || null,
      category: categoryArray,
      tags: app.tags,
      value: app,
      categoryOrderByServer,
    };
  });
};

/**
 * Assign category to an application based on its source
 */
const assignCategory = (appData, tagName, app) => {
  appData.categories.add(tagName);
  if (app.tags && app.tags.length > 0) {
    app.tags.forEach(tag => {
      appData.categories.add(formatTagName(tag.name));
    });
  }
};

/**
 * Determine which fetch function to call based on category
 */
export const getFetchFunctionForCategory = (
  category,
  {
    fetchTrendingApplications,
    fetchMyLikedApplications,
    fetchApplicationsWithoutTags,
    fetchApplicationsForTag,
    tags,
  },
) => {
  if (category === AgentsStudioConstants.TRENDING_CATEGORY) {
    return fetchTrendingApplications;
  }

  if (category === AgentsStudioConstants.MY_LIKED_CATEGORY) {
    return fetchMyLikedApplications;
  }

  if (category === AgentsStudioConstants.OTHER_CATEGORY) {
    return fetchApplicationsWithoutTags;
  }

  // Find the tag for this category
  const tag = tags?.rows?.find(t => formatTagName(t.name) === category);
  if (tag) {
    return page => fetchApplicationsForTag(tag, page);
  }

  return null;
};

export const getCategoryForApplication = app => app.category;

export const calculateNewLikesCount = (likesCount, isLiked, currentLikes) => {
  let strategy;
  if (likesCount > 0) {
    strategy = AgentsStudioConstants.LikeUpdateStrategy.USE_SERVER_COUNT;
  } else if (isLiked) {
    strategy = AgentsStudioConstants.LikeUpdateStrategy.OPTIMISTIC_INCREMENT;
  } else {
    strategy = AgentsStudioConstants.LikeUpdateStrategy.OPTIMISTIC_DECREMENT;
  }

  switch (strategy) {
    case AgentsStudioConstants.LikeUpdateStrategy.USE_SERVER_COUNT:
      return likesCount;
    case AgentsStudioConstants.LikeUpdateStrategy.OPTIMISTIC_INCREMENT:
      return currentLikes + 1;
    case AgentsStudioConstants.LikeUpdateStrategy.OPTIMISTIC_DECREMENT:
      return Math.max(0, currentLikes - 1);
    default:
      return currentLikes;
  }
};

import { CollectionStatus, SUGGESTION_PAGE_SIZE } from '@/common/constants';

export const getSuggestionStatuses = tab => {
  switch (tab) {
    case 'latest':
    case 'my-liked':
    case 'trending':
      return [CollectionStatus.Published];
    default:
      return undefined;
  }
};

export const getAutoSuggestionTypes = pageFlags => {
  const { isPublicApplications, isPipelines, isToolkits, isMCPs, isCredentials, isSkills, isUserPublic } =
    pageFlags;

  if (isPublicApplications) return ['tag', 'application'];
  if (isPipelines) return ['tag', 'pipeline'];
  if (isToolkits) return ['toolkit'];
  if (isMCPs) return ['mcp'];
  if (isCredentials) return ['credential'];
  if (isSkills) return ['tag', 'skill'];
  if (isUserPublic) return ['tag', 'application', 'pipeline', 'toolkit', 'credential'];
  return [];
};

export const filterTagsByQuery = (tags, query) => {
  if (!query?.trim()) return tags;
  const normalizedQuery = query.toLowerCase();
  return tags.filter(tag => tag.name?.toLowerCase().includes(normalizedQuery));
};

export const getShowMoreCounts = (total, visibleCount) => {
  const remainedCount = total - visibleCount;
  return { remainedCount, nextCount: Math.min(SUGGESTION_PAGE_SIZE, remainedCount) };
};

export const shouldFetchMoreSuggestions = (loadedCount, nextVisibleCount, total) =>
  loadedCount < nextVisibleCount && loadedCount < total;

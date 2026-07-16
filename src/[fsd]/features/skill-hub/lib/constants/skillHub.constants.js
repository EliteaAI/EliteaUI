import { ALL_TIME_DATE, CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';

export const TRENDING_CATEGORY = 'Trending';
export const MY_LIKED_CATEGORY = 'My Liked';
export const OTHER_CATEGORY = 'Other';
export const TagsQueryParams = {
  projectId: PUBLIC_PROJECT_ID,
  page: 0,
  limit: 100,
  entity_coverage: 'skill',
  statuses: CollectionStatus.Published,
};
export const TRENDING_START_PERIOD = ALL_TIME_DATE;

export const LikeUpdateStrategy = {
  USE_SERVER_COUNT: 'USE_SERVER_COUNT',
  OPTIMISTIC_INCREMENT: 'OPTIMISTIC_INCREMENT',
  OPTIMISTIC_DECREMENT: 'OPTIMISTIC_DECREMENT',
};
export const SKILL_ID = 'skillId';

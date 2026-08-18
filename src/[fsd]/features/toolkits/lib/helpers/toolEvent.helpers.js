import { RUN_TEST_OPERATION_TYPES } from '@/[fsd]/features/toolkits/indexes/lib/constants';

const SEARCH_INDEX_LABEL = 'Search index';

export const resolveToolEventLabel = operationType => {
  if (!operationType) return null;
  if (RUN_TEST_OPERATION_TYPES.has(operationType)) return SEARCH_INDEX_LABEL;

  const spaced = operationType.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

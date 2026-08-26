import { INDEX_SEARCH_TOOL_LABELS } from '@/[fsd]/features/toolkits/indexes/lib/constants';

export const resolveToolEventLabel = operationType => {
  if (!operationType) return null;

  const searchToolLabel = INDEX_SEARCH_TOOL_LABELS.get(operationType);
  if (searchToolLabel) return searchToolLabel;

  const spaced = operationType.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

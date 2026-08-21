import { IndexingBlockers } from '@/[fsd]/features/toolkits/indexes/lib/constants';

export const shouldFetchIndexes = indexingBlocker =>
  !indexingBlocker || indexingBlocker === IndexingBlockers.buildsDisabled;

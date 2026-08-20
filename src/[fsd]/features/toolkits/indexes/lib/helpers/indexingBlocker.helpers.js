import { IndexingBlockers } from '@/[fsd]/features/toolkits/indexes/lib/constants';

export const canListIndexes = indexingBlocker =>
  !indexingBlocker || indexingBlocker === IndexingBlockers.buildsDisabled;

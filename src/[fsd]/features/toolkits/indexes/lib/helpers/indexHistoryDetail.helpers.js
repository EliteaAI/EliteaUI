import { IndexHistoryItemsLabels, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { resolveIndexEventLabel } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';

const rendersAsCard = entry =>
  Boolean(IndexHistoryItemsLabels[entry?.state]) &&
  entry.state !== IndexStatuses.runTest &&
  !entry.conversation_id;

export const buildIndexHistoryDetailRow = ({ entry, indexName, initialCompletedTs }) => {
  if (!rendersAsCard(entry)) return null;

  return {
    name: `${resolveIndexEventLabel(entry, initialCompletedTs)} — ${indexName}`,
    entry,
  };
};

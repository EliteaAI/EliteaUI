import { IndexHistoryItemsLabels, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { resolveIndexEventLabel } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';

// Preferring the transcript assumes the conversation explains the outcome. An
// interrupted run was killed before it could say anything, so its transcript holds no
// assistant turn at all and the stored error is the only account of what happened.
const rendersAsCard = entry =>
  Boolean(IndexHistoryItemsLabels[entry?.state]) &&
  entry.state !== IndexStatuses.runTest &&
  (!entry.conversation_id || entry.state === IndexStatuses.interrupted);

export const buildIndexHistoryDetailRow = ({ entry, indexName, initialCompletedTs }) => {
  if (!rendersAsCard(entry)) return null;

  return {
    name: `${resolveIndexEventLabel(entry, initialCompletedTs)} — ${indexName}`,
    entry,
  };
};

import { IndexHistoryItemsLabels } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { resolveIndexEventLabel } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';

export const indexHistoryRowId = entry => `${entry?.updated_on}_${entry?.conversation_id ?? entry?.state}`;

export const resolveIndexRunDuration = entry => {
  const { duration: serverComputedDuration, created_on: startedOn, updated_on: finishedOn } = entry;

  if (Number.isFinite(serverComputedDuration)) return serverComputedDuration;
  if (!Number.isFinite(startedOn) || !Number.isFinite(finishedOn) || finishedOn <= startedOn) return null;

  // Raw epoch floats; the conversation rows beside these arrive already rounded.
  return Math.round((finishedOn - startedOn) * 100) / 100;
};

const isListedEntry = entry =>
  Boolean(IndexHistoryItemsLabels[entry?.state]) && Number.isFinite(entry.updated_on);

export const buildIndexHistoryRows = (history, initialCompletedTs) =>
  (history || []).filter(isListedEntry).map(entry => ({
    id: indexHistoryRowId(entry),
    created_at: entry.updated_on,
    event_label: resolveIndexEventLabel(entry, initialCompletedTs),
    duration: resolveIndexRunDuration(entry),
    hasConversation: false,
    canShare: true,
    entry,
  }));

import { useMemo } from 'react';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexHistoryItemsLabels, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';

const TERMINAL_STATES = new Set([
  IndexStatuses.success,
  IndexStatuses.partlyOk,
  IndexStatuses.scheduledReindex,
  IndexStatuses.fail,
  IndexStatuses.cancelled,
]);

// Conversation rows carry a naive isoformat() timestamp, which JS reads as local time.
// A trailing Z here would make the merged list sort the two kinds of row against
// different clocks and pick the wrong one as latest in any non-UTC browser.
const toNaiveIsoString = unixSeconds =>
  Number.isFinite(unixSeconds) ? new Date(unixSeconds * 1000).toISOString().replace('Z', '') : null;

const toRunRow = (entry, indexName) => {
  const createdAt = toNaiveIsoString(entry.updated_on);
  if (!createdAt) return null;

  const startedOn = Number(entry.created_on);
  const finishedOn = Number(entry.updated_on);
  // Raw epoch floats; the conversation rows beside these arrive already rounded.
  const duration =
    Number.isFinite(startedOn) && finishedOn > startedOn
      ? Math.round((finishedOn - startedOn) * 100) / 100
      : null;

  return {
    id: `index-run:${indexName}:${entry.updated_on}`,
    created_at: createdAt,
    name: `${IndexHistoryItemsLabels[entry.state] || 'Indexed'} — ${indexName}`,
    duration,
    version_id: null,
    index_name: indexName,
    operation_type: null,
    hasConversation: false,
    entry,
  };
};

/**
 * Runs of this toolkit's indexes that produced no conversation — scheduled reindexes
 * above all — as rows that can sit alongside real run-history entries.
 *
 * Reads through an explicitly keyed query rather than the indexes slice: the slice holds
 * a single global last-viewed list, so on direct navigation it is empty or belongs to
 * another toolkit.
 */
export const useToolkitIndexRuns = ({ projectId, toolkitId, skip = false }) => {
  const { data, isLoading } = useGetIndexesListQuery(
    { projectId, toolkitId },
    { skip: skip || !projectId || !toolkitId },
  );

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.flatMap(index => {
      const metadata = index?.metadata;
      const indexName = metadata?.collection;
      if (!indexName || !Array.isArray(metadata.history)) return [];

      return metadata.history
        .filter(entry => entry && !entry.conversation_id && TERMINAL_STATES.has(entry.state))
        .map(entry => toRunRow(entry, indexName))
        .filter(Boolean);
    });
  }, [data]);

  return { indexRunRows: rows, isIndexRunsLoading: isLoading };
};

import { useMemo } from 'react';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import {
  initialCompletedTsOf,
  resolveIndexEventLabel,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';
import { resolveIndexRunDuration } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexHistoryRow.helpers';
import { useIndexRunLiveRefresh } from '@/[fsd]/features/toolkits/indexes/lib/hooks/useIndexRunLiveRefresh.hooks';

const TERMINAL_STATES = new Set([
  IndexStatuses.success,
  IndexStatuses.partlyOk,
  IndexStatuses.scheduledReindex,
  IndexStatuses.fail,
  IndexStatuses.cancelled,
]);

const toIsoString = unixSeconds =>
  Number.isFinite(unixSeconds) ? new Date(unixSeconds * 1000).toISOString() : null;

const toRunRow = (entry, indexName, eventLabel) => {
  const createdAt = toIsoString(entry.updated_on);
  if (!createdAt) return null;

  return {
    id: `index-run:${indexName}:${entry.updated_on}`,
    created_at: createdAt,
    name: `${eventLabel} — ${indexName}`,
    event_label: eventLabel,
    event_tooltip: `${eventLabel} — ${indexName}`,
    duration: resolveIndexRunDuration(entry),
    version_id: null,
    index_name: indexName,
    operation_type: null,
    hasConversation: false,
    canShare: true,
    entry,
  };
};

export const buildIndexRunLookup = indexesData => {
  const lookup = new Map();
  if (!Array.isArray(indexesData)) return lookup;

  indexesData.forEach(index => {
    const metadata = index?.metadata;
    const indexName = metadata?.collection;
    if (!indexName || !Array.isArray(metadata.history)) return;

    const initialCompletedTs = initialCompletedTsOf(metadata.history);
    metadata.history
      .filter(entry => entry?.conversation_id && TERMINAL_STATES.has(entry.state))
      .forEach(entry => {
        const run = { entry, indexName, initialCompletedTs };
        const existing = lookup.get(entry.conversation_id);
        if (existing) existing.push(run);
        else lookup.set(entry.conversation_id, [run]);
      });
  });

  lookup.forEach(runs => runs.sort((a, b) => a.entry.updated_on - b.entry.updated_on));

  return lookup;
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
  useIndexRunLiveRefresh({ toolkitId });

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

      const initialCompletedTs = initialCompletedTsOf(metadata.history);
      return metadata.history
        .filter(entry => entry && !entry.conversation_id && TERMINAL_STATES.has(entry.state))
        .map(entry => toRunRow(entry, indexName, resolveIndexEventLabel(entry, initialCompletedTs)))
        .filter(Boolean);
    });
  }, [data]);

  const indexRunLookup = useMemo(() => buildIndexRunLookup(data), [data]);

  return { indexRunRows: rows, indexRunLookup, isIndexRunsLoading: isLoading };
};

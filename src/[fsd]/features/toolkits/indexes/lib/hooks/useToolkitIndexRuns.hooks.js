import { useMemo } from 'react';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { isReclaimableRun } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { initialCompletedTsOf } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';
import { resolveIndexRunDuration } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexHistoryRow.helpers';
import {
  resolveIndexRunEvent,
  resolveIndexRunStatus,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexRunHistoryRow.helpers';
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

const toRunRow = (entry, indexName) => {
  const createdAt = toIsoString(entry.updated_on);
  if (!createdAt) return null;

  const eventLabel = resolveIndexRunEvent(entry);

  return {
    id: `index-run:${indexName}:${entry.updated_on}`,
    created_at: createdAt,
    name: `${eventLabel} — ${indexName}`,
    event_label: eventLabel,
    event_tooltip: `${eventLabel} — ${indexName}`,
    run_status: resolveIndexRunStatus(entry),
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

    // An in_progress entry that will never terminate: superseded by a later run, or the
    // row became reclaimable. A healthy run that is merely display-stale stays out.
    const rowAbandoned = isReclaimableRun(index);
    const isAbandonedEntry = entry =>
      entry.state === IndexStatuses.progress &&
      (entry.conversation_id !== metadata.conversation_id || rowAbandoned);

    const initialCompletedTs = initialCompletedTsOf(metadata.history);
    metadata.history
      .filter(
        entry => entry?.conversation_id && (TERMINAL_STATES.has(entry.state) || isAbandonedEntry(entry)),
      )
      .forEach(entry => {
        const run = { entry, indexName, initialCompletedTs, abandoned: isAbandonedEntry(entry) };
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

      return metadata.history
        .filter(entry => entry && !entry.conversation_id && TERMINAL_STATES.has(entry.state))
        .map(entry => toRunRow(entry, indexName))
        .filter(Boolean);
    });
  }, [data]);

  const indexRunLookup = useMemo(() => buildIndexRunLookup(data), [data]);

  // All indexes, with or without runs, for the Index filter
  const indexNames = useMemo(
    () => (Array.isArray(data) ? data.map(index => index?.metadata?.collection).filter(Boolean) : []),
    [data],
  );

  return { indexRunRows: rows, indexRunLookup, indexNames, isIndexRunsLoading: isLoading };
};

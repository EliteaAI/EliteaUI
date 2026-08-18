import { resolveIndexEventLabel } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';
import { resolveToolEventLabel } from '@/[fsd]/features/toolkits/lib/helpers/toolEvent.helpers';

export const buildRunHistoryRowDecorator = ({ lookup, isLookupReady = true }) => {
  return row => {
    const runs = lookup?.get(row.id);

    if (runs?.length) {
      const lastRun = runs[runs.length - 1];
      const label = resolveIndexEventLabel(lastRun.entry, lastRun.initialCompletedTs);
      const eventLabel = runs.length > 1 ? `${label} (${runs.length} runs)` : label;

      return {
        ...row,
        event_label: eventLabel,
        event_sort: label,
        event_tooltip: `${eventLabel} — ${lastRun.indexName}`,
      };
    }

    const mayStillJoinIndexRun = !isLookupReady && Boolean(row.index_name);
    if (mayStillJoinIndexRun) return { ...row, event_label: null };

    const toolLabel = resolveToolEventLabel(row.operation_type);

    return {
      ...row,
      event_label: toolLabel,
      ...(toolLabel && { event_tooltip: `Started with ${toolLabel}` }),
    };
  };
};

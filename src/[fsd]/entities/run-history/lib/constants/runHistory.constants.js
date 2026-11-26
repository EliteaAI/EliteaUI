import { RUN_STATUS_META } from '@/[fsd]/entities/schedule/lib/helpers/scheduleRuns.helpers';

// The Run History lists of each entity (EliteaAI/elitea_issues#7682): which filters the bar draws, in order, and the
// Status filter's own statuses with their labels and dot colours. The column order and widths live with each page.

// The status a run row and a Status filter option show: the shared run status table (one source for the labels and
// colours), plus the two statuses only an index run has (Partial and Stopped, ticket #7682 AC-38).
const SHARED_STATUS_KEYS = ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'];
const INDEX_ONLY_STATUS_STYLES = {
  partial: { label: 'Partial', color: 'warning.main' },
  stopped: { label: 'Stopped', color: 'text.secondary' },
};
export const RUN_STATUS_STYLES = {
  ...Object.fromEntries(
    SHARED_STATUS_KEYS.map(key => [
      key,
      { label: RUN_STATUS_META[key].label, color: RUN_STATUS_META[key].color },
    ]),
  ),
  ...INDEX_ONLY_STATUS_STYLES,
};

// The Status filter options per list, in the order the design shows them
export const STATUS_FILTER_KEYS = {
  agent: ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'],
  pipeline: ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'],
  skill: ['running', 'success', 'failed'],
  toolkit: ['running', 'success', 'partial', 'failed', 'stopped'],
  index: ['running', 'success', 'partial', 'failed', 'stopped'],
  mcp: ['running', 'success', 'failed'],
};

// The filter keys each list draws, in the order the filter bar shows them
export const RUN_HISTORY_LAYOUTS = {
  agent: { filters: ['event', 'schedule', 'status', 'complexity', 'version'] },
  pipeline: { filters: ['event', 'schedule', 'status', 'complexity', 'version'] },
  skill: { filters: ['status', 'version'] },
  toolkit: { filters: ['event', 'index', 'status'] },
  index: { filters: ['event', 'status'] },
  mcp: { filters: ['event', 'status'] },
};

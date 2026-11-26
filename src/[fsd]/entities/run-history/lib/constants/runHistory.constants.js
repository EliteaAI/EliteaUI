import { RUN_STATUS_META } from '@/[fsd]/entities/schedule/lib/helpers/scheduleRuns.helpers';

// Shared run statuses plus the index-only Partial and Stopped
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

export const STATUS_FILTER_KEYS = {
  agent: ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'],
  pipeline: ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'],
  skill: ['running', 'success', 'failed'],
  toolkit: ['running', 'success', 'partial', 'failed', 'stopped'],
  index: ['running', 'success', 'partial', 'failed', 'stopped'],
  mcp: ['running', 'success', 'failed'],
};

export const RUN_HISTORY_LAYOUTS = {
  agent: { filters: ['event', 'schedule', 'status', 'complexity', 'version'] },
  pipeline: { filters: ['event', 'schedule', 'status', 'complexity', 'version'] },
  skill: { filters: ['status', 'version'] },
  toolkit: { filters: ['event', 'index', 'status'] },
  index: { filters: ['event', 'status'] },
  mcp: { filters: ['event', 'status'] },
};

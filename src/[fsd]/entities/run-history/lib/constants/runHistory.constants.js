// The Run History lists of each entity (EliteaAI/elitea_issues#7682): which filters the bar draws, in order, and the
// Status filter's own statuses with their labels and dot colours. The column order and widths live with each page.

// The status a run row and a Status filter option show, with its dot colour. Colours are MUI palette paths.
export const RUN_STATUS_STYLES = {
  running: { label: 'Running', color: 'info.main' },
  waiting_for_approval: { label: 'Awaiting approval', color: 'warning.main' },
  success: { label: 'Success', color: 'success.main' },
  failed: { label: 'Failed', color: 'error.main' },
  skipped: { label: 'Skipped', color: 'text.secondary' },
  blocked: { label: 'Blocked', color: 'error.main' },
  partial: { label: 'Partial', color: 'warning.main' },
  stopped: { label: 'Stopped', color: 'text.secondary' },
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
  agent: { filters: ['event', 'schedule', 'status', 'version'] },
  pipeline: { filters: ['event', 'schedule', 'status', 'version'] },
  skill: { filters: ['status', 'version'] },
  toolkit: { filters: ['event', 'index', 'status'] },
  index: { filters: ['event', 'status'] },
  mcp: { filters: ['event', 'status'] },
};

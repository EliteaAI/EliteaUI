// The Run History layout per entity (EliteaAI/elitea_issues#7682, prototype PAGES and COLS). A column the entity
// lacks is not drawn; the others keep this order and width on every page.

// Column keys in the one fixed order, with their header label and grid track
export const RUN_HISTORY_COLUMNS = {
  date: { key: 'date', label: 'Date', track: '10rem' },
  event: { key: 'event', label: 'Event', track: 'minmax(9rem, 1fr)', sortable: true },
  schedule: { key: 'schedule', label: 'Schedule/Webhook', track: '10rem' },
  index: { key: 'index', label: 'Index', track: '10rem' },
  status: { key: 'status', label: 'Status', track: '9.5rem' },
  complexity: { key: 'complexity', label: 'Complexity', track: '7.5rem' },
  version: { key: 'version', label: 'Version', track: '7rem', sortable: true },
  duration: { key: 'duration', label: 'Duration', track: '5.5rem', sortable: true },
  actions: { key: 'actions', label: '', track: '4.5rem' },
};

// The five index events of a toolkit index, in the order the filter lists them (ticket §6)
export const INDEX_EVENTS = ['index_created', 'indexing', 'reindex', 'scheduled_reindex', 'search_index'];
export const INDEX_EVENT_LABELS = {
  index_created: 'Index created',
  indexing: 'Indexing',
  reindex: 'Reindex',
  scheduled_reindex: 'Scheduled reindex',
  search_index: 'Search index',
};

// Index run statuses: the browser filters on these, the server never sees them
export const INDEX_STATUS_VALUES = ['running', 'success', 'partial', 'failed', 'stopped'];

// The run outcomes the server filters on (`run_outcome`, AC-24, AC-26)
export const RUN_OUTCOME_VALUES = [
  'running',
  'waiting_for_approval',
  'success',
  'failed',
  'skipped',
  'blocked',
];

const ALL_COLUMNS = Object.keys(RUN_HISTORY_COLUMNS);

// Per entity: the columns in order, and the filter keys in the order the bar draws them
export const RUN_HISTORY_LAYOUTS = {
  agent: {
    columns: ['date', 'event', 'schedule', 'status', 'complexity', 'version', 'duration', 'actions'],
    filters: ['event', 'schedule', 'status', 'complexity', 'version'],
    sidePanel: false,
    analytics: true,
  },
  pipeline: {
    columns: ['date', 'event', 'schedule', 'status', 'complexity', 'version', 'duration', 'actions'],
    filters: ['event', 'schedule', 'status', 'complexity', 'version'],
    sidePanel: false,
    analytics: true,
  },
  skill: {
    columns: ['date', 'event', 'status', 'version', 'duration', 'actions'],
    filters: ['status', 'version'],
    sidePanel: true,
    analytics: false,
  },
  toolkit: {
    columns: ['date', 'event', 'index', 'status', 'duration', 'actions'],
    filters: ['event', 'index', 'status'],
    sidePanel: true,
    analytics: false,
  },
  index: {
    columns: ['date', 'event', 'status', 'duration', 'actions'],
    filters: ['event', 'status'],
    sidePanel: true,
    analytics: false,
  },
  mcp: {
    columns: ['date', 'event', 'status', 'duration', 'actions'],
    filters: ['event', 'status'],
    sidePanel: true,
    analytics: false,
  },
};

// Complexity is drawn only when the platform setting is on, so the layout list is the one place it is decided
export const resolveRunHistoryColumnKeys = (layout, { complexityEnabled }) =>
  layout.columns.filter(key => key !== 'complexity' || complexityEnabled);

export const resolveRunHistoryGridTemplate = columnKeys =>
  columnKeys.map(key => RUN_HISTORY_COLUMNS[key].track).join(' ');

// Columns that can sort the loaded rows (ticket AC-3): Date, Event, Version and Duration only
export const SORTABLE_COLUMN_KEYS = new Set(['date', 'event', 'version', 'duration']);

export const isKnownColumnKey = key => ALL_COLUMNS.includes(key);

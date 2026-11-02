export const ALL_OPTION_VALUE = '';
export const NO_QUERY_PARAMS = {};

export const FILTER_PARAMS = {
  schedule: 'schedule_id',
  status: 'status',
  trigger: 'trigger_type',
  version: 'version_id',
};

// The values the Run History list API accepts; any other value in the URL is ignored
export const STATUS_VALUES = ['running', 'waiting_for_approval', 'success', 'failed', 'skipped', 'blocked'];

export const TRIGGER_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Manual', value: 'manual' },
  { label: 'Test', value: 'test' },
];

export const ALL_OPTION_VALUE = '';
export const NO_QUERY_PARAMS = {};

// URL param of each filter. `status` is not here: the list API's `status` is the schedule run record, while the
// derived status of a row is `run_outcome` (ticket AC-24, AC-26)
export const FILTER_PARAMS = {
  schedule: 'schedule_id',
  run_outcome: 'run_outcome',
  trigger: 'trigger',
  version: 'version_id',
  tool: 'tool_name',
};

// The list API param of an execution type: runs without a run record are told apart by the chat's own type
export const EXECUTION_TYPE_PARAM = 'execution_type';

// One `trigger` value in the URL; `param` is the list API param it is sent as
export const TRIGGER_OPTIONS = [
  { label: 'Scheduled', value: 'cron', param: FILTER_PARAMS.trigger },
  { label: 'Manual', value: 'manual', param: FILTER_PARAMS.trigger },
  { label: 'Webhook', value: 'webhook', param: FILTER_PARAMS.trigger },
  { label: 'Test', value: 'test', param: FILTER_PARAMS.trigger },
  { label: 'Chat', value: 'chat', param: EXECUTION_TYPE_PARAM },
  { label: 'API', value: 'api', param: EXECUTION_TYPE_PARAM },
  { label: 'MCP', value: 'mcp', param: EXECUTION_TYPE_PARAM },
];

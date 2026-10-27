export { TOP_LIST_SIZE as CHAT_ACTIVITY_TOP_N } from './analyticsCommon.constants';
export const CHAT_ACTIVITY_DEBOUNCE_MS = 300;
export const CHAT_ACTIVITY_DEFAULT_SORT = { sortBy: 'llm_cost', sortOrder: 'desc' };

export const PARTICIPANT_ICON_TYPE = {
  model: 'llm',
  agent: 'agent',
  pipeline: 'pipeline',
  skill: 'skill',
};

export const PARTICIPANT_TYPE_ORDER = ['model', 'agent', 'pipeline', 'skill'];

export const CHAT_COLUMNS = [
  { key: 'chat_name', label: 'Chat', width: 200 },
  { key: 'owner', label: 'Owner', teamOnly: true, width: 140 },
  { key: 'participants', label: 'Participants', sortable: false, width: 130 },
  { key: 'responses', label: 'Responses', width: 90 },
  { key: 'users', label: 'Users', teamOnly: true, width: 80 },
  { key: 'llm_cost', label: 'Total Cost', width: 105 },
  { key: 'input_cost', label: 'Input Token Cost', width: 140 },
  { key: 'output_cost', label: 'Output Token Cost', width: 148 },
  { key: 'total_tokens', label: 'Total Tokens', width: 112 },
  { key: 'input_tokens', label: 'Input Tokens', width: 112 },
  { key: 'output_tokens', label: 'Output Tokens', width: 122 },
  { key: 'cache_read_tokens', label: 'Cache Read Tokens', width: 152 },
  { key: 'cache_creation_tokens', label: 'Cache Write Tokens', width: 156 },
  { key: 'cache_read_cost', label: 'Cache Read Cost', width: 136 },
  { key: 'cache_creation_cost', label: 'Cache Write Cost', width: 140 },
  { key: 'avg_cost_per_response', label: 'Avg Cost / Response', width: 158 },
  { key: 'models', label: 'Models', sortable: false, width: 100 },
  { key: 'avg_duration_ms', label: 'Avg Latency', width: 108 },
  { key: 'errors', label: 'Errors', width: 75 },
  { key: 'last_activity', label: 'Last Activity', width: 124 },
];

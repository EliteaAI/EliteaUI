import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';

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
  { key: 'owner', label: 'Owner', teamOnly: true, render: r => r.owner_email || '-', width: 140 },
  { key: 'participants', label: 'Participants', sortable: false, width: 130 },
  { key: 'responses', label: 'Responses', render: r => AnalyticCommonHelpers.fmtNum(r.responses), width: 90 },
  {
    key: 'users',
    label: 'Users',
    teamOnly: true,
    render: r => AnalyticCommonHelpers.fmtNum(r.users),
    width: 80,
  },
  {
    key: 'llm_cost',
    label: 'Total Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.llm_cost),
    width: 105,
  },
  {
    key: 'input_cost',
    label: 'Input Token Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.input_cost),
    width: 140,
  },
  {
    key: 'output_cost',
    label: 'Output Token Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.output_cost),
    width: 148,
  },
  {
    key: 'total_tokens',
    label: 'Total Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.total_tokens),
    width: 112,
  },
  {
    key: 'input_tokens',
    label: 'Input Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.input_tokens),
    width: 112,
  },
  {
    key: 'output_tokens',
    label: 'Output Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.output_tokens),
    width: 122,
  },
  {
    key: 'cache_read_tokens',
    label: 'Cache Read Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.cache_read_tokens),
    width: 152,
  },
  {
    key: 'cache_creation_tokens',
    label: 'Cache Write Tokens',
    render: r => AnalyticCommonHelpers.fmtNum(r.cache_creation_tokens),
    width: 156,
  },
  {
    key: 'cache_read_cost',
    label: 'Cache Read Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.cache_read_cost),
    width: 136,
  },
  {
    key: 'cache_creation_cost',
    label: 'Cache Write Cost',
    render: r => AnalyticCommonHelpers.fmtCost(r.cache_creation_cost),
    width: 140,
  },
  {
    key: 'avg_cost_per_response',
    label: 'Avg Cost / Response',
    render: r => AnalyticCommonHelpers.fmtCost(r.avg_cost_per_response),
    width: 158,
  },
  { key: 'models', label: 'Models', sortable: false, width: 100 },
  {
    key: 'avg_duration_ms',
    label: 'Avg Latency',
    render: r => AnalyticCommonHelpers.fmtDuration(r.avg_duration_ms),
    width: 108,
  },
  { key: 'errors', label: 'Errors', render: r => AnalyticCommonHelpers.fmtNum(r.errors), width: 75 },
  { key: 'last_activity', label: 'Last Activity', width: 124 },
];

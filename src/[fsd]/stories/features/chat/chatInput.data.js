// Sample answers for the chat input stories: the sample workspace of stories/lib plus one chat with messages, the
// models and the details of the agent in that chat. Not wired to the backend; the shapes are the API's.
import { ROUTES, STATE } from '@/[fsd]/stories/lib/sampleApp.data';

export const PROJECT_ID = STATE.settings.project.id;
const USER = STATE.user;

// «Release notes for 2.4», the first chat of the sample chat list
export const CHAT_ID = 101;
const CHAT_NAME = 'Release notes for 2.4';
export const AGENT = { id: 11, name: 'Release Notes Writer' };

const MODEL = {
  id: 1,
  name: 'gpt-5',
  display_name: 'gpt-5',
  project_id: PROJECT_ID,
  default: true,
  shared: true,
  context_window: 400000,
  supports_reasoning: true,
  supports_vision: true,
};
const model = (id, name, extra = {}) => ({
  id,
  name,
  display_name: name,
  project_id: PROJECT_ID,
  shared: true,
  context_window: 200000,
  ...extra,
});
const MODELS = [
  MODEL,
  model(2, 'gpt-5-mini', { supports_vision: true }),
  model(3, 'claude-sonnet-4-5', { supports_reasoning: true, supports_vision: true }),
];
const AUTO_ROUTING = {
  enabled: true,
  readiness: { ready: true },
  profile_ref: 'default',
  limits: { context_window: 200000 },
};

const USER_PARTICIPANT = {
  id: 1,
  entity_name: 'user',
  entity_meta: { id: USER.id, email: USER.email },
  meta: { user_name: USER.name },
};
const MODEL_PARTICIPANT = {
  id: 2,
  entity_name: 'llm',
  entity_meta: { model_name: MODEL.name, project_id: PROJECT_ID },
  entity_settings: { model_name: MODEL.name, model_project_id: PROJECT_ID },
  meta: { name: MODEL.display_name },
};
const AGENT_PARTICIPANT_ID = 3;
export const AGENT_VERSION = {
  id: AGENT.id * 100 + 1,
  name: 'latest',
  status: 'published',
  created_at: '2026-11-04T10:00:00Z',
};
const AGENT_PARTICIPANT = {
  id: AGENT_PARTICIPANT_ID,
  entity_name: 'application',
  entity_meta: { id: AGENT.id, project_id: PROJECT_ID },
  entity_settings: { version_id: AGENT_VERSION.id },
  meta: { name: AGENT.name },
};
// How the chat remembers who answers (localStorage, getChatParticipantUniqueId): kind, entity id and project
export const AGENT_PARTICIPANT_KEY = `application_${AGENT.id}_${PROJECT_ID}`;
const AGENT_DETAILS = {
  ...AGENT,
  description: 'Turns merged tickets into release notes for customers.',
  icon_meta: {},
  project_id: PROJECT_ID,
  versions: [AGENT_VERSION],
  version_details: {
    ...AGENT_VERSION,
    agent_type: 'chat',
    variables: [],
    tools: [],
    llm_settings: { model_name: MODEL.name, model_project_id: PROJECT_ID },
  },
};

const QUESTION = 'Write the release notes for 2.4 from the merged tickets';
const ANSWER =
  'Release 2.4 brings chat folders, a faster file upload and a fix for the date filter. ' +
  'Want me to split them into Added / Changed / Fixed?';

const minutesAgo = minutes =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString().replace('T', ' ').replace(/\..+$/, '');

const textItem = (id, content) => ({
  id,
  uuid: `item-${id}`,
  order_index: 0,
  item_type: 'text_message',
  item_details: { id, content, item_type: 'text_message' },
  meta: {},
});

const CHAT_DETAILS = {
  id: CHAT_ID,
  uuid: `conv-${CHAT_ID}`,
  name: CHAT_NAME,
  is_private: true,
  owner_id: USER.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participants: [USER_PARTICIPANT, MODEL_PARTICIPANT, AGENT_PARTICIPANT],
  instructions: '',
  meta: { context_strategy: { context_window_mode: 'balanced' } },
  message_groups: [
    {
      id: 1001,
      uuid: 'msg-1001',
      created_at: minutesAgo(3),
      author_participant_id: USER_PARTICIPANT.id,
      sent_to_id: AGENT_PARTICIPANT_ID,
      message_items: [textItem(5001, QUESTION)],
      meta: {},
    },
    {
      id: 1002,
      uuid: 'msg-1002',
      created_at: minutesAgo(2),
      author_participant_id: AGENT_PARTICIPANT_ID,
      reply_to_id: 1001,
      message_items: [textItem(5002, ANSWER)],
      meta: {},
    },
  ],
  total_message_groups: 2,
};

// «API error triage», a chat with something of every kind: 3 agents, 1 pipeline, 2 skills, 3 toolkits, 1 MCP; the
// modules Planner, Ask User and Web Search are on, Web Search without the platform's search (locked, with its reason)
export const FULL_CHAT_ID = 108;
const participant = (id, entity_name, entityId, name, extra = {}) => ({
  id,
  entity_name,
  entity_meta: { id: entityId, project_id: PROJECT_ID },
  entity_settings: {},
  meta: { name },
  ...extra,
});
const FULL_PARTICIPANTS = [
  AGENT_PARTICIPANT,
  participant(4, 'application', 12, 'Jira Triage'),
  participant(5, 'application', 13, 'UX Design Analyst'),
  participant(6, 'application', 32, 'Bug to Fix Flow', { entity_settings: { agent_type: 'pipeline' } }),
  participant(7, 'skill', 43, 'Accessibility Check'),
  participant(8, 'skill', 44, 'SQL Helper'),
  participant(9, 'toolkit', 51, 'Jira', { entity_settings: { toolkit_type: 'jira' } }),
  participant(10, 'toolkit', 52, 'Confluence', { entity_settings: { toolkit_type: 'confluence' } }),
  participant(11, 'toolkit', 53, 'GitHub', { entity_settings: { toolkit_type: 'github' } }),
  participant(12, 'toolkit', 61, 'Figma', {
    entity_settings: { toolkit_type: 'mcp' },
    meta: { name: 'Figma', mcp: true },
  }),
];
const FULL_QUESTION = 'Triage last night’s API errors and file the new ones in Jira';
const FULL_ANSWER =
  'Filed 2 tickets in BUGS: BUGS-1412 “Export drops the last row” and BUGS-1413 “Date filter ignores the time ' +
  'zone”. Both are linked to release 2.4.';
const FULL_CHAT_DETAILS = {
  ...CHAT_DETAILS,
  id: FULL_CHAT_ID,
  uuid: `conv-${FULL_CHAT_ID}`,
  name: 'API error triage',
  participants: [USER_PARTICIPANT, MODEL_PARTICIPANT, ...FULL_PARTICIPANTS],
  meta: {
    context_strategy: { context_window_mode: 'balanced' },
    internal_tools: ['planner', 'ask_user', 'web_search'],
  },
  message_groups: [
    { ...CHAT_DETAILS.message_groups[0], message_items: [textItem(5101, FULL_QUESTION)] },
    { ...CHAT_DETAILS.message_groups[1], message_items: [textItem(5102, FULL_ANSWER)] },
  ],
};

// The chat's context: 7 300 of 269 280 input tokens, Balanced; the usage totals grow with it
export const contextStatus = (current_tokens = 7300) => ({
  utilization: current_tokens / 269280,
  current_tokens,
  max_tokens: 269280,
  message_groups_in_context: 2,
  strategy_name: 'sliding_window',
  context_analytics: { summaries_generated: 0 },
  window_mode: 'balanced',
  window_source: 'model',
  model_window: 272000,
  effective_window: 272000,
  usable_input: 269280,
  compaction_threshold: 242352,
  safety_margin: 0,
  reserved_output: 2720,
  chat_usage: {
    input_tokens: current_tokens,
    output_tokens: Math.round((current_tokens * 620) / 7300),
    cost: Number(((current_tokens * 0.0245) / 7300).toFixed(4)),
  },
});

// Before the sample workspace's routes: the first route whose part is in the path answers
export const routes = ({ context = contextStatus() } = {}) => [
  [`/conversation/prompt_lib/${PROJECT_ID}/${CHAT_ID}`, CHAT_DETAILS],
  [`/context_analytics/prompt_lib/${PROJECT_ID}/${CHAT_ID}`, context],
  [`/conversation/prompt_lib/${PROJECT_ID}/${FULL_CHAT_ID}`, FULL_CHAT_DETAILS],
  [`/context_analytics/prompt_lib/${PROJECT_ID}/${FULL_CHAT_ID}`, context],
  ['/configurations/models/', { items: MODELS, total: MODELS.length, auto_routing: AUTO_ROUTING }],
  ['/configurations/configurations/', { items: [], total: 0 }],
  ['/application/prompt_lib/', AGENT_DETAILS],
  ['/version/prompt_lib/', AGENT_DETAILS.version_details],
  ['/toolkit_validator/prompt_lib/', {}],
  // a model picked in the list: the chat keeps the person's participant (a PATCH answers with it)
  ['/entity_settings/prompt_lib/', USER_PARTICIPANT],
  ...ROUTES,
];

export const state = {
  ...STATE,
  settings: { ...STATE.settings, sideBarCollapsed: true },
};

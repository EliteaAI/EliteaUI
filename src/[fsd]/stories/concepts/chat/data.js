// Sample answers for the chat concept stories: a project with agents, pipelines, toolkits and models, the chat list, one
// chat with a question and an answer, its context status. Not wired to the backend; the shapes are the API's.
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';

export const PROJECT_ID = 42;
export const USER = {
  id: 1,
  name: 'George Smith',
  email: 'george_smith@example.com',
  personal_project_id: 7,
};

const flatten = value => (typeof value === 'string' ? [value] : Object.values(value).flatMap(flatten));
export const ALL_PERMISSIONS = flatten(PERMISSIONS);

const entity = (id, name, project_id, description = '') => ({
  id,
  name,
  description,
  icon_meta: {},
  project_id,
  versions: [],
});

// what the chat's panels ask about each participant (its details, versions, variables). An agent's first
// version id is id * 100 + 1 («latest»); Jira Helper has four, and the chat pins v3-strict-review
const version = (id, name, status = 'draft') => ({ id, name, status, created_at: '2026-11-04T10:00:00Z' });
const VERSIONS = {
  11: [
    version(1101, 'latest', 'published'),
    version(1104, 'v3-strict-review'),
    version(1103, 'v3'),
    version(1102, 'v2'),
  ],
};
const versionsOf = id => VERSIONS[id] || [version(id * 100 + 1, 'latest', 'published')];
const VARIABLES = [{ name: 'project_key', value: 'BUGS' }];
export const pinnedVersion = id => (id === 11 ? 1104 : id * 100 + 1);
const details = (row, { agent_type = 'chat', variables = VARIABLES } = {}) => {
  const versions = versionsOf(row.id);
  const pinned = versions.find(v => v.id === pinnedVersion(row.id)) || versions[0];
  return {
    ...row,
    versions,
    version_details: {
      ...pinned,
      agent_type,
      variables,
      tools: [],
      llm_settings: { model_name: 'gpt-5', model_project_id: PROJECT_ID },
    },
  };
};

// A project's real volume (Levon 13.11: «в одном проекте может быть условно 100»): a few named items, then generated
// ones, as in the approved prototype — so the «+» lists load by 20 and show «Scroll for more · 20 of N»
const AREAS = [
  'Release',
  'Sprint',
  'Incident',
  'Onboarding',
  'Security',
  'API',
  'Docs',
  'Backlog',
  'Customer',
];
const ROLES = {
  Helper: 'Answers questions about % work',
  Reviewer: 'Reviews % changes against the team rules',
  Analyst: 'Finds trends in % data',
  Planner: 'Plans % work for the sprint',
  Assistant: 'Drafts % messages and updates',
};
const FLOWS = {
  Flow: 'Runs the % checklist step by step',
  Sync: 'Keeps % items in sync between Jira and Confluence',
  'Weekly Report': 'Builds the weekly % report',
};
const generated = (firstId, roles, count, make) =>
  Array.from({ length: count }, (_, i) => {
    const area = AREAS[i % AREAS.length];
    const role = Object.keys(roles)[Math.floor(i / AREAS.length) % Object.keys(roles).length];
    const words = area === area.toUpperCase() ? area : area.toLowerCase();
    return make(firstId + i, `${area} ${role}`, roles[role].replaceAll('%', words));
  });

const PROJECT_AGENTS = [
  entity(11, 'Jira Helper', PROJECT_ID, 'Creates and updates Jira tickets from the chat'),
  entity(12, 'Release Notes Writer', PROJECT_ID, 'Turns merged pull requests into release notes'),
  entity(13, 'UX Design Analyst', PROJECT_ID, 'Reviews screens against the design rules'),
  ...generated(200, ROLES, 40, (id, name, description) => entity(id, name, PROJECT_ID, description)),
];
const PIPELINES = [
  entity(31, 'Design Review Flow', PROJECT_ID, 'Checks a Figma frame, then files issues'),
  entity(32, 'Release Flow', PROJECT_ID, 'Runs the release checklist step by step'),
  ...generated(300, FLOWS, 12, (id, name, description) => entity(id, name, PROJECT_ID, description)),
];
const toolkit = (id, name, type, description = '', meta) => ({
  id,
  name,
  toolkit_name: name,
  type,
  description,
  settings: {},
  project_id: PROJECT_ID,
  ...(meta && { meta }),
});
const TOOLKITS = [
  toolkit(41, 'Jira', 'jira', 'Search, create and update issues in BUGS'),
  toolkit(42, 'Confluence', 'confluence', 'Read and write pages of the team space'),
  toolkit(43, 'GitHub', 'github', 'Read pull requests and files of EliteaUI'),
  toolkit(44, 'Slack', 'slack', 'Post to and read the team channels'),
  toolkit(45, 'SharePoint', 'sharepoint', 'Read documents of the project site'),
  toolkit(46, 'Figma', 'figma', 'Read frames and comments of the design files'),
  toolkit(47, 'GitLab', 'gitlab', 'Read merge requests of the platform repos'),
];
const MCPS = [
  toolkit(51, 'Playwright', 'mcp', 'Opens pages in a browser and checks them', { mcp: true }),
  toolkit(52, 'Sentry', 'mcp', 'Reads errors and releases of the app', { mcp: true }),
];
const PUBLIC_AGENTS = [
  entity(21, 'Code Review Assistant', PUBLIC_PROJECT_ID, 'Comments on a pull request diff'),
  entity(22, 'UX Design Analyst', PUBLIC_PROJECT_ID, 'Design review for any AI platform, generic rules'),
  entity(23, 'SQL Query Helper', PUBLIC_PROJECT_ID, 'Writes and explains SQL for the analytics warehouse'),
];
const OWN_SKILLS = [
  entity(
    61,
    'design-review',
    PROJECT_ID,
    'Checks a screen or a pull request against the ELITEA design rules',
  ),
  entity(62, 'release-notes', PROJECT_ID, 'Turns merged pull requests into release notes'),
  entity(63, 'bug-triage', PROJECT_ID, 'Sorts new bugs by component and priority'),
];
const CATALOG_SKILLS = [
  entity(71, 'test-cases', PUBLIC_PROJECT_ID, 'Builds test cases from a user story'),
  entity(72, 'meeting-notes', PUBLIC_PROJECT_ID, 'Writes notes and action items from a transcript'),
];

const byQuery = (url, rows) => {
  const q = (new URL(url, 'http://x').searchParams.get('query') || '').toLowerCase();
  return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
};
// one page of a list, as the API pages it (limit, offset); total counts every matching row
const list = (rows, url) => {
  const params = url ? new URL(url, 'http://x').searchParams : new URLSearchParams();
  const offset = Number(params.get('offset') || 0);
  const limit = Number(params.get('limit') || rows.length);
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
};

// A shared model with a 400K window: the Context management card reads Balanced 272K / Full 400K, as in the prototype.
// display_name = name: the answer's header shows the model's name, the button its display name — one word on screen
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
// the model list — Auto (auto routing on, as on dev) and a few models with their capabilities
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
  model(4, 'gemini-2.5-pro', { supports_reasoning: true, supports_vision: true, context_window: 1000000 }),
];
const AUTO_ROUTING = {
  enabled: true,
  readiness: { ready: true },
  profile_ref: 'default',
  limits: { context_window: 200000 },
};

// The chat of the stories: one question, one answer from the model (the prototype's «chat after one message»)
export const CHAT_ID = 101;
const QUESTION = 'find the latest news about the Jira API';
const ANSWER =
  'I can’t search the Internet in this chat, so this answer comes from what I already know and may be out of date. ' +
  'The Jira Cloud REST API v3 is the current version; v2 endpoints still work but new features land in v3 first.';

const minutesAgo = minutes =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString().replace('T', ' ').replace(/\..+$/, '');

const conversation = (id, name, daysAgo, is_private = true) => {
  const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();
  return {
    id,
    uuid: `conv-${id}`,
    name,
    is_private,
    participants: [],
    owner_id: USER.id,
    created_at: date,
    updated_at: date,
  };
};

const FOLDERS = {
  date_groups: [
    {
      name: 'today',
      conversations: [
        // different times (0, ~1 h, ~2 h ago): with one time for all, the list order changed from story to story
        conversation(CHAT_ID, QUESTION, 0),
        conversation(102, 'Release planning', 0.04),
        conversation(103, 'Review the MCP page', 0.08, false),
      ],
      total: 3,
    },
    { name: 'this_week', conversations: [conversation(104, 'Sprint 42 bugs', 1)], total: 1 },
  ],
  folders: [],
  pinned: { conversations: [] },
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

// The chat «Sprint 42 bugs» with something of every kind, as the prototype's full chat (?state=full): 3 agents (one
// from Catalog), 1 pipeline, 2 skills, 3 toolkits, 1 MCP; the modules Web Search and Elitea Builder are on
export const FULL_CHAT_ID = 104;
const participant = (id, entity_name, row, extra = {}) => ({
  id,
  entity_name,
  entity_meta: { id: row.id, project_id: row.project_id },
  // an agent, pipeline or skill is pinned to a version (as on dev); toolkits have none
  entity_settings: entity_name === 'toolkit' ? {} : { version_id: pinnedVersion(row.id) },
  meta: { name: row.name },
  ...extra,
});
const FULL_PARTICIPANTS = [
  participant(3, 'application', PROJECT_AGENTS[0]),
  participant(4, 'application', PROJECT_AGENTS[2]),
  participant(5, 'application', PUBLIC_AGENTS[0]),
  participant(6, 'application', PIPELINES[0], {
    entity_settings: { agent_type: 'pipeline', version_id: pinnedVersion(PIPELINES[0].id) },
  }),
  participant(7, 'skill', OWN_SKILLS[0]),
  participant(8, 'skill', CATALOG_SKILLS[0]),
  participant(9, 'toolkit', TOOLKITS[0]),
  participant(10, 'toolkit', TOOLKITS[1]),
  participant(11, 'toolkit', TOOLKITS[2]),
  participant(12, 'toolkit', MCPS[0], { meta: { name: MCPS[0].name, mcp: true } }),
];

const textItem = (id, content) => ({
  id,
  uuid: `item-${id}`,
  order_index: 0,
  item_type: 'text_message',
  item_details: { id, content, item_type: 'text_message' },
  meta: {},
});

const CHAT_DETAILS = {
  ...conversation(CHAT_ID, QUESTION, 0),
  participants: [USER_PARTICIPANT, MODEL_PARTICIPANT],
  instructions: '',
  meta: { context_strategy: { context_window_mode: 'balanced' } },
  message_groups: [
    {
      id: 1001,
      uuid: 'msg-1001',
      created_at: minutesAgo(3),
      author_participant_id: USER_PARTICIPANT.id,
      sent_to_id: MODEL_PARTICIPANT.id,
      message_items: [textItem(5001, QUESTION)],
      meta: {},
    },
    {
      id: 1002,
      uuid: 'msg-1002',
      created_at: minutesAgo(2),
      author_participant_id: MODEL_PARTICIPANT.id,
      reply_to_id: 1001,
      message_items: [textItem(5002, ANSWER)],
      meta: {},
    },
  ],
  total_message_groups: 2,
};

const FULL_QUESTION = 'File the new bugs from the sprint 42 triage in Jira';
const FULL_ANSWER =
  'Created 3 tickets in BUGS: BUGS-1412 “Export drops the last row”, BUGS-1413 “Date filter ignores the time ' +
  'zone”, BUGS-1414 “Empty state flickers on load”. All three are linked to release 0.4.26.';
const FULL_CHAT_DETAILS = {
  ...conversation(FULL_CHAT_ID, 'Sprint 42 bugs', 1),
  participants: [USER_PARTICIPANT, MODEL_PARTICIPANT, ...FULL_PARTICIPANTS],
  instructions: '',
  meta: {
    context_strategy: { context_window_mode: 'balanced' },
    internal_tools: ['web_search', 'elitea_builder'],
  },
  message_groups: [
    { ...CHAT_DETAILS.message_groups[0], message_items: [textItem(5101, FULL_QUESTION)] },
    { ...CHAT_DETAILS.message_groups[1], message_items: [textItem(5102, FULL_ANSWER)] },
  ],
  total_message_groups: 2,
};

// Context of that chat: 7 300 of 269 280 input tokens, Balanced (the prototype's numbers after one message); the chat's
// usage totals grow with it, so a chat near the limit does not show 7 300 tokens used next to 250 000 in context
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

// An answer with an HTTP status other than 200 (storyApi answers 200 to everything; conceptScreen.frame reads the mark)
export const STATUS_MARK = '__conceptStatus';
const withStatus = (status, body) => ({ [STATUS_MARK]: status, body });

const BROKEN_TOOLKIT_ID = 43;
const PIPELINE_IDS = PIPELINES.map(p => p.id);
// the entity's id in a details path: the first number after prompt_lib (public) or the second (project/<id>/…)
const idIn = (url, isPublic) => {
  const after = new URL(url, 'http://x').pathname.split('/prompt_lib/')[1] || '';
  const numbers = after
    .split('/')
    .filter(part => /^\d+$/.test(part))
    .map(Number);
  return isPublic ? numbers[0] : numbers[1];
};
const byId = (url, rows, pipelineIds = []) => {
  const id = idIn(url, rows === PUBLIC_AGENTS || rows === CATALOG_SKILLS);
  const row = rows.find(r => r.id === id);
  return row ? details(row, { agent_type: pipelineIds.includes(id) ? 'pipeline' : 'chat' }) : {};
};
// /version/prompt_lib/<project>/<app>/<version>
const versionOf = url => {
  const parts = new URL(url, 'http://x').pathname.split('/');
  const [appId, versionId] = parts.slice(-2).map(Number);
  const v = versionsOf(appId).find(x => x.id === versionId) || versionsOf(appId)[0];
  return {
    ...v,
    variables: VARIABLES,
    tools: [],
    agent_type: PIPELINE_IDS.includes(appId) ? 'pipeline' : 'chat',
  };
};
const toolkitOf = url => {
  const row = [...TOOLKITS, ...MCPS].find(t => t.id === idIn(url));
  if (!row) return {};
  return row.meta?.mcp ? { ...row, online: true, settings: { url: 'https://mcp.example.com' } } : row;
};

export const routes = ({ context = contextStatus() } = {}) => [
  ['/permissions/prompt_lib/', ALL_PERMISSIONS],
  ['/author/', USER],
  [
    '/projects/project/',
    [
      { id: 7, name: 'Personal' },
      { id: PROJECT_ID, name: 'Bugs & Features' },
    ],
  ],
  ['/secrets/secrets/', []],
  ['/folder/prompt_lib/', FOLDERS],
  [`/conversation/prompt_lib/${PROJECT_ID}/${CHAT_ID}`, CHAT_DETAILS],
  [`/conversation/prompt_lib/${PROJECT_ID}/${FULL_CHAT_ID}`, FULL_CHAT_DETAILS],
  [`/context_analytics/prompt_lib/${PROJECT_ID}/${CHAT_ID}`, context],
  [`/context_analytics/prompt_lib/${PROJECT_ID}/${FULL_CHAT_ID}`, context],
  [
    '/public_applications/prompt_lib',
    url => list(url.includes('agents_type=pipeline') ? [] : byQuery(url, PUBLIC_AGENTS), url),
  ],
  [
    '/applications/prompt_lib/',
    url => list(byQuery(url, url.includes('agents_type=pipeline') ? PIPELINES : PROJECT_AGENTS), url),
  ],
  ['/tools/prompt_lib/', url => list(byQuery(url, url.includes('mcp=true') ? MCPS : TOOLKITS), url)],
  ['/public_skills/prompt_lib/', url => list(byQuery(url, CATALOG_SKILLS), url)],
  ['/skills/prompt_lib/', url => list(byQuery(url, OWN_SKILLS), url)],
  // toolkit schemas: Image Creation is listed in Modules only when the image provider's toolkit type exists (as on dev)
  [
    '/toolkits/prompt_lib/',
    { ImageGenServiceProvider_ImageGen: { title: 'Image generation', properties: {} } },
  ],
  ['/platform_settings', { tool_spend: { web_search: { available: true } } }],
  ['/configurations/models/', { items: MODELS, total: MODELS.length, auto_routing: AUTO_ROUTING }],
  // details of the chat's participants (the panel's rows, versions, variables)
  ['/application/prompt_lib/', url => byId(url, [...PROJECT_AGENTS, ...PIPELINES], PIPELINE_IDS)],
  ['/public_application/prompt_lib/', url => byId(url, PUBLIC_AGENTS)],
  ['/version/prompt_lib/', url => versionOf(url)],
  ['/skill/prompt_lib/', url => byId(url, OWN_SKILLS)],
  ['/public_skill/prompt_lib/', url => byId(url, CATALOG_SKILLS)],
  ['/tool/prompt_lib/', url => toolkitOf(url)],
  // GitHub (43) is misconfigured: its validator answers 400 with the settings errors (see conceptScreen.frame)
  [
    `/toolkit_validator/prompt_lib/${PROJECT_ID}/${BROKEN_TOOLKIT_ID}`,
    withStatus(400, {
      settings_errors: [{ type: 'missing', loc: ['github_configuration'], msg: 'Field required' }],
    }),
  ],
  ['/toolkit_validator/prompt_lib/', {}],
  // a model picked in the list: the chat keeps the person's participant (the answer of a PATCH is that participant)
  ['/entity_settings/prompt_lib/', USER_PARTICIPANT],
  ['/chat_templates/', []],
];

export const state = {
  settings: { project: { id: PROJECT_ID, name: 'Bugs & Features' }, sideBarCollapsed: true },
  user: { ...USER, permissions: ALL_PERMISSIONS, publicPermissions: ALL_PERMISSIONS },
};

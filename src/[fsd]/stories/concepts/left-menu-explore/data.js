// Sample data for the sidebar + Customize concept stories. Nothing here reaches a backend.
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
const dateGroup = (name, conversations) => ({ name, conversations, total: conversations.length });

// Two collapsible groups, as in Katya's menu (Figma Prototypes 72:4208; owner 2026-11-10: «две секции pinned и
// recent»). The team's group header shows a group's name as is (GroupedConversations: DATE_GROUP_DISPLAY_NAMES[name]
// || name), and a row with isPinned draws the team's pin.
const pinned = chat => ({ ...chat, isPinned: true });
export const DATE_GROUPS = [
  dateGroup('Pinned', [
    pinned(conversation(114, 'Roadmap Q1', 15)),
    pinned(conversation(112, 'Quarterly business review', 9)),
  ]),
  dateGroup('Recent', [
    conversation(101, 'Release notes for 2.4', 0),
    conversation(102, 'Sprint review summary', 0, false),
    conversation(103, 'Onboarding checklist draft', 0),
    conversation(104, 'Customer interview notes', 0),
    conversation(107, 'Design review feedback', 2),
    conversation(108, 'API error triage', 2),
    conversation(109, 'Team retro actions', 3),
    conversation(111, 'Pricing page questions', 4),
    conversation(113, 'Vendor contract summary', 12),
  ]),
];

// Chat folders as on dev (owner 2026-11-12: «на Dev есть возможность создавать фолдеры и даже их пинить»): the shape
// the team's list reads (FolderItem: name, owner_id, meta.is_pinned; FolderAccordionItem: conversations, total); a chat
// in a folder carries its folder_id. One folder is pinned, so the Pinned group shows both kinds.
const chatFolder = (id, name, is_pinned, conversations) => ({
  id,
  name,
  owner_id: USER.id,
  meta: { is_pinned },
  conversations: conversations.map(c => ({ ...c, folder_id: id })),
  total: conversations.length,
});
export const CHAT_FOLDERS = [
  chatFolder(301, 'Product launch', true, [
    conversation(121, 'Launch checklist', 1),
    conversation(122, 'Press release draft', 5),
  ]),
  chatFolder(302, 'Customer research', false, [
    conversation(123, 'Interview guide', 3),
    conversation(124, 'Survey results summary', 6),
  ]),
  chatFolder(303, 'Hiring', false, [
    conversation(110, 'Hiring plan for Q1', 4),
    conversation(125, 'Job description: Data engineer', 8),
  ]),
];

export const FOLDERS = { date_groups: DATE_GROUPS, folders: CHAT_FOLDERS, pinned: { conversations: [] } };

const author = { id: USER.id, name: USER.name, avatar: '' };
// Catalog items are published by other people, so they do not carry the viewer's own avatar.
const catalogAuthors = [
  { id: 21, name: 'Anna Lee', avatar: '' },
  { id: 22, name: 'Marco Rossi', avatar: '' },
  { id: 23, name: 'Priya Nair', avatar: '' },
];
const published = (row, i) => ({ ...row, author: catalogAuthors[i % 3], authors: [catalogAuthors[i % 3]] });
const tag = (id, name) => ({ id, name, data: {} });
const entity = (id, name, description, tags = [], extra = {}) => ({
  id,
  name,
  description,
  authors: [author],
  author,
  tags,
  icon_meta: {},
  is_pinned: false,
  status: 'draft',
  project_id: PROJECT_ID,
  // The table's Created column; a different day per item so the sort by date shows.
  created_at: new Date(Date.UTC(2026, 9, 1 + (id % 30))).toISOString(),
  ...extra,
});

// One tag set for all kinds, as the project's tag list is shared; each card carries one to three, so a tag on the right
// panel narrows a list to a few cards.
const TAGS = {
  writing: tag(1, 'Writing'),
  jira: tag(2, 'Jira'),
  support: tag(3, 'Support'),
  design: tag(4, 'Design'),
  productivity: tag(5, 'Productivity'),
  sales: tag(6, 'Sales'),
  legal: tag(7, 'Legal'),
  reporting: tag(8, 'Reporting'),
  engineering: tag(9, 'Engineering'),
  hiring: tag(10, 'Hiring'),
  data: tag(12, 'Data'),
  qa: tag(13, 'QA'),
};
const T = TAGS;

export const ENTITIES = {
  agents: [
    entity(
      11,
      'Release Notes Writer',
      'Turns merged tickets into release notes for customers.',
      [T.writing, T.jira],
      { is_pinned: true },
    ),
    entity(12, 'Jira Triage', 'Sorts new bugs by product area and suggests an owner.', [
      T.jira,
      T.support,
      T.engineering,
    ]),
    entity(13, 'UX Design Analyst', 'Reviews a screen against the design system and usability rules.', [
      T.design,
    ]),
    entity(14, 'Meeting Summarizer', 'Writes minutes and action items from a call transcript.', [
      T.productivity,
      T.writing,
    ]),
    entity(15, 'Sales Call Prep', 'Collects what we know about a client before the call.', [
      T.sales,
      T.productivity,
    ]),
    entity(16, 'Contract Reviewer', 'Points out risky clauses in a vendor contract.', [T.legal]),
    entity(17, 'Support Reply Drafter', 'Drafts a first answer to a customer ticket from the help center.', [
      T.support,
      T.writing,
    ]),
    entity(18, 'Test Plan Builder', 'Writes a test plan and edge cases from a user story.', [
      T.qa,
      T.engineering,
    ]),
  ],
  pipelines: [
    entity(31, 'Weekly Status Report', 'Collects Jira progress and drafts the Friday report.', [
      T.reporting,
      T.jira,
    ]),
    entity(32, 'Bug to Fix Flow', 'From a bug report to a reproduction, a fix plan and a PR.', [
      T.engineering,
      T.qa,
    ]),
    entity(33, 'Candidate Screening', 'Reads a CV, scores it against the vacancy, drafts questions.', [
      T.hiring,
    ]),
    entity(34, 'Monthly KPI Digest', 'Pulls the numbers from the analytics base and writes the digest.', [
      T.reporting,
      T.data,
    ]),
  ],
  skills: [
    entity(41, 'Brand Voice', 'Keeps every text in the company tone of voice.', [T.writing]),
    entity(42, 'Data Charts', 'Builds a chart from a table and explains it.', [T.data, T.reporting]),
    entity(43, 'Accessibility Check', 'Finds contrast and keyboard issues on a page.', [T.design, T.qa]),
    entity(44, 'SQL Helper', 'Writes and explains queries for the analytics base.', [T.data, T.engineering]),
    entity(45, 'Interview Questions', 'Suggests questions for a role and a seniority.', [T.hiring]),
  ],
  toolkits: [
    entity(51, 'Jira', 'Read and update issues of the PRODUCT board.', [T.jira], { type: 'jira' }),
    // A toolkit with indexes carries their number, as the list answer on dev does; its card shows «Indexes: N»
    // (EntityCard: indexes_count). Levon 2026-11-12: «показывалось количество индексов».
    entity(52, 'Confluence', 'Search and read the team space.', [T.writing], {
      type: 'confluence',
      indexes_count: 3,
    }),
    entity(53, 'GitHub', 'Repositories of the product team.', [T.engineering], { type: 'github' }),
    entity(54, 'Sales SharePoint', 'Sales decks and call notes of the sales site.', [T.sales], {
      type: 'sharepoint',
      indexes_count: 1,
    }),
  ],
  mcps: [
    entity(61, 'Figma', 'Frames and components of the product files.', [T.design], {
      type: 'mcp',
      online: true,
    }),
    entity(62, 'Google Drive', 'Documents shared with the team.', [T.productivity], {
      type: 'mcp',
      online: false,
    }),
  ],
  // Applications are configured copies of the App Catalog types (applicationCatalog.constants.js: Wikis, Inventory).
  applications: [
    entity(71, 'Product Wiki', 'The product team space as a wiki the chats can read.', [], {
      type: 'wikis_Wikis',
      meta: { application: true },
    }),
    entity(72, 'Codebase Inventory', 'Services, owners and dependencies of the product repositories.', [], {
      type: 'inventory',
      meta: { application: true },
    }),
  ],
};

// Folders per kind (the product's folders of agents, pipelines, skills, toolkits; Applications have none, as on dev).
const folder = (id, name, entityIds) => ({
  id,
  name,
  entityIds,
  meta: {},
  created_at: '2026-11-01T10:00:00Z',
});
const ENTITY_FOLDERS = {
  agent: [folder(201, 'Customer support', [12, 17]), folder(202, 'Docs and writing', [11, 14])],
  pipeline: [folder(211, 'Reports', [31, 34])],
  skill: [folder(221, 'Analytics', [42, 44])],
  toolkit: [folder(231, 'Atlassian', [51, 52])],
  mcp: [],
};
const ALL_FOLDERS = Object.values(ENTITY_FOLDERS).flat();

// The tab Customize shows now. The product's tag panel asks for the project's tags without saying the kind outside its
// own pages (Categories.jsx: entity_coverage comes from the route), so the sample answer reads it from here.
export const customizeSection = { key: 'agents' };

export const CATALOG = [
  entity(
    81,
    'Code Reviewer',
    'Reviews a pull request the way a senior engineer would.',
    [tag(9, 'Engineering')],
    { project_id: PUBLIC_PROJECT_ID },
  ),
  entity(
    82,
    'Market Research',
    'Compares competitors and sums up the market for a product.',
    [tag(6, 'Sales')],
    { project_id: PUBLIC_PROJECT_ID },
  ),
  entity(83, 'Test Case Writer', 'Writes test cases from a user story.', [tag(13, 'QA')], {
    project_id: PUBLIC_PROJECT_ID,
  }),
  entity(84, 'Presentation Builder', 'Turns notes into a slide outline.', [tag(5, 'Productivity')], {
    project_id: PUBLIC_PROJECT_ID,
  }),
].map(published);

export const CATALOG_SKILLS = [
  entity(
    91,
    'Meeting Notes',
    'Turns a transcript into minutes with owners and dates.',
    [tag(5, 'Productivity')],
    { project_id: PUBLIC_PROJECT_ID },
  ),
  entity(92, 'Plain Language', 'Rewrites a text for readers outside the team.', [tag(11, 'Writing')], {
    project_id: PUBLIC_PROJECT_ID,
  }),
  entity(93, 'Excel Analyst', 'Reads a spreadsheet and answers questions about it.', [tag(12, 'Data')], {
    project_id: PUBLIC_PROJECT_ID,
  }),
].map(published);

// Search, tag and folder filters of the list requests, so the sample lists answer as the backend does.
const filtered = (rows, url) => {
  const params = new URL(url, 'http://story').searchParams;
  const query = (params.get('query') || '').toLowerCase();
  const tagIds = params
    .getAll('tags')
    .flatMap(value => value.split(','))
    .filter(Boolean)
    .map(Number);
  const ids = (params.get('ids') || '').split(',').filter(Boolean).map(Number);
  return rows.filter(
    row =>
      (!query || `${row.name} ${row.description}`.toLowerCase().includes(query)) &&
      (!tagIds.length || row.tags.some(t => tagIds.includes(t.id))) &&
      (!params.get('ids') || ids.includes(row.id)),
  );
};
const list = (rows, url) => {
  const result = url ? filtered(rows, url) : rows;
  return { rows: result, total: result.length };
};
const uniqueTags = rows => [...new Map(rows.flatMap(r => r.tags).map(t => [t.id, t])).values()];
const toolRows = url => {
  if (url.includes('mcp=true')) return ENTITIES.mcps;
  if (url.includes('application=true')) return ENTITIES.applications;
  return ENTITIES.toolkits;
};

const schema = (label, extra = {}) => ({ metadata: { label, ...extra }, properties: {} });
const TOOLKIT_SCHEMAS = {
  jira: schema('Jira'),
  confluence: schema('Confluence'),
  github: schema('GitHub'),
  sharepoint: schema('SharePoint'),
  wikis_Wikis: schema('Wikis', { application: true }),
  inventory: schema('Inventory', { application: true }),
};

export const ROUTES = [
  ['/permissions/prompt_lib/', ALL_PERMISSIONS],
  ['/author/', USER],
  [
    '/projects/project/',
    [
      { id: 7, name: 'Personal' },
      { id: PROJECT_ID, name: 'Product Team' },
    ],
  ],
  ['/secrets/secrets/', []],
  // Folders and tags of the Customize lists; before '/folder/prompt_lib/' (the chat folders), which is a substring
  // of '/social/folder/prompt_lib/'.
  [
    '/social/folders/prompt_lib/',
    url => {
      const type = new URL(url, 'http://story').searchParams.get('entity_type');
      const folders = (ENTITY_FOLDERS[type] || []).map(({ entityIds, ...f }) => ({
        ...f,
        entity_type: type,
        entities_count: entityIds.length,
      }));
      return { folders, total: folders.length };
    },
  ],
  [
    '/social/folder_items/prompt_lib/',
    url => {
      const id = Number(url.split('?')[0].split('/').pop());
      const items = (ALL_FOLDERS.find(f => f.id === id)?.entityIds || []).map(entity_id => ({ entity_id }));
      return { items, total: items.length };
    },
  ],
  ['/tags/prompt_lib/', () => list(uniqueTags(ENTITIES[customizeSection.key] || []))],
  ['/skills/prompt_lib/', url => list(ENTITIES.skills, url)],
  ['/tools/prompt_lib/', url => list(toolRows(url), url)],
  // Toolkit types: labels for the cards and the Types filter of the Toolkits panel; App Catalog types are applications.
  ['/toolkit_types/prompt_lib/', url => list([...new Set(toolRows(url).map(row => row.type))])],
  ['/elitea_core/toolkits/prompt_lib/', TOOLKIT_SCHEMAS],
  // The catalog (Discover) sorts published agents into categories by their tag names (useAgentHubData).
  ['/agent_categories/', { categories: uniqueTags(CATALOG).map(({ name }) => ({ name })) }],
  ['/skill_categories/', { categories: uniqueTags(CATALOG_SKILLS).map(({ name }) => ({ name })) }],
  ['/public_skills/prompt_lib/', url => list(CATALOG_SKILLS, url)],
  ['/platform_settings/', {}],
  ['/folder/prompt_lib/', FOLDERS],
  ['/public_applications/prompt_lib', url => list(url.includes('agents_type=pipeline') ? [] : CATALOG, url)],
  [
    '/applications/prompt_lib/',
    url => list(url.includes('agents_type=pipeline') ? ENTITIES.pipelines : ENTITIES.agents, url),
  ],
  [
    '/configurations/models/',
    {
      items: [
        {
          name: 'gpt-4o-mini',
          display_name: 'gpt-4o-mini',
          project_id: PROJECT_ID,
          default: true,
          shared: false,
        },
      ],
      total: 1,
    },
  ],
  ['/chat_templates/', []],
];

export const STATE = {
  settings: { project: { id: PROJECT_ID, name: 'Product Team' }, sideBarCollapsed: false },
  user: { ...USER, permissions: ALL_PERMISSIONS, publicPermissions: ALL_PERMISSIONS },
};

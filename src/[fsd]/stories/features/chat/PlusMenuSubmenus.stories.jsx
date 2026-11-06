import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';

// The routes module must load before the layout, as in App.jsx: layout → MainPanel → routes → router.jsx renders
// <AppLayout /> at load time. A static import of the layout would be sorted above the routes by Prettier, so the
// layout is loaded on first render, when the routes are in place.
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

/**
 * The new chat screen with the chat input's "+" menu (EL-7458): a submenu (Modules, Agents, Pipelines, Skills,
 * Toolkits, MCPs) opens on a click, keeps the main menu's height and one width, and stays put while the search
 * narrows its list, so a single result can be reached with the mouse. 1366 × 768, the app layout on /chat as
 * router.jsx mounts it; the backend is replaced by sample answers, nothing leaves the browser.
 */
const PROJECT_ID = 42;
// A team project, as in the frame: in the personal project the "+" menu hides "Invite Users".
const USER = { id: 1, name: 'George Smith', email: 'george_smith@example.com', personal_project_id: 7 };

// Every permission the app knows, so no route or button is hidden.
const flatten = value => (typeof value === 'string' ? [value] : Object.values(value).flatMap(flatten));
const ALL_PERMISSIONS = flatten(PERMISSIONS);

const agent = (id, name, project_id) => ({
  id,
  name,
  description: '',
  icon_meta: {},
  project_id,
  versions: [],
});

const PROJECT_AGENTS = [
  agent(11, 'Release Notes Writer', PROJECT_ID),
  agent(12, 'Jira Triage', PROJECT_ID),
  agent(13, 'UX Design Analyst', PROJECT_ID),
  agent(14, 'Test Case Generator', PROJECT_ID),
  agent(15, 'Sprint Planner', PROJECT_ID),
  agent(16, 'Accessibility Auditor', PROJECT_ID),
];
const PIPELINES = [
  agent(31, 'Nightly Regression Report', PROJECT_ID),
  agent(32, 'Release Checklist', PROJECT_ID),
];
const toolkit = (id, name, type) => ({
  id,
  name,
  toolkit_name: name,
  type,
  settings: {},
  project_id: PROJECT_ID,
});
const TOOLKITS = [
  toolkit(41, 'Jira — Product Team', 'jira'),
  toolkit(42, 'GitHub — EliteaUI', 'github'),
  toolkit(43, 'Confluence Docs', 'confluence'),
];
const PUBLIC_AGENTS = [
  agent(21, 'Code Reviewer', PUBLIC_PROJECT_ID),
  agent(22, 'Meeting Summarizer', PUBLIC_PROJECT_ID),
];

// The search box sends ?query=; the sample lists answer it like the backend does, by name.
const byQuery = (url, rows) => {
  const q = (new URL(url, 'http://x').searchParams.get('query') || '').toLowerCase();
  return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
};
const list = rows => ({ rows, total: rows.length });

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

const FOLDERS = {
  date_groups: [
    dateGroup('today', [
      conversation(101, 'Release notes for 2.4', 0),
      conversation(102, 'Sprint review summary', 0, false),
      conversation(103, 'Onboarding checklist draft', 0),
      conversation(104, 'Customer interview notes', 0),
      conversation(105, 'Pricing page questions', 0, false),
      conversation(106, 'Roadmap Q1', 0),
    ]),
    dateGroup('this_week', [
      conversation(107, 'Design review feedback', 1),
      conversation(108, 'API error triage', 1),
      conversation(109, 'Team retro actions', 1),
      conversation(110, 'Hiring plan', 1),
    ]),
  ],
  folders: [],
  pinned: { conversations: [] },
};

const routes = [
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
  ['/folder/prompt_lib/', FOLDERS],
  [
    '/public_applications/prompt_lib',
    url => list(url.includes('agents_type=pipeline') ? [] : byQuery(url, PUBLIC_AGENTS)),
  ],
  [
    '/applications/prompt_lib/',
    url => list(byQuery(url, url.includes('agents_type=pipeline') ? PIPELINES : PROJECT_AGENTS)),
  ],
  ['/tools/prompt_lib/', url => list(byQuery(url, TOOLKITS))],
  ['/platform_settings', { tool_spend: { web_search: { available: true } } }],
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

export default {
  title: 'features/chat/Plus Menu — Submenus on Click',
  parameters: { layout: 'fullscreen' },
  // In the app the layout is a child of <body>; here it sits in the story's flex frame and must be told to fill it.
  render: () => (
    <Box sx={{ width: '100%' }}>
      <Suspense>
        <AppLayout />
      </Suspense>
    </Box>
  ),
  decorators: [
    withStoryApi({
      routes,
      state: {
        settings: { project: { id: PROJECT_ID, name: 'Product Team' }, sideBarCollapsed: true },
        user: { ...USER, permissions: ALL_PERMISSIONS, publicPermissions: ALL_PERMISSIONS },
      },
      width: 1366,
      height: 768,
      // "+ → Chat" in the sidebar opens this address; the chat page then starts a new conversation.
      path: '/chat?create=1',
    }),
  ],
};

// EL-7458: the + menu's submenus open on a click and stay open while the pointer travels to a result. Open one with
// the real mouse: click [data-testid=plus-menu-button], then click [data-testid=agents-menuitem] (or modules:
// internal-tools-menuitem, pipelines-, skills-, toolkits-).
export const Dark = { globals: { theme: 'dark' } };

export const Light = { globals: { theme: 'light' } };

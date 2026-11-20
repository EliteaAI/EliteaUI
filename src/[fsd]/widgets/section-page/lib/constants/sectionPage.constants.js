import { ApplicationsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

export const SECTION_PAGE_KEYS = {
  agents: 'agents',
  skills: 'skills',
  pipelines: 'pipelines',
};

// The `:tab` of a section's list route in a private or team project
export const SECTION_MODES = {
  project: 'all',
  discover: 'discover',
};

// The `:tab` of the "Filter by" views in the Public project (today's public tabs)
export const PUBLIC_VIEWS = {
  latest: ApplicationsTabs[0],
  myLiked: ApplicationsTabs[1],
  trending: ApplicationsTabs[2],
  admin: ApplicationsTabs[3],
};

export const PUBLIC_VIEW_OPTIONS = [
  { value: PUBLIC_VIEWS.latest, label: 'Latest' },
  { value: PUBLIC_VIEWS.myLiked, label: 'My liked' },
  { value: PUBLIC_VIEWS.trending, label: 'Trending' },
  { value: PUBLIC_VIEWS.admin, label: 'Admin' },
];

export const BUILD_WITH_AI_KINDS = {
  agent: 'agent',
  skill: 'skill',
  pipeline: 'pipeline',
};

export const IMPORT_KINDS = {
  wizard: 'wizard',
  skill: 'skill',
};

export const SECTION_PAGE_CONFIG = {
  [SECTION_PAGE_KEYS.agents]: {
    title: 'Agents',
    entityLabel: 'Agent',
    searchPlaceholder: 'Search agents',
    hasDiscover: true,
    listRoute: RouteDefinitions.Applications,
    createRoute: RouteDefinitions.CreateApplication,
    importKind: IMPORT_KINDS.wizard,
    buildWithAi: BUILD_WITH_AI_KINDS.agent,
    testIdPrefix: 'agents',
    searchTestId: 'agent-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
  [SECTION_PAGE_KEYS.skills]: {
    title: 'Skills',
    entityLabel: 'Skill',
    searchPlaceholder: 'Search skills',
    hasDiscover: true,
    listRoute: RouteDefinitions.Skills,
    createRoute: RouteDefinitions.CreateSkill,
    importKind: IMPORT_KINDS.skill,
    buildWithAi: BUILD_WITH_AI_KINDS.skill,
    testIdPrefix: 'skills',
    searchTestId: 'skill-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
  [SECTION_PAGE_KEYS.pipelines]: {
    title: 'Pipelines',
    entityLabel: 'Pipeline',
    searchPlaceholder: 'Search pipelines',
    hasDiscover: false,
    listRoute: RouteDefinitions.Pipelines,
    createRoute: RouteDefinitions.CreatePipeline,
    importKind: IMPORT_KINDS.wizard,
    buildWithAi: BUILD_WITH_AI_KINDS.pipeline,
    testIdPrefix: 'pipelines',
    searchTestId: 'pipeline-search-input',
    tableViewTestId: 'pipeline-table-view',
    cardViewTestId: 'pipeline-card-view',
  },
};

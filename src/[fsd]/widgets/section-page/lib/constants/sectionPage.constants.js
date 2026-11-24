import { ApplicationsTabs, PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';

export const SECTION_PAGE_KEYS = {
  agents: 'agents',
  skills: 'skills',
  pipelines: 'pipelines',
  toolkits: 'toolkits',
  mcps: 'mcps',
  credentials: 'credentials',
  applications: 'applications',
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
    hasDiscoverFilters: true,
    listRoute: RouteDefinitions.Applications,
    createRoute: RouteDefinitions.CreateApplication,
    createPermission: PERMISSIONS.applications.create,
    addLabel: 'Add agent',
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
    hasDiscoverFilters: true,
    listRoute: RouteDefinitions.Skills,
    createRoute: RouteDefinitions.CreateSkill,
    createPermission: PERMISSIONS.applications.create,
    addLabel: 'Add skill',
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
    createPermission: PERMISSIONS.applications.create,
    addLabel: 'Add pipeline',
    importKind: IMPORT_KINDS.wizard,
    buildWithAi: BUILD_WITH_AI_KINDS.pipeline,
    testIdPrefix: 'pipelines',
    searchTestId: 'pipeline-search-input',
    tableViewTestId: 'pipeline-table-view',
    cardViewTestId: 'pipeline-card-view',
  },
  [SECTION_PAGE_KEYS.toolkits]: {
    title: 'Toolkits & Indexes',
    entityLabel: 'Toolkit',
    searchPlaceholder: 'Search toolkits & indexes',
    hasDiscover: false,
    listRoute: RouteDefinitions.Toolkits,
    createRoute: RouteDefinitions.CreateToolkit,
    createPermission: PERMISSIONS.toolkits.create,
    addLabel: 'Add toolkit',
    importKind: null,
    buildWithAi: null,
    testIdPrefix: 'toolkits',
    searchTestId: 'agent-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
  [SECTION_PAGE_KEYS.mcps]: {
    title: 'MCPs',
    entityLabel: 'MCP',
    searchPlaceholder: 'Search MCPs',
    hasDiscover: false,
    listRoute: RouteDefinitions.MCPs,
    createRoute: RouteDefinitions.CreateMCP,
    createPermission: PERMISSIONS.toolkits.create,
    addLabel: 'Add MCP',
    importKind: null,
    buildWithAi: null,
    testIdPrefix: 'mcps',
    searchTestId: 'agent-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
  // No permission is checked to create a credential, as with the old create button
  [SECTION_PAGE_KEYS.credentials]: {
    title: 'Credentials',
    entityLabel: 'Credential',
    searchPlaceholder: 'Search credentials',
    hasDiscover: false,
    listRoute: RouteDefinitions.Credentials,
    createRoute: RouteDefinitions.CreateCredentialFromMain,
    createPermission: null,
    addLabel: 'Add credential',
    importKind: null,
    buildWithAi: null,
    testIdPrefix: 'credentials',
    searchTestId: 'agent-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
  // The App Catalog has no filter column, and stays reachable in Public as before
  [SECTION_PAGE_KEYS.applications]: {
    title: 'Applications',
    entityLabel: 'Application',
    searchPlaceholder: 'Search applications',
    hasDiscover: true,
    hasDiscoverFilters: false,
    isDiscoverInPublic: true,
    legacyTabs: {
      applications: SECTION_MODES.project,
      catalog: SECTION_MODES.discover,
    },
    listRoute: RouteDefinitions.Apps,
    createRoute: RouteDefinitions.CreateApp,
    createPermission: PERMISSIONS.toolkits.create,
    addLabel: 'Add application',
    importKind: null,
    buildWithAi: null,
    testIdPrefix: 'applications',
    searchTestId: 'agent-search-input',
    tableViewTestId: 'agent-table-view-button',
    cardViewTestId: 'agent-card-view-button',
  },
};

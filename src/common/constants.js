import RouteDefinitions from '@/routes';
import { getEnvVar } from '@/utils/env';

export const VITE_GAID = getEnvVar('VITE_GAID');
export const VITE_SERVER_URL = getEnvVar('VITE_SERVER_URL');
export const VITE_BASE_URI = getEnvVar('VITE_BASE_URI');
export const VITE_DEV_TOKEN = getEnvVar('VITE_DEV_TOKEN');
export const VITE_DEV_SERVER = getEnvVar('VITE_DEV_SERVER');
export const VITE_SOCKET_SERVER = getEnvVar('VITE_SOCKET_SERVER');
export const VITE_SOCKET_PATH = getEnvVar('VITE_SOCKET_PATH');
export const VITE_USE_DATASOURCE_MODERATION = getEnvVar('VITE_USE_DATASOURCE_MODERATION');
export const VITE_USE_AGENT_MODERATION = getEnvVar('VITE_USE_AGENT_MODERATION');
export const BASE_URL = getEnvVar('BASE_URL');
export const DEV = getEnvVar('DEV');
export const MODE = getEnvVar('MODE');
export const PROD = getEnvVar('PROD');
export const VITE_PUBLIC_PROJECT_ID = getEnvVar('VITE_PUBLIC_PROJECT_ID');
export const ALLOW_PROJECT_OWN_LLMS = getEnvVar('allow_project_own_llms', true);

export const MISSING_ENVS = [
  { key: 'VITE_SERVER_URL', value: VITE_SERVER_URL },
  { key: 'VITE_BASE_URI', value: VITE_BASE_URI },
  { key: 'VITE_PUBLIC_PROJECT_ID', value: VITE_PUBLIC_PROJECT_ID },
]
  .filter(item => item.value === null || item.value === undefined)
  .map(item => item.key);

export const MIN_LARGE_WINDOW_WIDTH = 1200;

export const INITIAL_CARD_DISPLAY_COUNT = {
  LARGE_SCREEN: 8,
  DEFAULT: 6,
};

export const POSITION_GAP = 1000000;
export const MIN_SEARCH_KEYWORD_LENGTH = 3;
export const PAGE_SIZE = 20;
export const PAGE_SIZE_TOOLKITS_DROPDOWN_LIST = 50;
export const SUGGESTION_PAGE_SIZE = 5;
export const SIDE_BAR_WIDTH = 216;
export const EXPANDED_SIDE_BAR_WIDTH_IN_PX = `${SIDE_BAR_WIDTH}px`;
export const COLLAPSED_SIDE_BAR_WIDTH = 64;
export const COLLAPSED_SIDE_BAR_WIDTH_IN_PX = `${COLLAPSED_SIDE_BAR_WIDTH}px`;
export const NAV_BAR_HEIGHT = 60;
export const NAV_BAR_HEIGHT_IN_PX = `${NAV_BAR_HEIGHT}px`;
export const NAV_BAR_HEIGHT_TABLET = '16px';
export const RIGHT_PANEL_WIDTH = 328;
export const RIGHT_PANEL_WIDTH_IN_PX = `${RIGHT_PANEL_WIDTH}px`;
export const PAGE_WITH_TABS_HEADER_HEIGHT = 88;
export const PUBLIC_PROJECT_ID = +VITE_PUBLIC_PROJECT_ID; // todo: rename it everywhere
export const DEFAULT_FETCH_K = 30;
export const DEFAULT_CUT_OFF_SCORE = 0.8;
export const DEFAULT_PAGE_TOP_K = 1;
export const TAG_NAME_MAX_LENGTH = 48;
export const MAX_NAME_LENGTH = 32;
export const MAX_DESCRIPTION_LENGTH = 2304;
export const MAX_VARIABLES_LENGTH = 768;
export const MAX_STEP_LIMIT = 999;
export const MIN_STEP_LIMIT = 0;
export const MAX_VERSION_LENGTH = 20;
export const MAX_CONVERSATION_LENGTH = 50;
export const MAX_CONVERSATION_STARTERS = 4;
export const MAX_CONVERSATION_STARTER_LENGTH = 768;
export const MAX_WELCOME_MESSAGE_LENGTH = 768;
export const SAVE = 'Save';
export const PUBLISH = 'Publish';
export const CREATE_VERSION = 'Create version';
export const CREATE_PUBLIC_VERSION = 'Publish version';

export const PUBLIC_PROJECT_NAME = 'Public';
export const PRIVATE_PROJECT_NAME = 'Private';

export const ALL_PROJECTS_OPTION_VALUE = 'all';
export const ALL_PROJECTS_OPTION_LABEL = 'All projects';

export const DEFAULT_PARTICIPANT_NAME = 'Elitea';

export const NormalNameRegExp = /^[a-zA-Z0-9_][a-zA-Z0-9_\s]*/g;
export const NormalTagNameInputRegExp = /^[\w,\s]+$/g;
export const NormalSingleTagNameInputRegExp = /^[ \t]*[\w]*[ \t]*$/g;
export const ConversationNameRegExp = /^[a-zA-Z0-9_[\].()][a-zA-Z0-9_[\].() -]{2,63}$/;
export const ConversationNameWarningMessage =
  'The conversation name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.';
export const FolderNameWarningMessage =
  'The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.';
export const DefaultConversationName = 'New Conversation';
export const DefaultFolderName = 'New folder';

export const PipelineEditorMode = {
  Flow: 'flow',
  Yaml: 'yaml',
};

export const DiagramEditorMode = {
  Code: 'code',
  Diagram: 'Diagram',
};

export const CapabilityTypes = {
  completion: {
    label: 'Text',
    value: 'completion',
  },
  chat_completion: {
    label: 'Chat',
    value: 'chat_completion',
  },
  embeddings: {
    label: 'Embeddings',
    value: 'embeddings',
  },
};

export const APPLICATION_PAYLOAD_KEY = {
  file: 'file',
  name: 'name',
  description: 'description',
  tags: 'tags',
  type: 'type',
};

export const ROLES = {
  System: 'system',
  User: 'user',
  Assistant: 'assistant',
};

export const WELCOME_MESSAGE_ID = 'welcome_message_id';

export const RoleOptions = [
  {
    value: ROLES.Assistant,
    label: 'Assistant',
  },
  {
    value: ROLES.System,
    label: 'System',
  },
  {
    value: ROLES.User,
    label: 'User',
  },
];

export const SocketMessageType = {
  AgentStart: 'agent_start',
  AgentResponse: 'agent_response',
  AgentMessages: 'agent_messages',
  AgentException: 'agent_exception',
  AgentToolStart: 'agent_tool_start',
  AgentToolEnd: 'agent_tool_end',
  AgentToolError: 'agent_tool_error',
  AgentRequiresConfirmation: 'agent_requires_confirmation',
  AgentHitlInterrupt: 'agent_hitl_interrupt',
  McpAuthorizationRequired: 'mcp_authorization_required',
  AgentLlmStart: 'agent_llm_start',
  AgentLlmChunk: 'agent_llm_chunk',
  AgentLlmEnd: 'agent_llm_end',
  AgentOnFunctionToolNode: 'agent_on_function_tool_node',
  AgentOnToolNode: 'agent_on_tool_node',
  AgentOnTransitionalEdge: 'agent_on_transitional_edge',
  AgentOnConditionalEdge: 'agent_on_conditional_edge',
  AgentOnDecisionEdge: 'agent_on_decision_edge',
  References: 'references',
  Chunk: 'chunk',
  AIMessageChunk: 'AIMessageChunk',
  ChatUserMessage: 'chat_user_message',
  StartTask: 'start_task',
  Freeform: 'freeform',
  Error: 'error',
  LlmError: 'llm_error',
  PipelineFinish: 'pipeline_finish',
  AgentThinkingStep: 'agent_thinking_step',
  AgentThinkingStepUpdate: 'agent_thinking_step_update',
  ChatPredictSummaryStarted: 'chat_predict_summary_started',
  ChatPredictSummaryFinished: 'chat_predict_summary_finished',
  // Swarm mode events - for multi-agent collaboration visibility
  SwarmChildMessage: 'swarm_child_message',
  AgentSwarmAgentStart: 'agent_swarm_agent_start',
  AgentSwarmAgentResponse: 'agent_swarm_agent_response',
  AgentSwarmHandoff: 'agent_swarm_handoff',
};

export const SortOrderOptions = {
  ASC: 'asc',
  DESC: 'desc',
};

export const SortFields = {
  Id: 'id',
  Authors: 'author',
  CreatedAt: 'created_at',
  Likes: 'likes',
  Name: 'name',
  Rate: 'rate',
  Online: 'online',
};

export const MyLibraryDateSortOrderOptions = [
  {
    value: SortOrderOptions.DESC,
    label: 'Newest',
  },
  {
    value: SortOrderOptions.ASC,
    label: 'Oldest',
  },
];

export const MyLibraryRateSortOrderOptions = [
  {
    value: SortOrderOptions.DESC,
    label: 'Popular',
  },
  {
    value: SortOrderOptions.ASC,
    label: 'Unpopular',
  },
];

export const MyLibrarySortByOptions = [
  {
    value: SortFields.CreatedAt,
    label: 'By Date',
  },
  {
    value: SortFields.Rate,
    label: 'By Rate',
  },
];

export const CollectionStatus = {
  All: 'all',
  Draft: 'draft',
  Published: 'published',
  OnModeration: 'on_moderation',
  UserApproval: 'user_approval',
  Rejected: 'rejected',
};

export const MyLibraryStatusOptions = [
  {
    value: CollectionStatus.All,
    label: 'All statuses',
  },
  {
    value: CollectionStatus.Draft,
    label: 'Draft',
  },
  {
    value: CollectionStatus.Published,
    label: 'Published',
  },
  {
    value: CollectionStatus.OnModeration,
    label: 'On Moderation',
  },
  {
    value: CollectionStatus.UserApproval,
    label: 'User Approval',
  },
  {
    value: CollectionStatus.Rejected,
    label: 'Rejected',
  },
];

export const SearchParams = {
  ViewMode: 'viewMode',
  Name: 'name',
  Statuses: 'statuses',
  SortOrder: 'sort_order',
  SortBy: 'sort_by',
  AuthorId: 'author_id',
  AuthorName: 'author_name',
  PageSize: 'page_size',
  View: 'view',
  IntegrationName: 'integration_name',
  DeploymentConfigName: 'config_name',
  CreateConversation: 'create',
  Conversation: 'conversation',
  DestTab: 'destTab',
  ToolkitType: 'toolkit_type',
  SaveToolkit: 'save_toolkit',
  SourceApplicationId: 'source_application_id',
  ReturnUrl: 'return_url',
  Types: 'types',
  EditedParticipantId: 'edited_participant_id',
  IsMCP: 'mcp',
  IndexName: 'index_name',
  HistoryRunId: 'history_run_id',
  SharedChat: 'shared_chat',
  Bucket: 'bucket',
  SharedBucket: 'shared_bucket',
};

export const ViewOptions = {
  Table: 'table',
  Cards: 'cards',
};

export const ToolkitViewOptions = {
  Json: 'json',
  Form: 'form',
};

export const ThemeModeOptions = {
  Dark: 'dark',
  Light: 'light',
};

export const ComponentMode = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  VIEW: 'VIEW',
};

export const ViewMode = {
  Owner: 'owner',
  Public: 'public',
  Moderator: 'moderator',
};

export const TOAST_DURATION = 3000;

export const MIN_CARD_WIDTH = '300px';
const ONE_CARD_WIDTH = 'calc(100% - 16px)';
const TWO_CARD_WIDTH = 'calc(50% - 16px)';
const THREE_CARD_WIDTH = 'calc(33.3% - 16px)';
const FOUR_CARD_WIDTH = 'calc(25% - 16px)';
const FIVE_CARD_WIDTH = 'calc(20% - 16px)';
const SIX_CARD_WIDTH = 'calc(16.66% - 16px)';
const SEVEN_CARD_WIDTH = 'calc(14.26% - 16px)';
const EIGHT_CARD_WIDTH = 'calc(12.5% - 16px)';

export const CARD_FLEX_GRID = {
  ONE_CARD: {
    XXL: MIN_CARD_WIDTH,
    XL: MIN_CARD_WIDTH,
    LG: MIN_CARD_WIDTH,
    MD: MIN_CARD_WIDTH,
    SM: MIN_CARD_WIDTH,
    XS: MIN_CARD_WIDTH,
  },
  TWO_CARDS: {
    XXL: THREE_CARD_WIDTH,
    XL: THREE_CARD_WIDTH,
    LG: TWO_CARD_WIDTH,
    MD: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
  THREE_CARDS: {
    XXL: THREE_CARD_WIDTH,
    XL: THREE_CARD_WIDTH,
    LG: TWO_CARD_WIDTH,
    MD: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
  MORE_THAN_THREE_CARDS: {
    XXXXXL: EIGHT_CARD_WIDTH,
    XXXXL: SEVEN_CARD_WIDTH,
    XXXL: SIX_CARD_WIDTH,
    XXL: FIVE_CARD_WIDTH,
    XL: FOUR_CARD_WIDTH,
    LG: THREE_CARD_WIDTH,
    MD: THREE_CARD_WIDTH,
    FW_SM: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
};

export const FULL_WIDTH_CARD_FLEX_GRID = {
  ONE_CARD: {
    XXL: MIN_CARD_WIDTH,
    XL: MIN_CARD_WIDTH,
    LG: MIN_CARD_WIDTH,
    MD: MIN_CARD_WIDTH,
    FW_SM: MIN_CARD_WIDTH,
    SM: MIN_CARD_WIDTH,
    XS: MIN_CARD_WIDTH,
  },
  TWO_CARDS: {
    XXL: TWO_CARD_WIDTH,
    XL: TWO_CARD_WIDTH,
    LG: TWO_CARD_WIDTH,
    MD: TWO_CARD_WIDTH,
    FW_SM: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
  THREE_CARDS: {
    XXL: THREE_CARD_WIDTH,
    XL: THREE_CARD_WIDTH,
    LG: THREE_CARD_WIDTH,
    MD: TWO_CARD_WIDTH,
    FW_SM: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
  MORE_THAN_THREE_CARDS: {
    XXXXXL: EIGHT_CARD_WIDTH,
    XXXXL: SEVEN_CARD_WIDTH,
    XXXL: SIX_CARD_WIDTH,
    XXL: FIVE_CARD_WIDTH,
    XL: FOUR_CARD_WIDTH,
    LG: THREE_CARD_WIDTH,
    MD: THREE_CARD_WIDTH,
    FW_SM: TWO_CARD_WIDTH,
    SM: TWO_CARD_WIDTH,
    XS: ONE_CARD_WIDTH,
  },
};

export const GROUP_SELECT_VALUE_SEPARATOR = '::::';

export const URL_PARAMS_KEY_TAGS = 'tags[]';

export const ContentType = {
  MyLibraryAll: 'MyLibraryAll',
  MyLibraryDatasources: 'MyLibraryDatasources',
  MyLibraryApplications: 'MyLibraryApplications',
  UserPublicAll: 'UserPublicAll',
  UserPublicApplications: 'UserPublicApplications',
  UserPublicPipelines: 'UserPublicPipelines',
  UserPublicToolkits: 'UserPublicToolkits',
  UserPublicMCPs: 'UserPublicMCPs',
  DatasourcesLatest: 'DatasourcesLatest',
  DatasourcesMyLiked: 'DatasourcesMyLiked',
  DatasourcesTrending: 'DatasourcesTrending',
  DatasourcesAdmin: 'DatasourcesAdmin',
  DatasourcesAll: 'DatasourcesAll',
  DatasourcesDraft: 'DatasourcesDraft',
  DatasourcesPublished: 'DatasourcesPublished',
  DatasourcesModeration: 'DatasourcesModeration',
  DatasourcesApproval: 'DatasourcesApproval',
  DatasourcesRejected: 'DatasourcesRejected',
  ApplicationTop: 'ApplicationTop',
  ApplicationLatest: 'ApplicationLatest',
  ApplicationMyLiked: 'ApplicationMyLiked',
  ApplicationTrending: 'ApplicationTrending',
  ApplicationAdmin: 'ApplicationAdmin',
  ApplicationAll: 'ApplicationAll',
  ApplicationDraft: 'ApplicationDraft',
  ApplicationPublished: 'ApplicationPublished',
  ApplicationModeration: 'ApplicationModeration',
  ApplicationApproval: 'ApplicationApproval',
  ApplicationRejected: 'ApplicationRejected',
  PipelineTop: 'PipelineTop',
  PipelineLatest: 'PipelineLatest',
  PipelineMyLiked: 'PipelineMyLiked',
  PipelineTrending: 'PipelineTrending',
  PipelineAdmin: 'PipelineAdmin',
  PipelineAll: 'PipelineAll',
  PipelineDraft: 'PipelineDraft',
  PipelinePublished: 'PipelinePublished',
  PipelineModeration: 'PipelineModeration',
  PipelineApproval: 'PipelineApproval',
  PipelineRejected: 'PipelineRejected',
  ToolkitAdmin: 'ToolkitAdmin',
  ToolkitAll: 'ToolkitAll',
  AppAll: 'AppAll',
  MCPAdmin: 'MCPAdmin',
  MCPAll: 'MCPAll',
  CredentialAll: 'CredentialAll',
  ModerationSpaceApplication: 'ModerationSpaceApplication',
  ModerationSpacePipeline: 'ModerationSpacePipeline',
};

export const PERSONAL_SPACE_PERIOD_FOR_NEW_USER = 5 * 60 * 1000;
export const ALL_TIME_DATE = '2000-01-01T00:00:00';

export const DEFAULT_TOKEN_EXPIRATION_DAYS = 30;
export const EXPIRATION_MEASURES = ['never', 'days', 'weeks', 'hours', 'minutes'];

export const DEFAULT_RETENTION_VALUE = 1;
export const RETENTION_MEASURES = ['days', 'weeks', 'months', 'years'];

export const publicTabs = ['latest', 'my-liked', 'trending'];
export const ModerationTabs = ['all', 'agents'];
export const ApplicationsTabs = ['latest', 'my-liked', 'trending', 'admin'];
export const ToolkitsTabs = ['all', 'my-liked', 'trending', 'admin'];

export const CredentialsTabs = ['all'];

export const PrivateApplicationTabs = ['all', 'drafts', 'published', 'moderation', 'approval', 'rejected'];

export const UserSettingsTabs = ['information', 'tokens', 'secrets', 'projects'];

export const UserProfileTabs = ['profile', 'credentials', 'secrets'];
export const UserPublicTabs = ['all', 'agents', 'pipelines', 'toolkits', 'MCPs'];

export const RIGHT_PANEL_HEIGHT_OFFSET = '16px';
export const RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE = 328;

export const PAGE_PADDING = 12;
export const MARGIN_COMPENSATION = '16px';

export const DETAILS_PAGE_COLLAPSE_THRESHOLD = 1420;
export const DETAILS_PAGE_COLLAPSE_THRESHOLD_WITH_SIDEBAR_OPEN = 1580;

export const CARD_LIST_WIDTH = `calc(100% - ${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px)`;
export const CARD_LIST_WIDTH_FULL = `calc(100% + ${MARGIN_COMPENSATION})`;
export const calSideBarWidth = sideBarCollapsed =>
  sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH;

export const VariableSources = {
  Context: 'context',
  Message: 'message',
};

export const TIME_FORMAT = {
  DDMMYYYY: 'dd-mm-yyyy',
  MMMDD: 'MMM, dd',
};

export const PERMISSIONS = {
  chat: {
    list: 'models.chat.conversations.list',
    create: 'models.chat.conversations.create',
    canvas: {
      create: 'models.chat.canvas.create',
      update: 'models.chat.canvas.update',
    },
    folders: {
      get: 'models.chat.folders.get',
      create: 'models.chat.folders.create',
      update: 'models.chat.folders.update',
      delete: 'models.chat.folders.delete',
    },
  },
  datasources: {
    list: 'models.datasources.public_datasources.list',
    create: 'models.datasources.datasources.create',
    delete: 'models.datasources.datasource.delete',
    export: 'models.datasources.export_import.export',
    fork: 'models.datasources.fork.post',
    update: 'models.datasources.datasources.update',
    // webhook: 'models.datasources.webhook.post' // According to Mikhail's comment, this permission is not used
  },
  applications: {
    list: 'models.applications.public_applications.list',
    create: 'models.applications.applications.create',
    publish: 'models.applications.publish.post',
    export: 'models.applications.export_import.export',
    fork: 'models.applications.fork.post',
    // webhook: 'models.applications.webhook.post', // According to Mikhail's comment, this permission is not used
    delete: 'models.applications.application.delete',
    update: 'models.applications.application.update',
  },
  pipelines: {
    list: 'models.applications.public_applications.list',
    create: 'models.applications.applications.create',
    publish: 'models.applications.publish.post',
    export: 'models.applications.export_import.export',
    fork: 'models.applications.fork.post',
    // webhook: 'models.applications.webhook.post', // According to Mikhail's comment, this permission is not used
    delete: 'models.applications.application.delete',
  },
  moderation: {
    approve: 'models.prompt_lib.approve.post',
    reject: 'models.prompt_lib.reject.post',
  },
  users: {
    view: 'configuration.users.users.view',
    edit: 'configuration.users.users.edit',
    create: 'configuration.users.users.create',
    delete: 'configuration.users.users.delete',
  },
  secrets: {
    view: 'configuration.secrets.secret.view',
    list: 'configuration.secrets.secret.list', //show/hide secrets tab
    edit: 'configuration.secrets.secret.edit', //show/hide edit button
    create: 'configuration.secrets.secret.create', //show/hide '+' button
    delete: 'configuration.secrets.secret.delete', //show/hide edit button
    hide: 'configuration.secrets.secret.hide', //show/hide 'hide' button (with lock icon)
    unsecret: 'configuration.secrets.secret.unsecret', //show/hide unsecret button
  },
  artifacts: {
    delete: 'configuration.artifacts.artifacts.delete',
    view: 'configuration.artifacts.artifacts.view',
    buckets: {
      delete: 'configuration.artifacts.buckets.delete',
      update: 'configuration.artifacts.buckets.update',
      create: 'configuration.artifacts.buckets.create',
      view: 'configuration.artifacts.buckets.view',
    },
  },
  toolkits: {
    list: 'models.applications.tools.list',
    details: 'models.applications.tool.details',
    create: 'models.applications.tools.create',
    update: 'models.applications.tool.update',
    delete: 'models.applications.tool.delete',
    patch: 'models.applications.tool.patch',
    fork: 'models.applications.fork.post',
    export: 'models.applications.tools.export',
  },
  configuration: {
    delete: 'configurations.configuration.delete',
    update: 'configurations.configuration.update',
  },
  index: {
    schedule: 'models.applications.index_meta.edit',
  },
};

export const PERMISSION_GROUPS = {
  chat: [PERMISSIONS.chat.folders.get],
  datasources: [PERMISSIONS.datasources.list],
  agents: [PERMISSIONS.applications.list],
  pipelines: [PERMISSIONS.pipelines.list],
  credentials: [PERMISSIONS.toolkits.list],
  moderation: [PERMISSIONS.moderation.approve, PERMISSIONS.moderation.reject],
  artifacts: [PERMISSIONS.artifacts.view],
  toolkits: [PERMISSIONS.toolkits.list],
};

export const AutoSuggestionTypes = ['tag', 'application', 'datasource', 'pipeline', 'toolkit'];

export const AutoSuggestionTitles = {
  TOP: 'Top Search Requests',
  TAGS: 'Tags',
  AGENTS: 'Agents',
  PIPELINES: 'Pipelines',
  TOOLKITS: 'Toolkits',
  CREDENTIALS: 'Credentials',
  MCPs: 'MCPs',
};

export const SupportedAI = {
  AIDial: 'ai_dial',
  VertexAI: 'vertex_ai',
  OpenAI: 'open_ai',
  HuggingFace: 'hugging_face',
  OpenAIAzure: 'open_ai_azure',
};

export const SupportedStorage = {
  PGVector: 'pgvector',
};

export const SupportedConfig = {
  Confluence: 'integration_confluence',
  Jira: 'integration_jira',
  Github: 'integration_github',
  TestRail: 'integration_test_rail',
  Gitlab: 'integration_gitlab',
  QTest: 'integration_qtest',
  ServiceNow: 'integration_service_now',
};

export const ConfigurationTypes = {
  Personal: {
    label: 'Personal',
    value: 'personal',
  },
  Project: {
    label: 'Project',
    value: 'project',
  },
};

export const FULL_WIDTH_FLEX_GRID_PAGE = [
  `${RouteDefinitions.ModerationSpace}/${ModerationTabs[0]}`,
  `${RouteDefinitions.ModerationSpace}/${ModerationTabs[1]}`,
  `${RouteDefinitions.ModerationSpace}/${ModerationTabs[2]}`,
  `${RouteDefinitions.ModerationSpace}/${ModerationTabs[3]}`,
];

export const ProjectIdStorageKey = 'alita_ui.project.id';
export const ProjectNameStorageKey = 'alita_ui.project.name';
export const PublicPermissionStorageKey = 'alita_ui.public_permission';
export const PermissionStorageKey = 'alita_ui.project_permission';

export const AuthenticationTypes = {
  None: {
    label: 'None',
    value: 'none',
  },
  APIKey: {
    label: 'API Key',
    value: 'api_key',
  },
  OAuth: {
    label: 'OAuth',
    value: 'oauth',
  },
};

export const ConfluenceAuthenticationTypes = {
  Basic: {
    label: 'Basic',
    value: 'api_key',
  },
  Bearer: {
    label: 'Bearer',
    value: 'token',
  },
};

export const QTestLabAuthenticationTypes = {
  APIKey: {
    label: 'API Key',
    value: 'api_key',
  },
};
export const JiraAuthenticationTypes = {
  Basic: {
    label: 'Basic',
    value: 'api_key',
  },
  Bearer: {
    label: 'Bearer',
    value: 'token',
  },
};

export const GitHubAuthenticationTypes = {
  PrivateKey: {
    label: 'Private Key',
    value: 'private_key',
  },
  Token: {
    label: 'Token',
    value: 'token',
  },
  Password: {
    label: 'Password',
    value: 'password',
  },
  None: {
    label: 'Anonymous',
    value: 'none',
  },
};

export const ZephyrScaleAuthenticationTypes = {
  Token: {
    label: 'Token',
    value: 'token',
  },
  Password: {
    label: 'Password',
    value: 'password',
  },
  Cookies: {
    label: 'Cookies',
    value: 'cookies',
  },
};

export const GitLabAuthenticationTypes = {
  Token: {
    label: 'Token',
    value: 'token',
  },
};

export const BitbucketAuthenticationTypes = {
  Password: {
    label: 'Password',
    value: 'password',
  },
};

export const YagmailAuthenticationTypes = {
  Password: {
    label: 'Password',
    value: 'password',
  },
};

export const ReportPortalAuthenticationTypes = {
  APIKey: {
    label: 'API Key',
    value: 'api_key',
  },
};

export const TestIOAuthenticationTypes = {
  APIKey: {
    label: 'API Key',
    value: 'api_key',
  },
};

export const RallyAuthenticationTypes = {
  ApiKey: {
    label: 'API Key',
    value: 'api_key',
  },
  Password: {
    label: 'Password',
    value: 'password',
  },
};

export const OAuthTokenExchangeMethods = {
  Default: {
    label: 'Default (POST request)',
    value: 'default',
  },
  Basic: {
    label: 'Basic authorization header',
    value: 'Basic',
  },
};

export const AuthTypes = {
  Basic: {
    label: 'Basic',
    value: 'Basic',
  },
  Bear: {
    label: 'Bearer',
    value: 'Bearer',
  },
  Custom: {
    label: 'Custom',
    value: 'custom',
  },
};

export const APIKeyTypes = {
  Secret: {
    label: 'Secret',
    value: 'secret',
  },
  Password: {
    label: 'Password',
    value: 'password',
  },
};

export const SecretType = {
  Secret: {
    label: 'Secret',
    value: 'secret',
  },
  Password: {
    label: 'Password',
    value: 'password',
  },
};

export const ApplicationTypes = {
  ReAct: {
    label: 'ReAct',
    value: 'react',
    info: 'Just tell what you want it do be doing and add tools. Use Actor, Goals, Instructions and Constraints to describe desired behavior',
  },
  XMLChat: {
    label: 'XMLChat',
    value: 'xml',
    info: 'Same as react, but uses XML for tools instead of JSON. More suiatable for LLama and antropic models',
  },
  OpenAI: {
    label: 'OpenAI',
    value: 'openai',
    info: 'OpenAI Tools agents based on LangChain backend. Works only for integrations of Azure OpenAI Service',
  },
};

export const ChatHistoryTemplateTypes = {
  All: {
    label: 'All',
    value: 'all',
  },
  Interaction: {
    label: 'Interaction',
    value: 'interaction',
  },
  Number: {
    label: 'Last n messages',
    value: 'number',
  },
};

export const ApplicationTypeMap = {
  openai: 'OpenAI',
  react: 'ReAct',
  pipeline: 'Pipeline',
  xml: 'XMLChat',
};

export const sioEvents = {
  socket_validation_error: 'socket_validation_error',
  chat_predict: 'chat_predict',
  chat_continue_predict: 'chat_continue_predict',
  application_continue_message: 'application_continue_message',
  chat_enter_room: 'chat_enter_room',
  chat_leave_rooms: 'chat_leave_rooms',
  chat_participant_delete: 'chat_participant_delete',
  chat_message_delete: 'chat_message_delete',
  chat_message_delete_all: 'chat_message_delete_all',
  chat_message_sync: 'chat_message_sync',
  chat_participant_update: 'chat_participant_update',
  chat_conversation_name_updated: 'chat_conversation_name_updated',
  application_predict: 'application_predict',
  application_leave_rooms: 'application_leave_rooms',
  promptlib_predict: 'promptlib_predict',
  promptlib_leave_rooms: 'promptlib_leave_rooms',
  datasource_predict: 'datasource_predict',
  datasource_dataset_status: 'datasource_dataset_status',
  datasource_leave_rooms: 'datasource_leave_rooms',
  notifications_notify: 'notifications_notify',

  //Canvas
  chat_canvas_join: 'chat_canvas_join',
  chat_canvas_leave_rooms: 'chat_canvas_leave_rooms',
  chat_canvas_edit: 'chat_canvas_edit',

  chat_canvas_sync: 'chat_canvas_sync',
  chat_canvas_error: 'chat_canvas_error',
  chat_canvas_detail: 'chat_canvas_detail',
  chat_canvas_editor_joined: 'chat_canvas_editor_joined',
  chat_canvas_editors_change: 'chat_canvas_editors_change',
  chat_canvas_content_change: 'chat_canvas_content_change',
  chat_predict_attachment: 'chat_predict_attachment',

  //MCP status
  mcp_status: 'mcp_status',

  // MCP connection test (uses protocol-level list_tools)
  test_mcp_connection: 'test_mcp_connection',
};

export const ToolActionStatus = {
  complete: 'complete',
  error: 'error',
  actionRequired: 'action_required',
  cancelled: 'cancelled',
  processing: 'processing',
};

export const ChatSearchEvents = {
  SelectParticipant: 'SelectParticipant',
};

export const ChatParticipantType = {
  Applications: 'application',
  Toolkits: 'toolkit',
  Datasources: 'datasource',
  Models: 'llm',
  Users: 'user',
  Pipelines: 'pipeline',
  Dummy: 'dummy',
};

export const ChatParticipantTypeLabel = {
  application: 'Agents',
  datasource: 'Datasources',
  llm: 'Models',
  user: 'Users',
  pipeline: 'Pipelines',
};

export const ChatMentionSymbols = {
  Datasources: '#',
  Applications: '@',
  Models: '>',
};

export const ChatMentionSymbolTypeMap = {
  '#': ChatParticipantType.Datasources,
  '@': ChatParticipantType.Applications,
  '>': ChatParticipantType.Models,
};

export const NewChatMentionSymbolTypeMap = {
  '#': [ChatParticipantType.Applications, ChatParticipantType.Datasources],
  '@': ChatParticipantType.Users,
};

export const PinnedConversationListKey = 'AlitaPinnedConversationListKey';
export const ActiveConversationParticipantKey = 'ActiveConversationParticipantKey';

export const ImportValidationStatus = {
  Success: 'success',
  Error: 'error',
  None: 'none',
};

export const ImportTreeSelectionStatus = {
  Selected: 'selected',
  NotSelected: 'notSelected',
  PartialSelected: 'partialSelected',
};

export const NotificationType = {
  ModeratorUnpublish: 'moderator_unpublish',
  AuthorApproval: 'author_approval',
  AuthorReject: 'author_reject',
  ModeratorApprovalOfVersion: 'moderator_approval_of_version',
  ModeratorRejectOfVersion: 'moderator_reject_of_version',
  TokenExpiring: 'token_expiring',
  TokenIsExpired: 'token_is_expired',
  SpendingLimitExpiring: 'spending_limit_expiring',
  SpendingLimitIsExpired: 'spending_limit_is_expired',
  Rates: 'rates',
  Comments: 'comments',
  RewardNewLevel: 'reward_new_level',
  ContributorRequestForPublishApprove: 'contributor_request_for_publish_approve',
  UserWasAddedToSomeProjectAsTeammate: 'user_was_added_to_some_project_as_teammate',
  ChatUserAdded: 'chat_user_added',
  PrivateProjectCreated: 'private_project_created',
  IndexDataChanged: 'index_data_changed',
};

export const dummyConversation = { name: '', chat_history: [], participants: [], is_private: true };
export const dummyFolder = { name: '', conversations: [] };

export const CANVAS_ADMIN_USER = 'admin@centry.user';
export const CANVAS_SYSTEM_USER = 'system@centry.user';

// todo: delete this
export const PROMPT_PAYLOAD_KEY = {
  name: 'name',
  type: 'type',
  description: 'description',
  tags: 'tags',
  context: 'prompt',
  messages: 'messages',
  variables: 'variables',
  modelName: 'model_name',
  temperature: 'temperature',
  maxTokens: 'max_tokens',
  reasoningEffort: 'reasoning_effort',
  stepsLimit: 'steps_limit',
  integrationUid: 'integration_uid',
  integrationName: 'integration_name',
  ownerId: 'owner_id',
  is_liked: 'is_liked',
  likes: 'likes',
  welcomeMessage: 'welcome_message',
  conversationStarters: 'conversation_starters',
  rejectDetails: 'reject_details',
  allowAttachment: 'allow_attachment',
  meta: 'meta',
  isForked: 'is_forked',
  webhookSecret: 'webhook_secret',
  icon: 'icon',
};

// File attachment constants
export const ATTACHMENT_LIMITS = {
  MAX_ATTACHMENTS: 10,
  MAX_TOTAL_SIZE: 150 * 1024 * 1024, // 150MB in bytes
  DEFAULT_MAX_FILE_SIZE: 150 * 1024 * 1024, // 150MB in bytes, only one file
  MAX_IMAGE_ATTACHMENTS: 10,
  MAX_IMAGE_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes, per image file (excluding SVG)
};

export const TOOL_ACTION_TYPES = {
  Summary: 'summary',
  Toolkit: 'toolkit',
  Tool: 'tool',
  Llm: 'llm',
  SwarmChild: 'swarm_child',
};

export const TOOL_ACTION_NAMES = {
  Summary: 'Summarizing the chat history',
  Toolkit: 'Toolkit thinking step',
  Tool: 'tool',
  Llm: 'Thinking step',
  SwarmChild: 'Sub-agent response',
};

// Persona options for user personalization (single source of truth)
export const PERSONA_OPTIONS = [
  { label: 'Generic', value: 'generic', description: 'Balanced, professional assistant' },
  { label: 'QA', value: 'qa', description: 'Precise, technical, testing-focused' },
  { label: 'Nerdy', value: 'nerdy', description: 'Technical deep-dives, detailed explanations' },
  { label: 'Quirky', value: 'quirky', description: 'Creative, playful, thinking outside the box' },
  { label: 'Cynical', value: 'cynical', description: 'Skeptical, challenges assumptions' },
  { label: 'None', value: 'none', description: 'No personality overlay applied' },
];

export const DEFAULT_PERSONA = 'generic';

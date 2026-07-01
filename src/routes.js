import { DEV, VITE_BASE_URI } from '@/common/constants';

const RouteDefinitions = {
  // ExampleShowcase: '/examples/showcase',

  Chat: '/chat',
  ChatConversation: '/chat/:conversationId',

  Applications: '/agents',
  ApplicationsWithTab: '/agents/:tab',
  CreateApplication: '/agents/create',
  ApplicationsDetail: '/agents/:tab/:agentId',

  Skills: '/skills',
  SkillsWithTab: '/skills/:tab',
  CreateSkill: '/skills/create',
  SkillsDetail: '/skills/:tab/:skillId',

  Pipelines: '/pipelines',
  PipelinesWithTab: '/pipelines/:tab',
  CreatePipeline: '/pipelines/create',
  PipelineDetail: '/pipelines/:tab/:agentId',

  Credentials: '/credentials',
  CredentialsWithTab: '/credentials/:tab',
  CreateCredentialFromMain: '/credentials/create-credential',
  CreateCredentialTypeFromMain: '/credentials/create-credential/:credentialType',
  EditCredentialFromMain: '/credentials/:tab/:credential_uid',

  Toolkits: '/toolkits',
  ToolkitsWithTab: '/toolkits/:tab',
  CreateToolkit: '/toolkits/create',
  CreateToolkitType: '/toolkits/create/:toolkitType',
  ToolkitDetail: '/toolkits/:tab/:toolkitId',

  Apps: '/apps',
  AppsApplications: '/apps/applications',
  AppsCatalog: '/apps/catalog',
  AppsWithTab: '/apps/:tab',
  CreateApp: '/apps/create',
  CreateAppType: '/apps/create/:appType',
  AppDetail: '/apps/:tab/:appId',

  MCPs: '/mcps',
  MCPsWithTab: '/mcps/:tab',
  CreateMCP: '/mcps/create',
  CreateMCPType: '/mcps/create/:mcpType',
  MCPDetail: '/mcps/:tab/:mcpId',

  UserPublic: '/user-public',
  UserPublicWithTab: '/user-public/:tab',
  UserPublicApplicationDetail: '/user-public/agents/:agentId',
  UserPublicPipelineDetail: '/user-public/pipelines/:agentId',
  UserPublicToolkitDetail: '/user-public/toolkits/:toolkitId',
  UserPublicMCPDetail: '/user-public/mcps/:mcpId',
  UserPublicAppDetail: '/user-public/apps/:appId',

  Settings: '/settings',
  SettingsWithTab: '/settings/:tab',
  CreateConfiguration: '/settings/create-configuration',
  CreateConfigurationWithType: '/settings/create-configuration/:credentialType',
  CreatePersonalToken: '/settings/create-personal-token',
  EditConfiguration: '/settings/edit-configuration/:uid',
  ModeSwitch: '/mode-switch',

  Artifacts: '/artifacts',
  CreateBucket: '/artifacts/create-bucket',
  EditBucket: '/artifacts/edit-bucket',

  McpAuthPage: '/mcp-auth-callback',
  AuthCallbackPage: '/auth-callback',

  Onboarding: '/onboarding',
  HelpCenter: '/help-center',
  AgentHub: '/agents-hub',
};

export const BLOCK_NAV_PATTERNS = [
  RouteDefinitions.CreateApplication,
  RouteDefinitions.ApplicationsDetail,
  `${RouteDefinitions.ApplicationsDetail}/:versionId`,
  RouteDefinitions.CreateSkill,
  RouteDefinitions.SkillsDetail,
  `${RouteDefinitions.SkillsDetail}/:versionId`,
  RouteDefinitions.UserPublicApplicationDetail,
  RouteDefinitions.CreatePersonalToken,
  RouteDefinitions.EditConfiguration,
  RouteDefinitions.PipelineDetail,
  `${RouteDefinitions.PipelineDetail}/:versionId`,
  RouteDefinitions.CreatePipeline,
  RouteDefinitions.CreateToolkitType,
  RouteDefinitions.ToolkitDetail,
  RouteDefinitions.CreateCredentialFromMain,
  RouteDefinitions.CreateCredentialTypeFromMain,
  RouteDefinitions.EditCredentialFromMain,
  RouteDefinitions.Chat,
  RouteDefinitions.ChatConversation,
];

/**
 * Check if a path should block navigation with unsaved changes.
 * Accepts either a route pattern (e.g. '/chat/:conversationId')
 * or an actual pathname (e.g. '/chat/abc-123').
 */
export const shouldBlockNavWithUnsavedChanges = path => {
  // Direct pattern match (used during route definition)
  if (BLOCK_NAV_PATTERNS.includes(path)) {
    return true;
  }
  return false;
};

export const PathSessionMap = {
  [RouteDefinitions.Chat]: 'Chats',
  // [RouteDefinitions.Profile]: 'Profile',
  [RouteDefinitions.Settings]: 'Settings',
  [RouteDefinitions.CreatePersonalToken]: 'New personal token',
  [RouteDefinitions.CreateCredentialFromMain]: 'New Credential',
  [RouteDefinitions.ModeSwitch]: 'ModeSwitch',
  [RouteDefinitions.Applications]: 'Agents',
  [RouteDefinitions.Skills]: 'Skills',
  [RouteDefinitions.Pipelines]: 'Pipelines',
  [RouteDefinitions.Toolkits]: 'Toolkits',
  [RouteDefinitions.Apps]: 'Apps',
  [RouteDefinitions.Credentials]: 'Credentials',
  [RouteDefinitions.HelpCenter]: 'Help Center',
};

export const getBasename = () => {
  return DEV ? '' : VITE_BASE_URI;
};

export default RouteDefinitions;

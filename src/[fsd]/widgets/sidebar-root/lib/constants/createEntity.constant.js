import { PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';

export const OptionsMap = {
  Chat: 'Conversation',
  Agent: 'Agent',
  Skill: 'Skill',
  Pipeline: 'Pipeline',
  Toolkit: 'Toolkit',
  App: 'App',
  Credential: 'Credential',
  Credentials: 'Credential', // Backward compatibility
  Bucket: 'Bucket',
  Model: 'Model', // For Information Settings page
  'Personal Token': 'Personal Token', // For Settings -> Tokens page
  Secret: 'Secret', // For Settings -> Secrets page
  MCP: 'MCP', // For MCPs
};

export const RouteToLabelMap = [
  { route: RouteDefinitions.AgentStudio, label: null },
  { route: RouteDefinitions.CreateConfiguration, label: 'Configuration' },
  { route: 'settings/model-configuration', label: 'Configuration' },
  { route: RouteDefinitions.CreatePersonalToken, label: 'Token' },
  { route: 'settings/tokens', label: 'Token' },
  { route: 'settings/secrets', label: 'Secret' },
  { route: 'settings/users', label: 'Invite User' },
  { route: RouteDefinitions.AppsApplications, label: 'Application' },
  { route: RouteDefinitions.AppsCatalog, label: 'Application' },
  { route: RouteDefinitions.Chat, label: 'Conversation' },
  { route: RouteDefinitions.Applications, label: 'Agent' },
  { route: RouteDefinitions.Skills, label: 'Skill' },
  { route: RouteDefinitions.Pipelines, label: 'Pipeline' },
  { route: RouteDefinitions.Credentials, label: 'Credential' },
  { route: RouteDefinitions.Toolkits, label: 'Toolkit' },
  { route: RouteDefinitions.MCPs, label: 'MCP' },
  { route: RouteDefinitions.Artifacts, label: 'Artifact Bucket' },
];

export const DropdownItems = [
  { label: 'Conversation', route: RouteDefinitions.Chat, option: 'Conversation' },
  { label: 'Agent', route: RouteDefinitions.Applications, option: 'Agent' },
  { label: 'Skill', route: RouteDefinitions.Skills, option: 'Skill' },
  { label: 'Pipeline', route: RouteDefinitions.Pipelines, option: 'Pipeline' },
  { label: 'Credential', route: RouteDefinitions.Credentials, option: 'Credential' },
  { label: 'Toolkit', route: RouteDefinitions.Toolkits, option: 'Toolkit' },
  { label: 'Application', route: RouteDefinitions.AppsApplications, option: 'Application' },
  { label: 'MCP', route: RouteDefinitions.MCPs, option: 'MCP' },
  { label: 'Artifact Bucket', route: RouteDefinitions.Artifacts, option: 'Bucket' },
  { label: 'Configuration', route: 'settings/model-configuration', option: 'Configuration' },
  { label: 'Token', route: 'settings/tokens', option: 'Personal Token' },
  { label: 'Secret', route: 'settings/secrets', option: 'Secret' },
  { label: 'Invite User', route: 'settings/users', option: 'User' },
];

export const SimpleCreateRoutes = [
  'settings/analytics',
  'settings/prompts',
  'settings/environment',
  RouteDefinitions.Onboarding,
  RouteDefinitions.UserSettings,
  RouteDefinitions.AgentStudio,
  RouteDefinitions.HelpCenter,
  RouteDefinitions.NotificationCenter,
];

export const CreationPermissions = {
  Chat: [PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create],
  Conversation: [PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create],
  Agent: [PERMISSIONS.applications.create],
  Skill: [PERMISSIONS.applications.create],
  Pipeline: [PERMISSIONS.applications.create],
  Toolkit: [PERMISSIONS.toolkits.create],
  App: [PERMISSIONS.toolkits.create],
  MCP: [PERMISSIONS.toolkits.create],
  Credential: undefined, // No specific permission needed for credentials
  Bucket: [PERMISSIONS.artifacts.buckets.create, PERMISSIONS.artifacts.create],
  Model: undefined, // No specific permission needed for model credentials
  'Personal Token': undefined, // Personal tokens creation allowed from settings
  Secret: [PERMISSIONS.secrets.list], // Allow if user can access secrets page
  User: [PERMISSIONS.users.create],
};

export const CommandPathMap = {
  Conversation: RouteDefinitions.Chat,
  Agent: RouteDefinitions.CreateApplication,
  Skill: RouteDefinitions.CreateSkill,
  Pipeline: RouteDefinitions.CreatePipeline,
  Toolkit: RouteDefinitions.CreateToolkit,
  App: RouteDefinitions.CreateApp,
  Credential: RouteDefinitions.CreateCredentialFromMain,
  Bucket: RouteDefinitions.CreateBucket,
  Configuration: RouteDefinitions.CreateConfiguration, // Route to filtered credential creation
  'Personal Token': RouteDefinitions.CreatePersonalToken,
  // For Secret we stay on settings/secrets but add a query param to trigger row creation
  Secret: undefined,
  MCP: RouteDefinitions.CreateMCP,
};

export const BreadCrumbMap = {
  Conversation: 'Chat',
  Agent: 'New Agent',
  Skill: 'New Skill',
  Pipeline: 'New Pipeline',
  Toolkit: 'New Toolkit',
  App: 'New App',
  Credential: 'New Credential',
  Bucket: 'New Bucket',
  Configuration: 'New Configuration',
  'Personal Token': 'New Personal Token',
  Secret: 'New Secret',
  [RouteDefinitions.CreateApplication]: 'Agents',
  [RouteDefinitions.CreateSkill]: 'Skills',
  [RouteDefinitions.CreatePipeline]: 'Pipelines',
  [RouteDefinitions.CreateToolkit]: 'Toolkits',
  [RouteDefinitions.CreateApp]: 'Apps',
  [RouteDefinitions.CreateCredentialFromMain]: 'Credentials',
  [RouteDefinitions.CreateBucket]: 'Artifacts',
  [RouteDefinitions.CreatePersonalToken]: 'Personal tokens',
};

export const PrevUrlPathMap = {
  [RouteDefinitions.CreateApplication]: RouteDefinitions.Applications,
  [RouteDefinitions.CreateSkill]: RouteDefinitions.Skills,
  [RouteDefinitions.CreatePipeline]: RouteDefinitions.Pipelines,
  [RouteDefinitions.CreateToolkit]: RouteDefinitions.Toolkits,
  [RouteDefinitions.CreateApp]: RouteDefinitions.Apps,
  [RouteDefinitions.CreateMCP]: RouteDefinitions.MCPs,
  [RouteDefinitions.CreateCredentialFromMain]: RouteDefinitions.Credentials,
  [RouteDefinitions.CreateBucket]: RouteDefinitions.Artifacts,
  // For personal tokens, previous path should be Settings -> tokens tab
  [RouteDefinitions.CreatePersonalToken]: RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens'),
  [RouteDefinitions.CreateConfiguration]: RouteDefinitions.SettingsWithTab.replace(
    ':tab',
    'model-configuration',
  ),
};

export const PathToOptionMap = [
  { path: RouteDefinitions.CreateConfiguration, option: 'Configuration' },
  { path: 'settings/model-configuration', option: 'Configuration' },
  { path: RouteDefinitions.CreatePersonalToken, option: 'Personal Token' },
  { path: 'settings/tokens', option: 'Personal Token' },
  { path: 'settings/secrets', option: 'Secret' },
  { path: 'settings/users', option: 'User' },
  { path: 'chat', option: OptionsMap.Chat },
  { path: 'agent', option: OptionsMap.Agent },
  { path: 'skill', option: OptionsMap.Skill },
  { path: 'pipeline', option: OptionsMap.Pipeline },
  { path: 'app', option: OptionsMap.App },
  { path: 'toolkit', option: OptionsMap.Toolkit },
  { path: 'mcp', option: OptionsMap.MCP },
  { path: 'credential', option: OptionsMap.Credential },
  { path: 'artifact', option: OptionsMap.Bucket },
];

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
  PersonalToken: 'Personal Token', // For Settings -> Tokens page
  Secret: 'Secret', // For Settings -> Secrets page
  MCP: 'MCP', // For MCPs
  AIProvider: 'AI Provider',
  User: 'User',
  Application: 'Application',
};

export const RouteToLabelMap = [
  { route: RouteDefinitions.EliteaCatalog, label: null },
  { route: RouteDefinitions.AgentHub, label: null },
  { route: RouteDefinitions.CreateConfiguration, label: 'AI Provider' },
  { route: 'settings/ai-providers', label: 'AI Provider' },
  { route: RouteDefinitions.CreatePersonalToken, label: 'Token' },
  { route: 'settings/tokens', label: 'Token' },
  { route: 'settings/secrets', label: 'Secret' },
  { route: 'settings/users', label: 'Invite User' },
  { route: RouteDefinitions.AppsApplications, label: 'Application' },
  { route: RouteDefinitions.AppsCatalog, label: 'Application' },
  { route: RouteDefinitions.Chat, label: 'Chat' },
  { route: RouteDefinitions.Applications, label: 'Agent' },
  { route: RouteDefinitions.Skills, label: 'Skill' },
  { route: RouteDefinitions.Pipelines, label: 'Pipeline' },
  { route: RouteDefinitions.Credentials, label: 'Credential' },
  { route: RouteDefinitions.Toolkits, label: 'Toolkit' },
  { route: RouteDefinitions.MCPs, label: 'MCP' },
  { route: RouteDefinitions.Artifacts, label: 'Artifact Bucket' },
];

export const DropdownItems = [
  { label: 'Chat', route: RouteDefinitions.Chat, option: OptionsMap.Chat },
  { label: 'Agent', route: RouteDefinitions.Applications, option: OptionsMap.Agent },
  { label: 'Skill', route: RouteDefinitions.Skills, option: OptionsMap.Skill },
  { label: 'Pipeline', route: RouteDefinitions.Pipelines, option: OptionsMap.Pipeline },
  { label: 'Credential', route: RouteDefinitions.Credentials, option: OptionsMap.Credential },
  { label: 'Toolkit', route: RouteDefinitions.Toolkits, option: OptionsMap.Toolkit },
  { label: 'Application', route: RouteDefinitions.AppsApplications, option: OptionsMap.Application },
  { label: 'MCP', route: RouteDefinitions.MCPs, option: OptionsMap.MCP },
  { label: 'Artifact Bucket', route: RouteDefinitions.Artifacts, option: OptionsMap.Bucket },
  { label: 'AI Provider', route: 'settings/ai-providers', option: OptionsMap.AIProvider },
  { label: 'Token', route: 'settings/tokens', option: OptionsMap.PersonalToken },
  { label: 'Secret', route: 'settings/secrets', option: OptionsMap.Secret },
  { label: 'Invite User', route: 'settings/users', option: OptionsMap.User },
];

export const SimpleCreateRoutes = [
  'settings/analytics',
  'settings/prompts',
  'settings/environment',
  'settings/preferences',
  'settings/notifications',
  RouteDefinitions.Onboarding,
  RouteDefinitions.EliteaCatalog,
  RouteDefinitions.AgentHub,
  RouteDefinitions.HelpCenter,
];

export const CreationPermissions = {
  [OptionsMap.Chat]: [PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create],
  [OptionsMap.Agent]: [PERMISSIONS.applications.create],
  [OptionsMap.Skill]: [PERMISSIONS.applications.create],
  [OptionsMap.Pipeline]: [PERMISSIONS.applications.create],
  [OptionsMap.Toolkit]: [PERMISSIONS.toolkits.create],
  [OptionsMap.App]: [PERMISSIONS.toolkits.create],
  [OptionsMap.Application]: [PERMISSIONS.toolkits.create],
  [OptionsMap.MCP]: [PERMISSIONS.toolkits.create],
  [OptionsMap.Credential]: undefined, // No specific permission needed for credentials
  [OptionsMap.Bucket]: [PERMISSIONS.artifacts.buckets.create, PERMISSIONS.artifacts.create],
  [OptionsMap.AIProvider]: [PERMISSIONS.configuration.update],
  [OptionsMap.Model]: undefined, // No specific permission needed for model credentials
  [OptionsMap.PersonalToken]: undefined, // Personal tokens creation allowed from settings
  [OptionsMap.Secret]: [PERMISSIONS.secrets.list], // Allow if user can access secrets page
  [OptionsMap.User]: [PERMISSIONS.users.create],
};

export const CommandPathMap = {
  [OptionsMap.Chat]: RouteDefinitions.Chat,
  [OptionsMap.Agent]: RouteDefinitions.CreateApplication,
  [OptionsMap.Skill]: RouteDefinitions.CreateSkill,
  [OptionsMap.Pipeline]: RouteDefinitions.CreatePipeline,
  [OptionsMap.Toolkit]: RouteDefinitions.CreateToolkit,
  [OptionsMap.App]: RouteDefinitions.CreateApp,
  [OptionsMap.Credential]: RouteDefinitions.CreateCredentialFromMain,
  [OptionsMap.Bucket]: RouteDefinitions.CreateBucket,
  [OptionsMap.AIProvider]: RouteDefinitions.CreateConfiguration, // Route to filtered credential creation
  [OptionsMap.PersonalToken]: RouteDefinitions.CreatePersonalToken,
  // For Secret we stay on settings/secrets but add a query param to trigger row creation
  [OptionsMap.Secret]: undefined,
  [OptionsMap.MCP]: RouteDefinitions.CreateMCP,
};

export const BreadCrumbMap = {
  [OptionsMap.Chat]: 'Chat',
  [OptionsMap.Agent]: 'New Agent',
  [OptionsMap.Skill]: 'New Skill',
  [OptionsMap.Pipeline]: 'New Pipeline',
  [OptionsMap.Toolkit]: 'New Toolkit',
  [OptionsMap.App]: 'New App',
  [OptionsMap.Credential]: 'New Credential',
  [OptionsMap.Bucket]: 'New Bucket',
  [OptionsMap.AIProvider]: 'New AI Provider',
  [OptionsMap.PersonalToken]: 'New Personal Token',
  [OptionsMap.Secret]: 'New Secret',
  [RouteDefinitions.CreateApplication]: 'Agents',
  [RouteDefinitions.CreateSkill]: 'Skills',
  [RouteDefinitions.CreatePipeline]: 'Pipelines',
  [RouteDefinitions.CreateToolkit]: 'Toolkits & Indexes',
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
  [RouteDefinitions.CreateConfiguration]: RouteDefinitions.SettingsWithTab.replace(':tab', 'ai-providers'),
};

export const PathToOptionMap = [
  { path: RouteDefinitions.CreateConfiguration, option: OptionsMap.AIProvider },
  { path: 'settings/ai-providers', option: OptionsMap.AIProvider },
  { path: RouteDefinitions.CreatePersonalToken, option: OptionsMap.PersonalToken },
  { path: 'settings/tokens', option: OptionsMap.PersonalToken },
  { path: 'settings/secrets', option: OptionsMap.Secret },
  { path: 'settings/users', option: OptionsMap.User },
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

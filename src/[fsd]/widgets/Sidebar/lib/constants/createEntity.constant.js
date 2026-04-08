import { PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';

export const OptionsMap = {
  Chat: 'Conversation',
  Agent: 'Agent',
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

export const CreationPermissions = {
  Chat: [PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create],
  Conversation: [PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create],
  Agent: [PERMISSIONS.applications.create],
  Pipeline: [PERMISSIONS.applications.create],
  Toolkit: [PERMISSIONS.toolkits.create],
  App: [PERMISSIONS.toolkits.create],
  MCP: [PERMISSIONS.toolkits.create],
  Credential: undefined, // No specific permission needed for credentials
  Bucket: [PERMISSIONS.artifacts.buckets.create],
  Model: undefined, // No specific permission needed for model credentials
  'Personal Token': undefined, // Personal tokens creation allowed from settings
  Secret: [PERMISSIONS.secrets.list], // Allow if user can access secrets page
};

export const CommandPathMap = {
  Conversation: RouteDefinitions.Chat,
  Agent: RouteDefinitions.CreateApplication,
  Pipeline: RouteDefinitions.CreatePipeline,
  Toolkit: RouteDefinitions.CreateToolkit,
  App: RouteDefinitions.CreateApp,
  Credential: RouteDefinitions.CreateCredentialFromMain,
  Bucket: RouteDefinitions.CreateBucket,
  Integration: RouteDefinitions.CreateIntegration, // Route to filtered credential creation
  'Personal Token': RouteDefinitions.CreatePersonalToken,
  // For Secret we stay on settings/secrets but add a query param to trigger row creation
  Secret: undefined,
  MCP: RouteDefinitions.CreateMCP,
};

export const BreadCrumbMap = {
  Conversation: 'Chat',
  Agent: 'New Agent',
  Pipeline: 'New Pipeline',
  Toolkit: 'New Toolkit',
  App: 'New App',
  Credential: 'New Credential',
  Bucket: 'New Bucket',
  Integration: 'New Integration',
  'Personal Token': 'New Personal Token',
  Secret: 'New Secret',
  [RouteDefinitions.CreateApplication]: 'Agents',
  [RouteDefinitions.CreatePipeline]: 'Pipelines',
  [RouteDefinitions.CreateToolkit]: 'Toolkits',
  [RouteDefinitions.CreateApp]: 'Apps',
  [RouteDefinitions.CreateCredentialFromMain]: 'Credentials',
  [RouteDefinitions.CreateBucket]: 'Artifacts',
  [RouteDefinitions.CreatePersonalToken]: 'Personal tokens',
};

export const PrevUrlPathMap = {
  [RouteDefinitions.CreateApplication]: RouteDefinitions.Applications,
  [RouteDefinitions.CreatePipeline]: RouteDefinitions.Pipelines,
  [RouteDefinitions.CreateToolkit]: RouteDefinitions.Toolkits,
  [RouteDefinitions.CreateApp]: RouteDefinitions.Apps,
  [RouteDefinitions.CreateMCP]: RouteDefinitions.MCPs,
  [RouteDefinitions.CreateCredentialFromMain]: RouteDefinitions.Credentials,
  [RouteDefinitions.CreateBucket]: RouteDefinitions.Artifacts,
  // For personal tokens, previous path should be Settings -> tokens tab
  [RouteDefinitions.CreatePersonalToken]: RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens'),
  [RouteDefinitions.CreateIntegration]: RouteDefinitions.SettingsWithTab.replace(
    ':tab',
    'model-configuration',
  ),
};

export const PathToOptionMap = [
  { path: 'settings/model-configuration', option: 'Integration' },
  { path: 'settings/tokens', option: 'Personal Token' },
  { path: 'settings/secrets', option: 'Secret' },
  { path: 'settings/users', option: 'User' },
  { path: 'chat', option: OptionsMap.Chat },
  { path: 'agent', option: OptionsMap.Agent },
  { path: 'pipeline', option: OptionsMap.Pipeline },
  { path: 'app', option: OptionsMap.App },
  { path: 'toolkit', option: OptionsMap.Toolkit },
  { path: 'mcp', option: OptionsMap.MCP },
  { path: 'credential', option: OptionsMap.Credential },
  { path: 'artifact', option: OptionsMap.Bucket },
];

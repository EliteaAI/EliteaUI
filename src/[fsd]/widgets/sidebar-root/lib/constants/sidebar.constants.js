import RouteDefinitions from '@/routes';

export const SIDEBAR_COLLAPSE_STATE_KEY = 'sidebarCollapseId';

// Explore list order; `permissionKey` is the PERMISSION_GROUPS entry gating the row (none = always shown)
export const ExploreSections = [
  { value: 'agents', label: 'Agents', url: RouteDefinitions.Applications, permissionKey: 'agents' },
  { value: 'pipelines', label: 'Pipelines', url: RouteDefinitions.Pipelines, permissionKey: 'pipelines' },
  { value: 'skills', label: 'Skills', url: RouteDefinitions.Skills },
  {
    value: 'toolkits',
    label: 'Toolkits & Indexes',
    url: RouteDefinitions.Toolkits,
    permissionKey: 'toolkits',
  },
  { value: 'mcps', label: 'MCPs', url: RouteDefinitions.MCPs, permissionKey: 'toolkits', breadCrumb: 'MCP' },
  { value: 'applications', label: 'Applications', url: RouteDefinitions.Apps },
  {
    value: 'credentials',
    label: 'Credentials',
    url: RouteDefinitions.Credentials,
    permissionKey: 'credentials',
  },
];

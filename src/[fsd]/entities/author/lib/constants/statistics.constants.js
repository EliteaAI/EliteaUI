export const STATISTICS_USER_INFO = {
  AGENTS: 'Agents',
  AGENTS_PUBLIC: 'Published',
  PIPELINES: 'Pipelines',
  TOOLKITS: 'Toolkits',
};

export const ROUTE_STATISTIC_MAP = {
  '/agents': {
    label: STATISTICS_USER_INFO.AGENTS,
    valueKey: 'total_applications',
    publishedKey: 'public_applications',
  },
  '/pipelines': {
    label: STATISTICS_USER_INFO.PIPELINES,
    valueKey: 'total_pipelines',
    publishedKey: null,
  },
  '/toolkits': {
    label: STATISTICS_USER_INFO.TOOLKITS,
    valueKey: 'total_toolkits',
    publishedKey: null,
  },
};

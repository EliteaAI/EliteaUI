export const STATISTICS_USER_INFO = {
  AGENTS: 'Agents',
  AGENTS_PUBLIC: 'Published',
  PIPELINES: 'Pipelines',
  TOOLKITS: 'Toolkits',
  SKILLS: 'Skills',
};

export const ROUTE_STATISTIC_MAP = {
  '/agents': {
    label: STATISTICS_USER_INFO.AGENTS,
    valueKey: 'total_applications',
    publishedKey: 'public_applications',
  },
  '/skills': {
    label: STATISTICS_USER_INFO.SKILLS,
    valueKey: 'total_skills',
    publishedKey: 'public_skills',
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

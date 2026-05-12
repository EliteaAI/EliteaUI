export const APPLICATION_REQUEST_SUPPORT_EMAIL = 'SupportAlita@epam.com';

export const APPLICATION_CATALOG = [
  {
    type: 'deepwiki_Deepwiki',
    name: 'DeepWiki',
    shortDescription:
      'Generate searchable wiki pages from repository code and keep architecture context close to delivery work.',
    description:
      'DeepWiki turns a code repository into navigable documentation with architecture summaries, source-linked explanations, and project Q&A support.',
    capabilities: ['Repository wiki generation', 'Architecture summaries', 'Code-aware Q&A'],
    bestFor:
      'Teams that need onboarding material, implementation context, or durable knowledge for active repositories.',
  },
  {
    type: 'inventory',
    name: 'Inventory',
    shortDescription:
      'Explore services, ownership, dependencies, and technical inventory across project repositories.',
    description:
      'Inventory helps teams inspect the code estate, map important components, and understand relationships before planning changes.',
    capabilities: ['Component inventory', 'Dependency discovery', 'Ownership context'],
    bestFor:
      'Teams coordinating modernization, impact analysis, service discovery, or engineering governance.',
  },
];

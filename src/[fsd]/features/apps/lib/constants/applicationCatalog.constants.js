import InventorySearchIcon from '@/assets/inventory_search.svg?react';
import QuestionnaireIcon from '@/assets/questionnaire.svg?react';
import WikiQueryIcon from '@/assets/wiki_query.svg?react';

export const APPLICATION_REQUEST_SUPPORT_EMAIL = 'SupportAlita@epam.com';

export const REQUEST_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const APPLICATION_CATALOG = [
  {
    type: 'wikis_Wikis',
    name: 'Wikis',
    IconComponent: WikiQueryIcon,
    shortDescription: 'Generate searchable wiki pages from repository code.',
    description:
      'DeepWiki turns a code repository into navigable documentation with architecture summaries, source-linked explanations, and project Q&A support.',
    capabilities: ['Wiki generation', 'Architecture summaries', 'Code-aware Q&A'],
    bestFor: 'Onboarding, implementation context, and team knowledge',
    documentation: 'https://docs.elitea.ai/integrations/apps/wikis',
  },
  {
    type: 'inventory',
    name: 'Inventory',
    IconComponent: InventorySearchIcon,
    shortDescription: 'Explore services, ownership, dependencies, and repository landscape.',
    description:
      'Inventory helps teams inspect the code estate, map important components, and understand relationships before planning changes.',
    capabilities: ['Component inventory', 'Dependency discovery', 'Ownership context'],
    bestFor: 'Modernization, impact analysis, and engineering governance',
    documentation: 'https://docs.elitea.ai/integrations/apps/inventory',
  },
  {
    type: 'questionnaire',
    name: 'Questionnaire',
    IconComponent: QuestionnaireIcon,
    shortDescription: 'Answer questionnaires from your project sources, with references.',
    description:
      'Questionnaire turns SharePoint, Confluence, Jira and uploaded documents into referenced answers for compliance and security questionnaires. Upload an Excel, Word, PDF or screenshot, review the extracted questions and download the answered Excel. "Not found" is an honest, first-class result.',
    capabilities: ['Question extraction', 'Referenced answers', 'Excel export'],
    bestFor: 'Compliance, security and due-diligence questionnaires',
    documentation: 'https://docs.elitea.ai/integrations/apps/questionnaire',
  },
];

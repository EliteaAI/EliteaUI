import RouteDefinitions from '@/routes';

// Scope codes the backend sets on a budget rejection. Kept in shared because the same
// mapping is needed wherever an execution error is rendered, and those renderers live
// in separate features (chat, skill, pipelines).
export const BUDGET_ERROR_CODES = {
  PROJECT: 'project_budget_exceeded',
  MEMBER: 'member_budget_exceeded',
};

// Wording stays period-neutral so it holds whatever the budget period is
export const BUDGET_ERROR_VARIANTS = {
  [BUDGET_ERROR_CODES.PROJECT]: {
    message:
      "This project's budget has been reached. AI requests are unavailable until the budget resets or a project admin increases the limit.",
    linkLabel: 'View whole project usage',
    to: `${RouteDefinitions.Settings}/usage`,
  },
  [BUDGET_ERROR_CODES.MEMBER]: {
    message:
      'Your budget for this project has been reached. Your AI requests are unavailable until the budget resets or a project admin increases your limit.',
    linkLabel: 'View my usage',
    to: `${RouteDefinitions.Settings}/usage?scope=user`,
  },
};

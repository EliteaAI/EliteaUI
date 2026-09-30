import RouteDefinitions from '@/routes';

// Scopes the backend returns for a budget nearing its limit. Only one is ever sent: the
// member budget takes priority, because it is the one that stops this user specifically.
export const BUDGET_WARNING_SCOPES = {
  PROJECT: 'project',
  MEMBER: 'member',
};

// Wording stays period-neutral so it holds whatever the budget period is. Separate from
// BUDGET_ERROR_VARIANTS: that copy is for a request already blocked, this is advance notice.
export const BUDGET_WARNING_VARIANTS = {
  [BUDGET_WARNING_SCOPES.PROJECT]: {
    message: percent => `You have used ${percent}% of your budget.`,
    linkLabel: 'View usage',
    to: `${RouteDefinitions.Settings}/usage`,
  },
  [BUDGET_WARNING_SCOPES.MEMBER]: {
    message: percent => `You have used ${percent}% of your budget in this project.`,
    linkLabel: 'View my usage',
    to: `${RouteDefinitions.Settings}/usage?scope=user`,
  },
};

// One localStorage entry per budget and period holds the highest level the user dismissed
export const DISMISS_STORAGE_PREFIX = 'elitea.budgetWarning.dismissed';

// Severity by the level the backend reports; 95% is the last stop before requests are blocked
export const BUDGET_WARNING_SEVERITY = {
  WARNING: 'warning',
  ELEVATED: 'elevated',
  CRITICAL: 'critical',
};

export const ELEVATED_LEVEL = 90;
export const CRITICAL_LEVEL = 95;

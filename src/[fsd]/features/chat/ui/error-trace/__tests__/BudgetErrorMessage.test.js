import { describe, expect, it } from 'vitest';

import { BUDGET_ERROR_VARIANTS } from '../BudgetErrorMessage';

// The backend picks the scope code; these assertions pin the contract between the two,
// since a mismatch silently falls back to rendering the raw provider error instead.
const BACKEND_CODES = ['project_budget_exceeded', 'member_budget_exceeded'];

describe('budget error variants', () => {
  it('covers every scope code the backend can emit', () => {
    expect(Object.keys(BUDGET_ERROR_VARIANTS).sort()).toEqual([...BACKEND_CODES].sort());
  });

  it('sends a project-budget block to the whole-project tab', () => {
    const variant = BUDGET_ERROR_VARIANTS.project_budget_exceeded;

    expect(variant.to).toBe('/settings/usage');
    expect(variant.linkLabel).toBe('View whole project usage');
  });

  it('sends a member-budget block to the my-usage tab', () => {
    // The scope param is what preselects the tab that actually explains the block
    const variant = BUDGET_ERROR_VARIANTS.member_budget_exceeded;

    expect(variant.to).toBe('/settings/usage?scope=user');
    expect(variant.linkLabel).toBe('View my usage');
  });

  it('phrases the project message about the project, not the user', () => {
    expect(BUDGET_ERROR_VARIANTS.project_budget_exceeded.message).toMatch(/^This project's budget/);
  });

  it('phrases the member message about the user', () => {
    expect(BUDGET_ERROR_VARIANTS.member_budget_exceeded.message).toMatch(/^Your budget for this project/);
  });

  it('keeps every message period-neutral', () => {
    // Budgets are monthly today; the copy must not need a rewrite if that ever changes
    Object.values(BUDGET_ERROR_VARIANTS).forEach(({ message }) => {
      expect(message.toLowerCase()).not.toMatch(/monthly|weekly|daily|this month/);
    });
  });

  it('does not leak technical detail into the user-facing message', () => {
    Object.values(BUDGET_ERROR_VARIANTS).forEach(({ message }) => {
      expect(message).not.toMatch(/400|SDK|LiteLLM|tag|budget_exceeded/i);
    });
  });
});

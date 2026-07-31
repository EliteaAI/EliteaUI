import { describe, expect, it } from 'vitest';

import { BUDGET_WARNING_SCOPES, BUDGET_WARNING_VARIANTS } from './budgetWarning.constants';

// Scope values the backend sends. Pinned here because the copy and the link target are
// selected by them, so a rename on either side must break a test rather than silently
// render nothing.
const BACKEND_SCOPES = ['project', 'member'];

describe('budget warning variants', () => {
  it('covers every scope the backend can send', () => {
    BACKEND_SCOPES.forEach(scope => {
      expect(BUDGET_WARNING_VARIANTS[scope], scope).toBeDefined();
    });
  });

  it('has no variant the backend never sends', () => {
    expect(Object.keys(BUDGET_WARNING_VARIANTS).sort()).toEqual([...BACKEND_SCOPES].sort());
  });

  it('sends a project warning to the whole-project usage view', () => {
    const variant = BUDGET_WARNING_VARIANTS[BUDGET_WARNING_SCOPES.PROJECT];

    expect(variant.to).toBe('/settings/usage');
    expect(variant.linkLabel).toBe('View usage');
  });

  it('sends a member warning to the my-usage view', () => {
    // The member budget is the one that stops this user, so the link must land on the tab
    // that shows their own spend rather than the project total
    const variant = BUDGET_WARNING_VARIANTS[BUDGET_WARNING_SCOPES.MEMBER];

    expect(variant.to).toBe('/settings/usage?scope=user');
    expect(variant.linkLabel).toBe('View my usage');
  });

  it('states the percentage in both messages', () => {
    BACKEND_SCOPES.forEach(scope => {
      expect(BUDGET_WARNING_VARIANTS[scope].message(87)).toContain('87%');
    });
  });

  it('distinguishes a member warning as being about this project', () => {
    expect(BUDGET_WARNING_VARIANTS[BUDGET_WARNING_SCOPES.MEMBER].message(87)).toContain('in this project');
    expect(BUDGET_WARNING_VARIANTS[BUDGET_WARNING_SCOPES.PROJECT].message(87)).not.toContain(
      'in this project',
    );
  });

  it('keeps the wording period-neutral', () => {
    // Budgets are monthly today; the copy must not need a rewrite if that ever changes
    BACKEND_SCOPES.forEach(scope => {
      const message = BUDGET_WARNING_VARIANTS[scope].message(87).toLowerCase();

      ['monthly', 'weekly', 'daily', 'this month'].forEach(period => {
        expect(message, `${scope} / ${period}`).not.toContain(period);
      });
    });
  });
});

import { describe, expect, it } from 'vitest';

/**
 * The hook's two decisions, exercised without a DOM.
 *
 * `renderHook` needs jsdom, which is declared in package.json but absent from this
 * checkout (the existing jsdom-tagged tests fail to start for the same reason). These
 * mirror the hook's logic exactly rather than importing it, so they are a guard on the
 * intended behaviour and NOT proof the hook is wired correctly — that is covered by the
 * end-to-end check on the four surfaces.
 */

// Mirrors useBudgetWarning: the request is skipped unless budgets enforce AND a project is
// known. Observe mode tracks spend without blocking, so there is nothing to warn about.
const shouldSkipRequest = ({ isEnforcing, projectId }) => !isEnforcing || !projectId;

// Mirrors useBudgetWarning: dismissal is keyed by conversation, falling back to a single
// key for surfaces that keep no persisted conversation (the skill test panel).
const isVisible = ({ shouldWarn, dismissedIn, conversationId }) =>
  Boolean(shouldWarn) && !dismissedIn[conversationId ?? 'new'];

describe('budget warning request gate', () => {
  it('requests when budgets enforce and a project is known', () => {
    expect(shouldSkipRequest({ isEnforcing: true, projectId: 25 })).toBe(false);
  });

  it('skips when budgets are not enforcing', () => {
    expect(shouldSkipRequest({ isEnforcing: false, projectId: 25 })).toBe(true);
  });

  it('skips before a project is known', () => {
    expect(shouldSkipRequest({ isEnforcing: true, projectId: undefined })).toBe(true);
  });
});

describe('budget warning dismissal', () => {
  it('shows while nothing is dismissed', () => {
    expect(isVisible({ shouldWarn: true, dismissedIn: {}, conversationId: 'c1' })).toBe(true);
  });

  it('never shows when the backend says not to warn', () => {
    expect(isVisible({ shouldWarn: false, dismissedIn: {}, conversationId: 'c1' })).toBe(false);
  });

  it('hides in the chat it was dismissed in', () => {
    expect(isVisible({ shouldWarn: true, dismissedIn: { c1: true }, conversationId: 'c1' })).toBe(false);
  });

  it('still shows in a different chat', () => {
    // Per the issue's Dismissal Behavior section, dismissal is scoped to that chat only
    expect(isVisible({ shouldWarn: true, dismissedIn: { c1: true }, conversationId: 'c2' })).toBe(true);
  });

  it('treats a conversationless panel as one dismissable surface', () => {
    // The skill test panel keeps no persisted conversation
    expect(isVisible({ shouldWarn: true, dismissedIn: {}, conversationId: undefined })).toBe(true);
    expect(isVisible({ shouldWarn: true, dismissedIn: { new: true }, conversationId: undefined })).toBe(
      false,
    );
  });
});

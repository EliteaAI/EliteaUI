import { beforeAll, describe, expect, it } from 'vitest';

import { NotificationType } from '@/common/constants';

import { parseMessage, resolveHref } from './notification.helpers';

// resolveHref reads window.location to build an absolute URL
beforeAll(() => {
  globalThis.window = { location: { protocol: 'http:', host: 'elitea.test' } };
});

const BASE = 'http://elitea.test';

describe('resolveHref for budget notifications', () => {
  // Settings has no project segment, so the id must route via the project switcher —
  // otherwise the link opens whichever project happens to be selected
  it('opens the affected project on the usage page for a project budget', () => {
    for (const type of [NotificationType.BudgetThresholdReached, NotificationType.BudgetLimitReached]) {
      expect(resolveHref(type, {}, 25)).toBe(`${BASE}/25/settings/usage`);
    }
  });

  it('selects the my-usage scope for a member budget', () => {
    for (const type of [
      NotificationType.MemberBudgetThresholdReached,
      NotificationType.MemberBudgetLimitReached,
    ]) {
      expect(resolveHref(type, {}, 25)).toBe(`${BASE}/25/settings/usage?scope=user`);
    }
  });

  it('does not depend on meta', () => {
    expect(resolveHref(NotificationType.BudgetLimitReached, undefined, 7)).toBe(`${BASE}/7/settings/usage`);
  });

  it('leaves unrelated event types unresolved', () => {
    expect(resolveHref('something_else', {}, 25)).toBeNull();
  });
});

describe('parseMessage on budget copy', () => {
  it('splits the usage link out of the message', () => {
    const segments = parseMessage(
      'Budget warning: Acme has reached 80% of its monthly budget. [View project usage]()',
    );

    expect(segments).toHaveLength(2);
    expect(segments[0].isLink).toBeUndefined();
    expect(segments[1]).toEqual({ text: 'View project usage', isLink: true });
  });

  it('keeps a member message link intact', () => {
    const segments = parseMessage(
      'Budget limit reached: You have reached your monthly budget limit in Acme. [View my usage]()',
    );

    expect(segments[segments.length - 1]).toEqual({ text: 'View my usage', isLink: true });
  });
});

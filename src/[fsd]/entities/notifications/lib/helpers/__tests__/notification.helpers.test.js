import { beforeAll, describe, expect, it } from 'vitest';

import { NotificationType } from '@/common/constants';

import { parseMessage, resolveHref, sanitizePrivateProjectName } from '../notification.helpers';

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

  // Web search and other Tool Spend alerts land on the same Usage page, where their block lives
  it('routes Tool Spend alerts like budget alerts, per scope', () => {
    for (const type of [NotificationType.ToolSpendThresholdReached, NotificationType.ToolSpendLimitReached]) {
      expect(resolveHref(type, {}, 25)).toBe(`${BASE}/25/settings/usage`);
    }
    for (const type of [
      NotificationType.MemberToolSpendThresholdReached,
      NotificationType.MemberToolSpendLimitReached,
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

describe('resolveHref for index notifications', () => {
  // `indexes` is not a toolkits list tab, so a link built with it only reaches the index page
  // through a back-compat redirect and leaves the breadcrumb parent pointing at a dead list.
  it('addresses the index by its own route under a real toolkits tab', () => {
    expect(resolveHref(NotificationType.IndexDataChanged, { toolkit_id: 870, index_name: 'docs' }, 591)).toBe(
      `${BASE}/591/toolkits/all/870/index/docs`,
    );
  });

  it('falls back to the toolkit page when the run carries no index name', () => {
    expect(resolveHref(NotificationType.IndexDataChanged, { toolkit_id: 870 }, 591)).toBe(
      `${BASE}/591/toolkits/all/870`,
    );
  });

  it('encodes an index name that would otherwise open another route', () => {
    expect(
      resolveHref(NotificationType.IndexDataChanged, { toolkit_id: 870, index_name: 'a b/history' }, 591),
    ).toBe(`${BASE}/591/toolkits/all/870/index/a%20b%2Fhistory`);
  });

  it('leaves the segment unlinked when the run names no toolkit', () => {
    expect(resolveHref(NotificationType.IndexDataChanged, { index_name: 'docs' }, 591)).toBeNull();
  });

  // Both expiry notices ask their owner to go and renew a schedule. An unrouted event type
  // renders the "Manage index schedule" link as plain text, so the notice would ask for an
  // action it does not offer — and being one toggle from renewal is the point of disabling
  // rather than deleting.
  const expiryTypes = [NotificationType.IndexScheduleExpiring, NotificationType.IndexScheduleExpired];

  it('sends both schedule expiry notices to the schedule they are about', () => {
    for (const type of expiryTypes) {
      expect(resolveHref(type, { toolkit_id: 870, index_name: 'docs' }, 591)).toBe(
        `${BASE}/591/toolkits/all/870/index/docs`,
      );
    }
  });

  it('still reaches the toolkit when an expiry notice carries no index name', () => {
    for (const type of expiryTypes) {
      expect(resolveHref(type, { toolkit_id: 870 }, 591)).toBe(`${BASE}/591/toolkits/all/870`);
    }
  });
});

describe('sanitizePrivateProjectName', () => {
  it('replaces project_user_<id> with Private', () => {
    expect(sanitizePrivateProjectName('project_user_9 has reached its budget.')).toBe(
      'Private has reached its budget.',
    );
  });

  it('replaces multiple occurrences', () => {
    expect(sanitizePrivateProjectName('project_user_1 and project_user_42')).toBe('Private and Private');
  });

  it('leaves team project names untouched', () => {
    expect(sanitizePrivateProjectName('Acme has reached its budget.')).toBe('Acme has reached its budget.');
  });

  it('returns null/undefined as-is', () => {
    expect(sanitizePrivateProjectName(null)).toBeNull();
    expect(sanitizePrivateProjectName(undefined)).toBeUndefined();
  });
});

describe('parseMessage sanitizes private project names', () => {
  it('replaces project_user_<id> with Private in parsed segments', () => {
    const segments = parseMessage(
      'Budget limit reached: project_user_9 has reached its monthly budget limit. [View project usage]()',
    );

    expect(segments[0].text).toContain('Private');
    expect(segments[0].text).not.toContain('project_user_9');
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

// R2.1 to R2.5 of EL-7011 US-40: schedule notices link to the schedule subpage or the list
describe('resolveHref for schedule notifications (EL-7011 R2)', () => {
  const runTypes = [
    NotificationType.ScheduleRunFailed,
    NotificationType.ScheduleRunSucceeded,
    NotificationType.ScheduleApprovalNeeded,
    NotificationType.ScheduleApprovalExpired,
  ];
  const subpageTypes = [
    NotificationType.ScheduleExpired,
    NotificationType.ScheduleDisabled,
    NotificationType.ScheduleEditedByAdmin,
  ];
  const allTypes = [...runTypes, ...subpageTypes, NotificationType.ScheduleOwnerChanged];

  it('registers the eight schedule types with the wire names (R2.1)', () => {
    expect(allTypes).toEqual([
      'schedule_run_failed',
      'schedule_run_succeeded',
      'schedule_approval_needed',
      'schedule_approval_expired',
      'schedule_expired',
      'schedule_disabled',
      'schedule_edited_by_admin',
      'schedule_owner_changed',
    ]);
  });

  it('opens the subpage with the run selected for a run event with a conversation (R2.1)', () => {
    for (const type of runTypes) {
      expect(resolveHref(type, { schedule_id: 12, conversation_id: 345 }, 5)).toBe(
        `${BASE}/5/schedules/12?history_run_id=345`,
      );
    }
  });

  it('opens the subpage without a run when a run event has no conversation (R2.2)', () => {
    for (const type of runTypes) {
      expect(resolveHref(type, { schedule_id: 12 }, 5)).toBe(`${BASE}/5/schedules/12`);
    }
  });

  it('opens the subpage for an expired, disabled or admin-edit notice (R2.3)', () => {
    for (const type of subpageTypes) {
      expect(resolveHref(type, { schedule_id: 12, conversation_id: 345 }, 5)).toBe(`${BASE}/5/schedules/12`);
    }
  });

  it('opens the list for an owner-changed notice (R2.4)', () => {
    expect(resolveHref(NotificationType.ScheduleOwnerChanged, { schedule_id: 12 }, 5)).toBe(
      `${BASE}/5/schedules`,
    );
  });

  it('shows no link when a schedule notice has no schedule_id (R2.5)', () => {
    for (const type of [...runTypes, ...subpageTypes]) {
      expect(resolveHref(type, {}, 5)).toBeNull();
    }
    expect(resolveHref(NotificationType.ScheduleRunFailed, undefined, 5)).toBeNull();
  });
});

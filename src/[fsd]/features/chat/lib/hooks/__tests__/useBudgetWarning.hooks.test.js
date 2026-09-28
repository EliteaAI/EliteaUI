import { describe, expect, it } from 'vitest';

import {
  budgetPeriod,
  dismissStorageKey,
  isWarningVisible,
  pruneStaleDismissals,
  severityForLevel,
} from '@/[fsd]/features/chat/lib/helpers/budgetWarning.helpers';

/**
 * The hook's decisions live in budgetWarning.helpers so they can be tested without jsdom
 * (absent from this checkout). Wiring into the four surfaces is covered by the e2e pass.
 */

const show = (level, dismissedLevel, dismissible = true) =>
  isWarningVisible({ shouldWarn: true, level, dismissedLevel, dismissible });

describe('budget warning visibility across levels', () => {
  it('shows at the first level while nothing is dismissed', () => {
    expect(show(80, null)).toBe(true);
  });

  it('stays hidden at the level it was dismissed at', () => {
    expect(show(80, 80)).toBe(false);
  });

  it('returns at 90 after an 80 dismissal, and at 95 after a 90 dismissal', () => {
    expect(show(90, 80)).toBe(true);
    expect(show(95, 90)).toBe(true);
    expect(show(95, 95)).toBe(false);
  });

  it('never shows when the backend says not to warn', () => {
    expect(isWarningVisible({ shouldWarn: false, level: 95, dismissedLevel: null, dismissible: true })).toBe(
      false,
    );
  });

  it('ignores stored dismissals when dismissal is disabled by the admin', () => {
    // Stored values are kept, so turning the toggle back on hides them again
    expect(show(95, 95, false)).toBe(true);
  });

  it('treats a custom threshold like any other level', () => {
    // Threshold 92: the backend reports 92, then 95
    expect(show(92, null)).toBe(true);
    expect(show(95, 92)).toBe(true);
  });
});

describe('budget warning severity', () => {
  it('escalates warning -> elevated -> critical', () => {
    expect(severityForLevel(80)).toBe('warning');
    expect(severityForLevel(92)).toBe('elevated');
    expect(severityForLevel(90)).toBe('elevated');
    expect(severityForLevel(95)).toBe('critical');
    expect(severityForLevel(97)).toBe('critical');
  });
});

describe('dismissal storage key', () => {
  it('separates project, scope and period', () => {
    const key = dismissStorageKey({ projectId: 3, scope: 'member', period: '2026-09' });

    expect(key).toBe('elitea.budgetWarning.dismissed.3.member.2026-09');
    expect(key).not.toBe(dismissStorageKey({ projectId: 3, scope: 'project', period: '2026-09' }));
  });

  it('uses the UTC month, matching the budget reset', () => {
    // Local evening of Sep 30 can already be October in UTC
    expect(budgetPeriod(new Date('2026-10-01T01:30:00Z'))).toBe('2026-10');
    expect(budgetPeriod(new Date('2026-09-30T23:59:59Z'))).toBe('2026-09');
  });
});

describe('pruning past periods', () => {
  const fakeStorage = entries => {
    const map = new Map(Object.entries(entries));
    return {
      get length() {
        return map.size;
      },
      key: i => [...map.keys()][i],
      removeItem: k => map.delete(k),
      keys: () => [...map.keys()],
    };
  };

  it('drops dismissals from other periods and leaves unrelated keys alone', () => {
    const storage = fakeStorage({
      'elitea.budgetWarning.dismissed.3.project.2026-08': '95',
      'elitea.budgetWarning.dismissed.3.project.2026-09': '80',
      'some.other.key.2026-08': 'x',
    });

    pruneStaleDismissals('2026-09', storage);

    expect(storage.keys().sort()).toEqual(
      ['elitea.budgetWarning.dismissed.3.project.2026-09', 'some.other.key.2026-08'].sort(),
    );
  });

  it('survives a storage that throws', () => {
    expect(() =>
      pruneStaleDismissals('2026-09', {
        get length() {
          throw new Error('blocked');
        },
      }),
    ).not.toThrow();
  });
});

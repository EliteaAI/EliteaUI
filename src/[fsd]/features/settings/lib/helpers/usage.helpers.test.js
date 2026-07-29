import { afterEach, describe, expect, it, vi } from 'vitest';

import { UsageHelpers } from './index.js';

describe('formatMoney', () => {
  it('renders whole amounts to two decimals', () => {
    expect(UsageHelpers.formatMoney(215.6423)).toBe('$215.64');
  });

  it('keeps four decimals for sub-cent spend, which still matters against a small limit', () => {
    expect(UsageHelpers.formatMoney(0.0029)).toBe('$0.0029');
  });

  it('renders exact zero without extra precision', () => {
    expect(UsageHelpers.formatMoney(0)).toBe('$0.00');
  });

  it('shows a dash rather than $0 when the value is absent, so redaction is visible', () => {
    expect(UsageHelpers.formatMoney(null)).toBe('—');
    expect(UsageHelpers.formatMoney(undefined)).toBe('—');
  });

  it('prefixes non-USD currencies with their code', () => {
    expect(UsageHelpers.formatMoney(5, 'EUR')).toBe('EUR 5.00');
  });
});

describe('formatLimit', () => {
  it('treats a null limit as unlimited rather than zero', () => {
    expect(UsageHelpers.formatLimit(null)).toBe('Unlimited');
  });

  it('renders a zero limit as an actual amount, since zero blocks everything', () => {
    expect(UsageHelpers.formatLimit(0)).toBe('$0.00');
  });
});

describe('formatTokens', () => {
  it('abbreviates thousands, millions and billions', () => {
    expect(UsageHelpers.formatTokens(18_500)).toBe('18.5K');
    expect(UsageHelpers.formatTokens(301_800_000)).toBe('301.8M');
    expect(UsageHelpers.formatTokens(2_400_000_000)).toBe('2.4B');
  });

  it('leaves small counts exact', () => {
    expect(UsageHelpers.formatTokens(798)).toBe('798');
    expect(UsageHelpers.formatTokens(0)).toBe('0');
  });
});

describe('formatModelName', () => {
  it('strips the provider path', () => {
    expect(UsageHelpers.formatModelName('bedrock/eu.anthropic.claude-opus-5')).toBe(
      'eu.anthropic.claude-opus-5',
    );
  });

  it('strips the shared-project id prefix', () => {
    expect(UsageHelpers.formatModelName('1_text-embedding-ada-002')).toBe('text-embedding-ada-002');
  });

  it('leaves a plain model name untouched', () => {
    expect(UsageHelpers.formatModelName('gpt-5')).toBe('gpt-5');
  });

  it('does not strip digits that are part of the real name', () => {
    // Only a leading "<id>_" is a project prefix; a version suffix must survive
    expect(UsageHelpers.formatModelName('gpt-5.2-2025-12-11')).toBe('gpt-5.2-2025-12-11');
  });

  it('handles a missing model without throwing', () => {
    expect(UsageHelpers.formatModelName(null)).toBe('Unknown');
  });
});

describe('usageSeverity', () => {
  it('flags an exhausted budget at exactly 100%', () => {
    expect(UsageHelpers.usageSeverity(100)).toBe('exceeded');
    expect(UsageHelpers.usageSeverity(150)).toBe('exceeded');
  });

  it('warns from 80% up to but not including 100% by default', () => {
    expect(UsageHelpers.usageSeverity(80)).toBe('warning');
    expect(UsageHelpers.usageSeverity(99.9)).toBe('warning');
  });

  it('is ok below 80% by default', () => {
    expect(UsageHelpers.usageSeverity(79.9)).toBe('ok');
    expect(UsageHelpers.usageSeverity(0)).toBe('ok');
  });

  it('reports no severity when there is no limit to measure against', () => {
    expect(UsageHelpers.usageSeverity(null)).toBe('none');
    expect(UsageHelpers.usageSeverity(undefined)).toBe('none');
  });

  it('warns at the configured threshold instead of the default', () => {
    expect(UsageHelpers.usageSeverity(50, 50)).toBe('warning');
    expect(UsageHelpers.usageSeverity(49.9, 50)).toBe('ok');
    // A high threshold must not warn at what the default would have flagged
    expect(UsageHelpers.usageSeverity(80, 95)).toBe('ok');
    expect(UsageHelpers.usageSeverity(95, 95)).toBe('warning');
  });

  it('still reports exceeded at 100% whatever the threshold', () => {
    expect(UsageHelpers.usageSeverity(100, 50)).toBe('exceeded');
    expect(UsageHelpers.usageSeverity(100, 100)).toBe('exceeded');
  });

  // A bad configured value must degrade to the default, never silence the warning
  it('falls back to 80% for a missing or out-of-range threshold', () => {
    expect(UsageHelpers.usageSeverity(85, null)).toBe('warning');
    expect(UsageHelpers.usageSeverity(85, undefined)).toBe('warning');
    expect(UsageHelpers.usageSeverity(85, 0)).toBe('warning');
    expect(UsageHelpers.usageSeverity(85, 150)).toBe('warning');
    expect(UsageHelpers.usageSeverity(85, 'abc')).toBe('warning');
  });
});

describe('filterMembers', () => {
  const rows = [
    { user_id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
    { user_id: 2, name: 'Alan Turing', email: 'alan@example.com' },
    { user_id: 3, name: null, email: 'grace@example.com' },
  ];

  const ids = result => result.map(row => row.user_id);

  it('returns every member for an empty search', () => {
    expect(ids(UsageHelpers.filterMembers(rows, ''))).toEqual([1, 2, 3]);
    expect(ids(UsageHelpers.filterMembers(rows))).toEqual([1, 2, 3]);
  });

  it('matches on name', () => {
    expect(ids(UsageHelpers.filterMembers(rows, 'lovelace'))).toEqual([1]);
  });

  it('matches on email', () => {
    expect(ids(UsageHelpers.filterMembers(rows, 'alan@'))).toEqual([2]);
  });

  it('is case-insensitive', () => {
    expect(ids(UsageHelpers.filterMembers(rows, 'ALAN TURING'))).toEqual([2]);
  });

  // A member with no display name must still be findable by the email shown in the row
  it('matches on email when the member has no name', () => {
    expect(ids(UsageHelpers.filterMembers(rows, 'grace'))).toEqual([3]);
  });

  it('ignores surrounding whitespace', () => {
    expect(ids(UsageHelpers.filterMembers(rows, '  ada  '))).toEqual([1]);
  });

  it('can match more than one member', () => {
    expect(ids(UsageHelpers.filterMembers(rows, 'example.com'))).toEqual([1, 2, 3]);
  });

  it('returns nothing when no member matches', () => {
    expect(UsageHelpers.filterMembers(rows, 'nobody-by-that-name')).toEqual([]);
  });

  it('does not mutate the input', () => {
    UsageHelpers.filterMembers(rows, 'ada');
    expect(rows).toHaveLength(3);
  });

  it('tolerates a missing rows list', () => {
    expect(UsageHelpers.filterMembers(undefined, 'ada')).toEqual([]);
  });
});

describe('reset labels', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts whole days until the period rolls over', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    expect(UsageHelpers.daysUntilReset('2026-08-01T00:00:00+00:00')).toBe(5);
    expect(UsageHelpers.formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets in 5 days');
  });

  it('uses singular wording on the final day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-31T12:00:00Z'));

    expect(UsageHelpers.formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets tomorrow');
  });

  it('does not report negative days once the reset has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00Z'));

    expect(UsageHelpers.daysUntilReset('2026-08-01T00:00:00+00:00')).toBe(0);
    expect(UsageHelpers.formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets today');
  });

  it('stays silent when no reset time is known', () => {
    expect(UsageHelpers.formatResetLabel(null)).toBe('');
  });
});

describe('UsageHelpers.fillDailyGaps', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('inserts zero days so the chart cannot interpolate a gap into a gradual slope', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    const filled = UsageHelpers.fillDailyGaps(
      [
        { date: '2026-07-25', spend: 7.31, total_tokens: 10, api_requests: 17 },
        { date: '2026-07-27', spend: 200.39, total_tokens: 20, api_requests: 570 },
      ],
      '2026-07-25',
      '2026-07-31',
    );

    expect(filled.map(day => day.date)).toEqual(['2026-07-25', '2026-07-26', '2026-07-27']);
    expect(filled[1]).toMatchObject({ date: '2026-07-26', spend: 0, api_requests: 0 });
  });

  it('stops at today rather than padding the rest of the month with zeroes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    const filled = UsageHelpers.fillDailyGaps(
      [{ date: '2026-07-27', spend: 1, api_requests: 1 }],
      '2026-07-01',
      '2026-07-31',
    );

    expect(filled[filled.length - 1].date).toBe('2026-07-27');
    expect(filled).toHaveLength(27);
  });

  it('preserves the real values of days that have data', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    const filled = UsageHelpers.fillDailyGaps(
      [{ date: '2026-07-26', spend: 4.5, api_requests: 3 }],
      '2026-07-26',
      '2026-07-31',
    );

    expect(filled[0]).toMatchObject({ spend: 4.5, api_requests: 3 });
  });

  it('returns the input untouched when there is nothing to plot', () => {
    expect(UsageHelpers.fillDailyGaps([], '2026-07-01', '2026-07-31')).toEqual([]);
  });

  it('does not throw when period bounds are missing', () => {
    const daily = [{ date: '2026-07-27', spend: 1 }];

    expect(UsageHelpers.fillDailyGaps(daily, null, null)).toEqual(daily);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  daysUntilReset,
  fillDailyGaps,
  formatLimit,
  formatModelName,
  formatMoney,
  formatResetLabel,
  formatTokens,
  usageSeverity,
} from './usage.helpers';

describe('formatMoney', () => {
  it('renders whole amounts to two decimals', () => {
    expect(formatMoney(215.6423)).toBe('$215.64');
  });

  it('keeps four decimals for sub-cent spend, which still matters against a small limit', () => {
    expect(formatMoney(0.0029)).toBe('$0.0029');
  });

  it('renders exact zero without extra precision', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('shows a dash rather than $0 when the value is absent, so redaction is visible', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('prefixes non-USD currencies with their code', () => {
    expect(formatMoney(5, 'EUR')).toBe('EUR 5.00');
  });
});

describe('formatLimit', () => {
  it('treats a null limit as unlimited rather than zero', () => {
    expect(formatLimit(null)).toBe('Unlimited');
  });

  it('renders a zero limit as an actual amount, since zero blocks everything', () => {
    expect(formatLimit(0)).toBe('$0.00');
  });
});

describe('formatTokens', () => {
  it('abbreviates thousands, millions and billions', () => {
    expect(formatTokens(18_500)).toBe('18.5K');
    expect(formatTokens(301_800_000)).toBe('301.8M');
    expect(formatTokens(2_400_000_000)).toBe('2.4B');
  });

  it('leaves small counts exact', () => {
    expect(formatTokens(798)).toBe('798');
    expect(formatTokens(0)).toBe('0');
  });
});

describe('formatModelName', () => {
  it('strips the provider path', () => {
    expect(formatModelName('bedrock/eu.anthropic.claude-opus-5')).toBe('eu.anthropic.claude-opus-5');
  });

  it('strips the shared-project id prefix', () => {
    expect(formatModelName('1_text-embedding-ada-002')).toBe('text-embedding-ada-002');
  });

  it('leaves a plain model name untouched', () => {
    expect(formatModelName('gpt-5')).toBe('gpt-5');
  });

  it('does not strip digits that are part of the real name', () => {
    // Only a leading "<id>_" is a project prefix; a version suffix must survive
    expect(formatModelName('gpt-5.2-2025-12-11')).toBe('gpt-5.2-2025-12-11');
  });

  it('handles a missing model without throwing', () => {
    expect(formatModelName(null)).toBe('Unknown');
  });
});

describe('usageSeverity', () => {
  it('flags an exhausted budget at exactly 100%', () => {
    expect(usageSeverity(100)).toBe('exceeded');
    expect(usageSeverity(150)).toBe('exceeded');
  });

  it('warns from 80% up to but not including 100%', () => {
    expect(usageSeverity(80)).toBe('warning');
    expect(usageSeverity(99.9)).toBe('warning');
  });

  it('is ok below 80%', () => {
    expect(usageSeverity(79.9)).toBe('ok');
    expect(usageSeverity(0)).toBe('ok');
  });

  it('reports no severity when there is no limit to measure against', () => {
    expect(usageSeverity(null)).toBe('none');
    expect(usageSeverity(undefined)).toBe('none');
  });
});

describe('reset labels', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts whole days until the period rolls over', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    expect(daysUntilReset('2026-08-01T00:00:00+00:00')).toBe(5);
    expect(formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets in 5 days');
  });

  it('uses singular wording on the final day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-31T12:00:00Z'));

    expect(formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets tomorrow');
  });

  it('does not report negative days once the reset has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00Z'));

    expect(daysUntilReset('2026-08-01T00:00:00+00:00')).toBe(0);
    expect(formatResetLabel('2026-08-01T00:00:00+00:00')).toBe('Resets today');
  });

  it('stays silent when no reset time is known', () => {
    expect(formatResetLabel(null)).toBe('');
  });
});

describe('fillDailyGaps', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('inserts zero days so the chart cannot interpolate a gap into a gradual slope', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00Z'));

    const filled = fillDailyGaps(
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

    const filled = fillDailyGaps(
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

    const filled = fillDailyGaps(
      [{ date: '2026-07-26', spend: 4.5, api_requests: 3 }],
      '2026-07-26',
      '2026-07-31',
    );

    expect(filled[0]).toMatchObject({ spend: 4.5, api_requests: 3 });
  });

  it('returns the input untouched when there is nothing to plot', () => {
    expect(fillDailyGaps([], '2026-07-01', '2026-07-31')).toEqual([]);
  });

  it('does not throw when period bounds are missing', () => {
    const daily = [{ date: '2026-07-27', spend: 1 }];

    expect(fillDailyGaps(daily, null, null)).toEqual(daily);
  });
});

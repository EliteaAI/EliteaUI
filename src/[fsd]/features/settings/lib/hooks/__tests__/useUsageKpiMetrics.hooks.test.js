// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useUsageKpiMetrics } from '../useUsageKpiMetrics.hooks.js';

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const daily = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-10-${String(i + 1).padStart(2, '0')}`,
  spend: 5 + i,
  total_tokens: (5 + i) * 100,
}));

const baseData = {
  spend: 95,
  total_tokens: 9500,
  effective_limit: 200,
  limit_source: 'explicit',
  currency: 'USD',
  period_start: '2026-10-01',
  daily,
  percent_used: 47,
  input_tokens: 6000,
  cache_read_tokens: 2000,
};

const baseProps = {
  data: baseData,
  canSeeAmounts: true,
  isCurrentPeriod: true,
  comparisonData: null,
  comparisonLabel: null,
};

describe('useUsageKpiMetrics — KPI list structure', () => {
  it('always returns exactly 4 KPI cards', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));

    expect(result.current.kpis).toHaveLength(4);
  });

  it('returns cards with expected ids: spent, forecast, avg, tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const ids = result.current.kpis.map(k => k.id);

    expect(ids).toEqual(['spent', 'forecast', 'avg', 'tokens']);
  });
});

describe('useUsageKpiMetrics — spent card', () => {
  it('formats spend as money when canSeeAmounts is true', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const spent = result.current.kpis.find(k => k.id === 'spent');

    expect(spent.value).toBe('$95.00');
    expect(spent.label).toBe('SPENT');
  });

  it('shows BUDGET USED percentage when canSeeAmounts is false', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics({ ...baseProps, canSeeAmounts: false }));
    const spent = result.current.kpis.find(k => k.id === 'spent');

    expect(spent.label).toBe('BUDGET USED');
    expect(spent.value).toBe('47%');
  });

  it('shows a comparison delta when comparisonData is provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const comparisonData = { spend: 80, total_tokens: 8000, period_start: '2026-09-01' };
    const { result } = renderHook(() => useUsageKpiMetrics({ ...baseProps, comparisonData }));
    const spent = result.current.kpis.find(k => k.id === 'spent');

    // spend rose from 80 → 95, so delta direction is 'up'
    expect(spent.delta?.direction).toBe('up');
  });

  it('shows no delta when there is no valid comparison', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const spent = result.current.kpis.find(k => k.id === 'spent');

    expect(spent.delta).toBeNull();
  });
});

describe('useUsageKpiMetrics — forecast card (current period)', () => {
  it('shows a forecast value when enough days have elapsed', () => {
    vi.useFakeTimers();
    // 10 days elapsed → elapsedDays >= 3, forecast is computable
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const forecast = result.current.kpis.find(k => k.id === 'forecast');

    expect(forecast.label).toBe('FORECAST');
    expect(forecast.value).not.toBe('—');
  });

  it('shows "—" when fewer than 3 days have elapsed (not enough signal)', () => {
    vi.useFakeTimers();
    // Only 2 days in the period
    vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));

    const shortDaily = daily.slice(0, 2);
    const { result } = renderHook(() =>
      useUsageKpiMetrics({ ...baseProps, data: { ...baseData, daily: shortDaily, spend: 10 } }),
    );
    const forecast = result.current.kpis.find(k => k.id === 'forecast');

    expect(forecast.value).toBe('—');
  });
});

describe('useUsageKpiMetrics — LIMIT card (past period)', () => {
  it('shows the LIMIT card label instead of FORECAST for a past period', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics({ ...baseProps, isCurrentPeriod: false }));
    const limitCard = result.current.kpis.find(k => k.id === 'forecast');

    expect(limitCard.label).toBe('LIMIT');
  });

  it('shows "Unlimited" when no limit is set', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T12:00:00Z'));

    const noLimit = { ...baseData, effective_limit: null, limit_source: null };
    const { result } = renderHook(() =>
      useUsageKpiMetrics({ ...baseProps, data: noLimit, isCurrentPeriod: false }),
    );
    const limitCard = result.current.kpis.find(k => k.id === 'forecast');

    expect(limitCard.value).toBe('Unlimited');
  });
});

describe('useUsageKpiMetrics — tokens card', () => {
  it('shows the TOKENS card with formatted token count when canSeeAmounts is true', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const tokens = result.current.kpis.find(k => k.id === 'tokens');

    expect(tokens.label).toBe('TOKENS');
    expect(tokens.value).toContain('9.5K');
  });

  it('shows CACHE HIT RATE when canSeeAmounts is false and there is no effective_limit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const noLimit = { ...baseData, effective_limit: null };
    const { result } = renderHook(() =>
      useUsageKpiMetrics({ ...baseProps, data: noLimit, canSeeAmounts: false }),
    );
    const tokens = result.current.kpis.find(k => k.id === 'tokens');

    expect(tokens.label).toBe('CACHE HIT RATE');
    // 2000 cache_read / (6000 input + 2000 cache_read) = 25%
    expect(tokens.value).toBe('25%');
  });
});

describe('useUsageKpiMetrics — avg card', () => {
  it('includes peak day information in the subtitle', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));
    const avg = result.current.kpis.find(k => k.id === 'avg');

    expect(avg.subtitle).toMatch(/Peak/);
  });
});

describe('useUsageKpiMetrics — return values', () => {
  it('exposes elapsedDays, daysInMonth, and forecast alongside kpis', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));

    const { result } = renderHook(() => useUsageKpiMetrics(baseProps));

    expect(result.current.elapsedDays).toBe(10);
    expect(result.current.daysInMonth).toBe(31);
    expect(typeof result.current.forecast).toBe('number');
  });
});

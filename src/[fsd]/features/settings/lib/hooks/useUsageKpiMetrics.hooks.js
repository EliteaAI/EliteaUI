import { useMemo } from 'react';

import { PeriodConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

export const useUsageKpiMetrics = ({
  data,
  canSeeAmounts,
  isCurrentPeriod,
  comparisonData,
  comparisonLabel,
}) => {
  const {
    spend,
    total_tokens: totalTokens,
    effective_limit: effectiveLimit,
    limit_source: limitSource,
    currency = 'USD',
    period_start: periodStart,
    daily = [],
  } = data;

  const daysInMonth = useMemo(() => {
    if (!periodStart) return 30;

    const d = new Date(periodStart + 'T00:00:00Z');

    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  }, [periodStart]);

  const elapsedDays = useMemo(() => {
    if (!periodStart) return 0;

    const start = new Date(periodStart + 'T00:00:00Z');
    const today = new Date();
    const diff = Math.floor((today - start) / 86400000) + 1;

    return Math.max(0, Math.min(diff, daysInMonth));
  }, [periodStart, daysInMonth]);

  const forecast = useMemo(
    () => UsageHelpers.forecastSpend(spend, elapsedDays, daysInMonth),
    [spend, elapsedDays, daysInMonth],
  );

  // For the current period compare like-for-like up to today; for past periods compare
  // the full month (throughDay=null) so we don't cut 31-day months off at day 30.
  const comparableThroughDay = isCurrentPeriod ? elapsedDays : null;

  const prevSpend = useMemo(
    () => UsageHelpers.comparableTotal(comparisonData, 'spend', comparableThroughDay),
    [comparisonData, comparableThroughDay],
  );
  const prevTokens = useMemo(
    () => UsageHelpers.comparableTotal(comparisonData, 'total_tokens', comparableThroughDay),
    [comparisonData, comparableThroughDay],
  );

  const spentDelta = useMemo(() => UsageHelpers.computeDelta(spend, prevSpend), [spend, prevSpend]);
  const tokenDelta = useMemo(
    () => UsageHelpers.computeDelta(totalTokens, prevTokens),
    [totalTokens, prevTokens],
  );

  const vsLabel = useMemo(
    () => UsageHelpers.buildVsLabel(comparisonData, elapsedDays, isCurrentPeriod),
    [comparisonData, elapsedDays, isCurrentPeriod],
  );

  const prevMonthName = useMemo(() => {
    if (!periodStart) return null;

    const d = new Date(periodStart + 'T00:00:00Z');
    const prev = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));

    return PeriodConstants.MONTH_SHORT[prev.getUTCMonth()];
  }, [periodStart]);

  const hasValidComparison = useMemo(() => {
    if (!comparisonData) return false;
    if (!comparisonData.period_start || !periodStart) return false;

    const compD = new Date(comparisonData.period_start + 'T00:00:00Z');
    const curD = new Date(periodStart + 'T00:00:00Z');

    return compD.getUTCFullYear() !== curD.getUTCFullYear() || compD.getUTCMonth() !== curD.getUTCMonth();
  }, [comparisonData, periodStart]);

  const peakDay = useMemo(
    () => daily.reduce((best, d) => (!best || (d.spend || 0) > (best.spend || 0) ? d : best), null),
    [daily],
  );

  const peakDateLabel = useMemo(() => {
    if (!peakDay?.date) return '';

    const d = new Date(peakDay.date + 'T00:00:00Z');

    return `${PeriodConstants.MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }, [peakDay]);

  const cacheHitRate = useMemo(() => {
    const { input_tokens: inp = 0, cache_read_tokens: cr = 0 } = data;
    const total = inp + cr;

    return total > 0 ? Math.round((cr / total) * 100) : 0;
  }, [data]);

  const avgPerDay = elapsedDays > 0 ? spend / elapsedDays : 0;
  const noCompareSubtitle = !hasValidComparison;
  const showCacheHitRate = !canSeeAmounts && data.percent_used == null;

  const dailySpends = daily.map(d => d.spend || 0);
  const dailyTokens = daily.map(d => d.total_tokens || 0);

  const kpis = useMemo(() => {
    const list = [];

    const spentSubtitle = noCompareSubtitle
      ? `No data for ${prevMonthName} to compare`
      : comparisonLabel || vsLabel || 'this billing period';
    const spentDeltaVal = noCompareSubtitle ? null : spentDelta;
    const spentPrefix = noCompareSubtitle ? '— ' : '';

    if (canSeeAmounts) {
      list.push({
        id: 'spent',
        label: 'SPENT',
        value: UsageHelpers.formatMoney(spend, currency),
        subtitle: spentSubtitle,
        subtitlePrefix: spentPrefix,
        delta: spentDeltaVal,
        sparkline: dailySpends,
        testId: 'usage-kpi-spent',
        tooltip: null,
      });
    } else {
      list.push({
        id: 'spent',
        label: 'BUDGET USED',
        value: `${data.percent_used ?? 0}%`,
        subtitle: spentSubtitle,
        subtitlePrefix: spentPrefix,
        delta: spentDeltaVal,
        sparkline: dailySpends,
        testId: 'usage-kpi-spent',
        tooltip: null,
      });
    }

    if (isCurrentPeriod) {
      const forecastPct =
        effectiveLimit && forecast != null
          ? Math.round((forecast / effectiveLimit) * 100)
          : data.percent_used != null && elapsedDays > 0
            ? Math.round((data.percent_used / elapsedDays) * daysInMonth)
            : null;
      const forecastSubtitle =
        forecast == null
          ? 'not enough data yet'
          : forecastPct != null
            ? `≈ ${forecastPct}% of limit`
            : 'end of month estimate';

      list.push({
        id: 'forecast',
        label: 'FORECAST',
        value:
          forecast != null
            ? canSeeAmounts
              ? UsageHelpers.formatMoney(forecast, currency)
              : forecastPct != null
                ? `${forecastPct}%`
                : '—'
            : '—',
        subtitle: forecastSubtitle,
        delta: null,
        sparkline: dailySpends,
        testId: 'usage-kpi-forecast',
        tooltip: null,
      });
    } else {
      const limitValue = canSeeAmounts
        ? effectiveLimit != null
          ? UsageHelpers.formatMoney(effectiveLimit, currency)
          : 'Unlimited'
        : data.percent_used != null
          ? `${data.percent_used ?? 0}% of limit`
          : 'Unlimited';
      const sourceTag =
        { explicit: 'explicit', default: 'default', unlimited: 'unlimited' }[limitSource] ||
        limitSource ||
        '';

      list.push({
        id: 'forecast',
        label: 'LIMIT',
        value: limitValue,
        subtitle: sourceTag,
        delta: null,
        sparkline: dailySpends,
        testId: 'usage-kpi-forecast',
        tooltip: null,
      });
    }

    list.push({
      id: 'avg',
      label: 'AVG / DAY',
      value: canSeeAmounts
        ? UsageHelpers.formatMoney(avgPerDay, currency)
        : UsageHelpers.formatTokens(totalTokens / Math.max(elapsedDays, 1)),
      subtitle: peakDay
        ? canSeeAmounts
          ? `Peak ${UsageHelpers.formatMoney(peakDay.spend, currency)} on ${peakDateLabel}`
          : `Peak ${UsageHelpers.formatTokens(peakDay.total_tokens)} on ${peakDateLabel}`
        : 'this period',
      delta: null,
      sparkline: dailySpends,
      testId: 'usage-kpi-avg',
      tooltip: null,
    });

    if (showCacheHitRate) {
      list.push({
        id: 'tokens',
        label: 'CACHE HIT RATE',
        value: `${cacheHitRate}%`,
        subtitle: 'of input tokens served from cache',
        delta: null,
        sparkline: dailyTokens,
        testId: 'usage-kpi-tokens',
        tooltip: UsageHelpers.tokensBreakdownTooltip(data),
      });
    } else {
      list.push({
        id: 'tokens',
        label: 'TOKENS',
        value: UsageHelpers.formatTokens(totalTokens),
        subtitle: noCompareSubtitle
          ? 'Input, output and cache'
          : comparisonLabel || vsLabel || 'prompt and completion',
        subtitlePrefix: noCompareSubtitle ? '— ' : '',
        delta: noCompareSubtitle ? null : tokenDelta,
        sparkline: dailyTokens,
        testId: 'usage-kpi-tokens',
        tooltip: UsageHelpers.tokensBreakdownTooltip(data),
      });
    }

    return list;
  }, [
    noCompareSubtitle,
    prevMonthName,
    comparisonLabel,
    vsLabel,
    spentDelta,
    canSeeAmounts,
    isCurrentPeriod,
    avgPerDay,
    currency,
    totalTokens,
    elapsedDays,
    peakDay,
    peakDateLabel,
    dailySpends,
    showCacheHitRate,
    spend,
    data,
    effectiveLimit,
    forecast,
    limitSource,
    cacheHitRate,
    dailyTokens,
    tokenDelta,
    daysInMonth,
  ]);

  return { kpis, elapsedDays, daysInMonth, forecast };
};

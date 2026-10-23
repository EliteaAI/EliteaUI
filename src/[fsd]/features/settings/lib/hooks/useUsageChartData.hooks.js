import { useMemo } from 'react';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

export const useUsageChartData = ({
  daily,
  models,
  bySource,
  periodStart,
  periodEnd,
  compData,
  groupBy,
  granularity,
  compareEnabled,
  metricKey,
}) => {
  const compDailyFilled = useMemo(
    () => UsageHelpers.fillDailyGaps(compData?.daily ?? [], compData?.period_start, compData?.period_end),
    [compData],
  );

  const { data: compSeriesData } = useMemo(
    () => UsageHelpers.buildSeriesFromDaily(compDailyFilled, groupBy, models, bySource, metricKey),
    [compDailyFilled, groupBy, models, bySource, metricKey],
  );

  const compChartData = useMemo(
    () => (granularity === 'weekly' ? UsageHelpers.buildWeeklyData(compSeriesData) : compSeriesData),
    [compSeriesData, granularity],
  );

  const filledDaily = useMemo(
    () => UsageHelpers.fillDailyGaps(daily, periodStart, periodEnd),
    [daily, periodStart, periodEnd],
  );

  const {
    data: seriesData,
    keys: seriesKeys,
    labels: seriesLabels,
  } = useMemo(
    () => UsageHelpers.buildSeriesFromDaily(filledDaily, groupBy, models, bySource, metricKey),
    [filledDaily, groupBy, models, bySource, metricKey],
  );

  const chartData = useMemo(
    () => (granularity === 'weekly' ? UsageHelpers.buildWeeklyData(seriesData) : seriesData),
    [seriesData, granularity],
  );

  const mergedChartData = useMemo(() => {
    if (!compareEnabled || !compChartData.length) return chartData;

    return chartData.map((row, i) => {
      const prevRow = compChartData[i];
      const prevTotal = prevRow
        ? Object.entries(prevRow).reduce((s, [k, v]) => (k === 'date' ? s : s + (v || 0)), 0)
        : null;

      return prevTotal != null ? { ...row, __prev: prevTotal } : row;
    });
  }, [compareEnabled, chartData, compChartData]);

  const hasData = useMemo(() => daily.some(day => (day[metricKey] || 0) > 0), [daily, metricKey]);

  return { seriesKeys, seriesLabels, chartData, mergedChartData, compChartData, hasData };
};

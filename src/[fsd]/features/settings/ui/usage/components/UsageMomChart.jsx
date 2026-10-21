import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { PeriodHelpers, UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const SVG_W = 600;
const SVG_H = 120;
const PAD = { top: 8, right: 8, bottom: 24, left: 48 };
const CHART_W = SVG_W - PAD.left - PAD.right;
const CHART_H = SVG_H - PAD.top - PAD.bottom;

// totalDays: total days on the shared X-axis (e.g. 31 for October).
// Each data point at index i represents Day i+1, so i=0→Day 1, i=29→Day 30.
const toPoints = (values, maxVal, totalDays) => {
  if (!values.length || maxVal <= 0) return [];

  const axisDays = Math.max(totalDays, 1);

  return values.map((v, i) => {
    const x = PAD.left + (i / (axisDays - 1)) * CHART_W;
    const y = PAD.top + CHART_H - ((v || 0) / maxVal) * CHART_H;

    return [x, y];
  });
};

const pointsToPath = points => {
  if (!points.length) return '';

  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
};

const pointsToAreaPath = (points, bottomY) => {
  if (!points.length) return '';

  const line = pointsToPath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${line} L ${last[0].toFixed(1)} ${bottomY} L ${first[0].toFixed(1)} ${bottomY} Z`;
};

const UsageMomChart = memo(props => {
  const {
    currentDaily = [],
    prevDaily = [],
    limit,
    canSeeAmounts,
    currency,
    isCurrentPeriod = true,
    currentPeriodLabel,
    prevPeriodLabel,
    sx = {},
  } = props;

  const { palette } = useTheme();
  const styles = usageMomChartStyles();

  const metricKey = canSeeAmounts ? 'spend' : 'total_tokens';

  const currentValues = useMemo(
    () => UsageHelpers.toCumulative(currentDaily.map(d => d[metricKey] || 0)),
    [currentDaily, metricKey],
  );
  const prevValues = useMemo(
    () => UsageHelpers.toCumulative(prevDaily.map(d => d[metricKey] || 0)),
    [prevDaily, metricKey],
  );

  const hasData = prevValues.some(v => v > 0) || currentValues.some(v => v > 0);

  const currentSpend = currentValues[currentValues.length - 1] || 0;
  const prevAtSameDay = prevValues[currentValues.length - 1] ?? prevValues[prevValues.length - 1] ?? 0;

  const delta = UsageHelpers.computeDelta(currentSpend, prevAtSameDay);

  // Shared X-axis length: longest of both series (or at least 28 days for a realistic axis)
  const totalDays = Math.max(currentValues.length, prevValues.length, 28);

  const maxVal = Math.max(...currentValues, ...prevValues, limit || 0) * 1.1 || 1;

  const currentPoints = toPoints(currentValues, maxVal, totalDays);
  const prevPoints = toPoints(prevValues, maxVal, totalDays);
  const bottomY = PAD.top + CHART_H;

  const forecastValues = useMemo(() => {
    if (!isCurrentPeriod || !currentValues.length) return [];

    const elapsed = currentValues.length;
    const daysInMonth = totalDays;

    if (elapsed < 3) return [];

    const dailyRate = currentSpend / elapsed;
    const extended = [...currentValues];

    for (let i = elapsed; i < daysInMonth; i++) {
      extended.push(currentSpend + dailyRate * (i - elapsed + 1));
    }

    return extended;
  }, [currentValues, isCurrentPeriod, currentSpend, totalDays]);

  const forecastPoints = toPoints(forecastValues, maxVal, totalDays);
  const forecastStartIndex = currentValues.length - 1;
  const forecastPath =
    forecastPoints.length > forecastStartIndex
      ? forecastPoints
          .slice(forecastStartIndex)
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
          .join(' ')
      : '';

  const limitY = limit ? PAD.top + CHART_H - (limit / maxVal) * CHART_H : null;

  const xLabels = [1, 10, 20, totalDays];

  const subtitleText = (() => {
    if (delta.direction === 'none') return '';

    const pct = delta.pct !== null ? `${Math.abs(delta.pct).toFixed(0)}%` : '';
    const aboveBelow = delta.direction === 'up' ? 'above' : 'below';

    if (!isCurrentPeriod) {
      const curMonthName = PeriodHelpers.parsePeriodMonth(currentPeriodLabel);
      const prevMonthName = PeriodHelpers.parsePeriodMonth(prevPeriodLabel);
      const monthLabel = curMonthName || 'That month';
      const prevLabel = prevMonthName || 'last month';

      if (canSeeAmounts) {
        const endedAt = UsageHelpers.formatMoney(currentSpend, currency);
        return pct
          ? `${monthLabel} ended at ${endedAt}, ${pct} ${aboveBelow} ${prevLabel}.`
          : `${monthLabel} ended at ${endedAt}.`;
      }

      return pct ? `${monthLabel} ended ${pct} ${aboveBelow} ${prevLabel}.` : '';
    }

    const diff = canSeeAmounts ? UsageHelpers.formatMoney(Math.abs(delta.value), currency) : '';
    const dir = delta.direction === 'up' ? 'more' : 'less';

    if (canSeeAmounts && diff)
      return `You've spent ${diff} ${dir} than at this point last month (${delta.direction === 'up' ? '+' : '−'}${pct}).`;

    return `Usage is ${pct} ${dir} than at this point last month.`;
  })();

  if (!hasData) return null;

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-mom-chart"
    >
      <Box sx={styles.titleBlock}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          {isCurrentPeriod
            ? 'This month vs last month'
            : `${PeriodHelpers.parsePeriodMonth(currentPeriodLabel) || 'Selected month'} vs ${PeriodHelpers.parsePeriodMonth(prevPeriodLabel) || 'prior month'}`}
        </Typography>
        {subtitleText && (
          <Typography
            variant="bodySmall"
            sx={styles.subtitle(delta.direction)}
          >
            {subtitleText}
          </Typography>
        )}
      </Box>

      <Box sx={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {/* Left Y-axis rail */}
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={PAD.top + CHART_H}
            stroke={palette.border?.lines || palette.divider}
            strokeWidth="1"
          />

          {/* Bottom X-axis rail */}
          <line
            x1={PAD.left}
            y1={PAD.top + CHART_H}
            x2={PAD.left + CHART_W}
            y2={PAD.top + CHART_H}
            stroke={palette.border?.lines || palette.divider}
            strokeWidth="1"
          />

          {/* Limit dotted line */}
          {limitY !== null && (
            <line
              x1={PAD.left}
              y1={limitY}
              x2={PAD.left + CHART_W}
              y2={limitY}
              stroke={palette.warning.main}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Prev period path (dashed) */}
          {prevPoints.length > 0 && (
            <path
              d={pointsToPath(prevPoints)}
              fill="none"
              stroke={palette.text.disabled}
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {/* Current area fill */}
          {currentPoints.length > 0 && (
            <path
              d={pointsToAreaPath(currentPoints, bottomY)}
              fill={palette.primary.main}
              fillOpacity="0.12"
              stroke="none"
            />
          )}

          {/* Current period solid line */}
          {currentPoints.length > 0 && (
            <path
              d={pointsToPath(currentPoints)}
              fill="none"
              stroke={palette.primary.main}
              strokeWidth="2.5"
            />
          )}

          {/* Forecast extension dotted */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke={palette.primary.main}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* X-axis labels */}
          {xLabels.map((day, idx) => {
            const x = PAD.left + ((day - 1) / (totalDays - 1)) * CHART_W;
            const anchor = idx === 0 ? 'start' : idx === xLabels.length - 1 ? 'end' : 'middle';

            return (
              <text
                key={day}
                x={x}
                y={SVG_H - 4}
                textAnchor={anchor}
                fontSize="10"
                fill={palette.text.metrics || palette.text.disabled}
              >
                {`Day ${day}`}
              </text>
            );
          })}

          {/* Y-axis ticks */}
          {[0, 0.5, 1].map(frac => {
            const y = PAD.top + CHART_H - frac * CHART_H;
            const val = frac * maxVal;

            return (
              <text
                key={frac}
                x={PAD.left - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill={palette.text.metrics || palette.text.disabled}
              >
                {canSeeAmounts ? `$${val.toFixed(0)}` : UsageHelpers.formatTokens(val)}
              </text>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <Box sx={styles.legend}>
        <Box sx={styles.legendItem}>
          <Box sx={styles.legendLine('solid', palette.primary.main)} />
          <Typography
            variant="bodySmall"
            sx={styles.legendLabel}
          >
            {currentPeriodLabel || 'This month'}
          </Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Box sx={styles.legendLine('dashed', palette.text.disabled)} />
          <Typography
            variant="bodySmall"
            sx={styles.legendLabel}
          >
            {prevPeriodLabel || 'Last month'}
          </Typography>
        </Box>
        {limitY !== null && (
          <Box sx={styles.legendItem}>
            <Box sx={styles.legendLine('dotted', palette.warning.main)} />
            <Typography
              variant="bodySmall"
              sx={styles.legendLabel}
            >
              Limit
            </Typography>
          </Box>
        )}
        {isCurrentPeriod && forecastPath && (
          <Box sx={styles.legendItem}>
            <Box sx={styles.legendLine('dotted', palette.primary.main)} />
            <Typography
              variant="bodySmall"
              sx={styles.legendLabel}
            >
              Forecast
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

UsageMomChart.displayName = 'UsageMomChart';

/** @type {MuiSx} */
const usageMomChartStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    flex: 1,
    minWidth: 0,
  }),
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle:
    direction =>
    ({ palette }) => ({
      color:
        direction === 'up'
          ? palette.warning.main
          : direction === 'down'
            ? palette.success.main
            : palette.text.metrics || palette.text.disabled,
    }),
  chartWrapper: {
    height: '7.5rem',
    width: '100%',
  },
  legend: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '0.875rem',
    alignItems: 'center',
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.375rem',
  },
  legendLine: (style, color) => ({
    width: '1.5rem',
    height: '0',
    borderTop:
      style === 'dotted'
        ? `0.125rem dotted ${color}`
        : style === 'dashed'
          ? `0.125rem dashed ${color}`
          : `0.1875rem solid ${color}`,
    flexShrink: 0,
  }),
  legendLabel: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
});

export default UsageMomChart;

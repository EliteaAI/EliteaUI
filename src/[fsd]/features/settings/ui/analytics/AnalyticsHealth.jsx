import { memo, useCallback, useMemo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, TableSortLabel, Typography, useTheme } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { analyticsTableSortLabelSx } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { EVENT_TYPE_COLORS } from '@/[fsd]/shared/config/theme';
import { useClientSort, useSortedRows } from '@/[fsd]/shared/lib/hooks';

const HEALTH_COLUMNS = [
  { key: 'event_type', label: 'Event Type', flex: 2 },
  { key: 'total', label: 'Total', flex: 1 },
  { key: 'errors', label: 'Errors', flex: 1 },
  { key: 'error_rate', label: 'Error Rate', flex: 1 },
  { key: 'avg_duration_ms', label: 'Avg Latency', flex: 1 },
];

const AnalyticsHealth = memo(props => {
  const { health = [], daily_activity = [], hideTrend = false } = props;

  const styles = analyticsHealthStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { sort: healthSort, handleSort: handleHealthSort } = useClientSort('total');
  const defaultGetValue = useCallback((row, key) => row[key], []);
  const sortedHealth = useSortedRows(health, healthSort, defaultGetValue);

  const errorTrend = useMemo(
    () =>
      daily_activity.map(d => ({
        date: d.date,
        errors: d.errors,
        events: d.events,
        errorRate: d.events > 0 ? Number(((d.errors / d.events) * 100).toFixed(2)) : 0,
      })),
    [daily_activity],
  );

  if (!health.length)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No health data available.
        </Typography>
      </Box>
    );

  return (
    <Box sx={styles.healthContent}>
      {!hideTrend && errorTrend.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Requests vs Errors
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Total requests trend with error overlay
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <AreaChart data={errorTrend}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={d => d?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="events"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="errors"
                  orientation="right"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="events"
                  type="monotone"
                  dataKey="events"
                  name="Total Requests"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="errors"
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke={palette.status.rejected}
                  fill={palette.status.rejected}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
      <Box sx={styles.chartCard}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          Health by Event Type
        </Typography>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            {HEALTH_COLUMNS.map(col => (
              <Box
                key={col.key}
                sx={[styles.tableCell, { flex: col.flex }]}
              >
                <TableSortLabel
                  active={healthSort.sortBy === col.key}
                  direction={healthSort.sortBy === col.key ? healthSort.sortOrder : 'desc'}
                  onClick={() => handleHealthSort(col.key)}
                  sx={analyticsTableSortLabelSx}
                >
                  {col.label}
                </TableSortLabel>
              </Box>
            ))}
          </Box>
          {sortedHealth.map((h, i) => (
            <Box
              key={i}
              sx={styles.tableRow}
            >
              <Box
                sx={[
                  styles.tableCellValue,
                  { flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' },
                ]}
              >
                <Box sx={styles.eventDot(EVENT_TYPE_COLORS[h.event_type] || palette.status.draft)} />
                <Typography variant="bodySmall">{h.event_type}</Typography>
              </Box>
              <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                {AnalyticCommonHelpers.fmtNum(h.total)}
              </Typography>
              <Typography
                sx={[
                  styles.tableCellValue,
                  { flex: 1, color: h.errors > 0 ? palette.status.rejected : undefined },
                ]}
              >
                {h.errors}
              </Typography>
              <Typography
                sx={[
                  styles.tableCellValue,
                  { flex: 1, color: h.error_rate > 5 ? palette.status.rejected : undefined },
                ]}
              >
                {h.error_rate}%
              </Typography>
              <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                {AnalyticCommonHelpers.fmtDuration(h.avg_duration_ms)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

AnalyticsHealth.displayName = 'AnalyticsHealth';

/** @type {MuiSx} */
const analyticsHealthStyles = () => ({
  eventDot: color => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  healthContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginBottom: '0.5rem',
    display: 'block',
  }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: 200 },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics || palette.text.disabled,
    textTransform: 'uppercase',
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default AnalyticsHealth;

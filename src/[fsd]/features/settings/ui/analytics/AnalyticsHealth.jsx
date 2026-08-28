import { memo, useMemo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';

const AnalyticsHealth = memo(props => {
  const { health = [], daily_activity = [] } = props;

  const styles = analyticsHealthStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

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
      {errorTrend.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
            data-testid="analytics-health-chart-title"
          >
            Requests vs Errors
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
            data-testid="analytics-health-chart-subtitle"
          >
            Total requests trend with error overlay
          </Typography>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-health-chart-container"
          >
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
                <RechartsTooltip content={<ChartTooltip testId="analytics-health-chart-tooltip" />} />
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
          data-testid="analytics-health-table-title"
        >
          Health by Event Type
        </Typography>
        <Box sx={styles.tableWrapper}>
          <Box
            sx={styles.tableHeader}
            data-testid="analytics-health-table-header"
          >
            <Typography
              sx={[styles.tableCell, { flex: 2 }]}
              data-testid="analytics-health-table-header-cell"
            >
              Event Type
            </Typography>
            <Typography
              sx={[styles.tableCell, { flex: 1 }]}
              data-testid="analytics-health-table-header-cell"
            >
              Total
            </Typography>
            <Typography
              sx={[styles.tableCell, { flex: 1 }]}
              data-testid="analytics-health-table-header-cell"
            >
              Errors
            </Typography>
            <Typography
              sx={[styles.tableCell, { flex: 1 }]}
              data-testid="analytics-health-table-header-cell"
            >
              Error Rate
            </Typography>
            <Typography
              sx={[styles.tableCell, { flex: 1 }]}
              data-testid="analytics-health-table-header-cell"
            >
              Avg Latency
            </Typography>
          </Box>
          {health.map((h, i) => (
            <Box
              key={i}
              sx={styles.tableRow}
              data-testid="analytics-health-row"
            >
              <Box
                sx={[
                  styles.tableCellValue,
                  { flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' },
                ]}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor:
                      AnalyticsCommonConstants.EVENT_TYPE_COLORS[h.event_type] || palette.status.draft,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="bodySmall"
                  data-testid="analytics-health-row-event-type"
                >
                  {h.event_type}
                </Typography>
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
  healthContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
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
    borderBottom: `1px solid ${palette.border.table}`,
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
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.conversation?.hover },
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

import { memo, useCallback, useMemo, useState } from 'react';

import { format, parseISO, subDays } from 'date-fns';
import {
  Area,
  AreaChart,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, CircularProgress, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip } from '@/[fsd]/features/settings/ui/analytics';
import { EVENT_TYPE_COLORS } from '@/[fsd]/shared/config/theme';
import { Select } from '@/[fsd]/shared/ui';
import { useAnalyticsActivityQuery } from '@/api';

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const formatPeriod = (bucket, granularity) => {
  const start = parseISO(bucket.bucket_start);
  if (granularity === 'month') return format(start, 'MMMM yyyy');
  if (granularity === 'week') {
    // The backend reports the bucket as [start, end); the last day the reader cares about is end - 1
    return `${format(start, 'MMM d')} – ${format(subDays(parseISO(bucket.bucket_end), 1), 'MMM d, yyyy')}`;
  }
  return format(start, 'MMM d, yyyy');
};

// Axis ticks drop the year the way the sibling charts do — the date filter above states the range
const formatAxisLabel = (bucket, granularity) => {
  const start = parseISO(bucket.bucket_start);
  if (granularity === 'month') return format(start, 'MMM yyyy');
  return format(start, 'MMM d');
};

const AnalyticsActivity = memo(props => {
  const { projectId, dateFrom, dateTo, isPersonalProject = false } = props;

  const [roles, setRoles] = useState([]);
  const [granularity, setGranularity] = useState('day');

  const { data, isFetching, isError } = useAnalyticsActivityQuery(
    { projectId, dateFrom, dateTo, granularity, roles },
    { skip: !projectId },
  );

  // Format from the granularity the payload was built with, not the picker: `data` keeps the
  // previous args' result while the new one is in flight
  const dataGranularity = data?.granularity ?? granularity;

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = AnalyticCommonHelpers.axisTick(axisStroke);

  // Role options come from the same response as the trend — the dedicated roles endpoint is gated
  // behind a permission analytics viewers do not hold, so an empty list means "unknown" here.
  const roleOptions = useMemo(
    () => (data?.available_roles || []).map(role => ({ label: role, value: role })),
    [data?.available_roles],
  );

  const chartData = useMemo(
    () =>
      (data?.buckets || []).map(bucket => ({
        axisLabel: formatAxisLabel(bucket, dataGranularity),
        active_users: bucket.active_users ?? 0,
        ai_active_users: bucket.ai_active_users ?? 0,
      })),
    [data?.buckets, dataGranularity],
  );

  const handleGranularityChange = useCallback((_, next) => {
    if (next) setGranularity(next);
  }, []);

  const styles = analyticsActivityStyles();

  if (isFetching && !data) {
    return (
      <Box sx={styles.centered}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.centered}>
        <Typography color="error">Failed to load activity analytics. Please try again later.</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const buckets = data.buckets ?? [];

  return (
    <Box sx={styles.container}>
      <Box sx={styles.chartCard}>
        <Box sx={styles.headerRow}>
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
              data-testid="analytics-activity-title"
            >
              Active Users Trend
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              Distinct people active per period, against those who used AI
            </Typography>
          </Box>
          <Box sx={styles.controls}>
            {!isPersonalProject && (
              <Select.SingleSelect
                options={roleOptions}
                value={roles}
                onValueChange={setRoles}
                label="Role"
                showBorder
                multiple
                showEmptyPlaceholder={false}
                disabled={roleOptions.length === 0}
                sx={styles.roleSelect}
                data-testid="analytics-activity-role-select"
              />
            )}
            <ToggleButtonGroup
              value={granularity}
              exclusive
              size="small"
              onChange={handleGranularityChange}
              sx={styles.toggleGroup}
              data-testid="analytics-activity-granularity-toggle"
            >
              {GRANULARITY_OPTIONS.map(option => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  sx={styles.toggleButton}
                  data-testid={`analytics-activity-granularity-${option.value}`}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {chartData.length > 0 ? (
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <AreaChart data={chartData}>
                <XAxis
                  dataKey="axisLabel"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                {/* One axis for both series: AI-active users are a subset of active users, so a
                    shared scale is what makes the gap between the lines readable */}
                <YAxis
                  allowDecimals={false}
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '0.6875rem' }}
                  iconType="circle"
                  iconSize={8}
                />
                {!isPersonalProject && (
                  <Area
                    type="monotone"
                    dataKey="active_users"
                    name="Active Users"
                    stroke={EVENT_TYPE_COLORS.api}
                    fill={EVENT_TYPE_COLORS.api}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="ai_active_users"
                  name="AI Active Users"
                  stroke={EVENT_TYPE_COLORS.llm}
                  fill={EVENT_TYPE_COLORS.llm}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Typography
            variant="bodyMedium"
            sx={styles.noDataText}
            data-testid="analytics-activity-empty"
          >
            No activity is available for the selected date range and filters.
          </Typography>
        )}
      </Box>

      {buckets.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Activity by Period
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box
              sx={styles.tableHeader}
              data-testid="analytics-activity-table-header"
            >
              <Typography sx={[styles.tableCell, { flex: 2 }]}>Period</Typography>
              {!isPersonalProject && (
                <Typography sx={[styles.tableCell, { flex: 1 }]}>Active Users</Typography>
              )}
              <Typography sx={[styles.tableCell, { flex: 1 }]}>AI Active Users</Typography>
            </Box>
            {buckets.map(bucket => (
              <Box
                key={bucket.bucket_start}
                sx={styles.tableRow}
                data-testid="analytics-activity-row"
              >
                <Typography sx={[styles.tableCellValue, { flex: 2 }]}>
                  {formatPeriod(bucket, dataGranularity)}
                </Typography>
                {!isPersonalProject && (
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(bucket.active_users)}
                  </Typography>
                )}
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(bucket.ai_active_users)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

AnalyticsActivity.displayName = 'AnalyticsActivity';

/** @type {MuiSx} */
const analyticsActivityStyles = () => ({
  centered: { display: 'flex', justifyContent: 'center', padding: '2rem' },
  noDataText: ({ palette }) => ({ color: palette.text.metrics, padding: '1rem' }),
  container: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
    display: 'block',
  }),
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  controls: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  roleSelect: { minWidth: '12rem' },
  toggleGroup: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.default}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleButton: ({ palette }) => ({
    border: 'none',
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    textTransform: 'none',
    color: palette.text.secondary,
    '&.Mui-selected': {
      color: palette.text.primary,
      backgroundColor: palette.background.surface.interactive.selected,
    },
  }),
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: '12.5rem' },
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
    color: palette.text.metrics,
    textTransform: 'uppercase',
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default AnalyticsActivity;

import { memo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';

import { useAnalyticsToolDetailQuery } from '@/[fsd]/features/analytics/api';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/analytics/ui';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

const AnalyticsToolDetailed = memo(props => {
  const { projectId, toolName, dateFrom, dateTo, onBack } = props;

  const styles = analyticsToolDetailedStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { data, isFetching } = useAnalyticsToolDetailQuery(
    { projectId, toolName, dateFrom, dateTo },
    { skip: !projectId || !toolName },
  );

  if (isFetching)
    return (
      <Box sx={styles.loadingState}>
        <CircularProgress size={32} />
      </Box>
    );

  if (!data)
    return (
      <Box sx={styles.emptyState}>
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No data found.
        </Typography>
      </Box>
    );

  const { kpis, users = [], agents = [], daily_usage = [] } = data;

  return (
    <Box sx={styles.toolDetailedContent}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <IconButton
          onClick={onBack}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          {toolName}
        </Typography>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="Total Calls"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_calls)}
        />
        <KPICard
          label="Unique Users"
          value={AnalyticCommonHelpers.fmtNum(kpis.unique_users)}
        />
        <KPICard
          label="Avg Latency"
          value={AnalyticCommonHelpers.fmtDuration(kpis.avg_duration_ms)}
        />
        <KPICard
          label="Errors"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
        />
        <KPICard
          label="Error Rate"
          value={`${kpis.error_rate}%`}
          color={kpis.error_rate > 5 ? palette.status.rejected : undefined}
        />
      </Box>

      {daily_usage.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Usage
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <AreaChart data={daily_usage}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={d => d?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="calls"
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
                  yAxisId="calls"
                  type="monotone"
                  dataKey="calls"
                  name="Calls"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="errors"
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke={palette.status.rejected}
                  fill={palette.status.rejected}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Users
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {users.length} users called this tool
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Avg Latency</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {users.map((u, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {u.user_email || `User ${u.user_id}`}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(u.calls)}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtDuration(u.avg_duration_ms)}
                  </Typography>
                  <Typography
                    sx={[
                      styles.tableCellValue,
                      { flex: 1, color: u.errors > 0 ? palette.status.rejected : undefined },
                    ]}
                  >
                    {u.errors}
                  </Typography>
                </Box>
              ))}
              {!users.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No user data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Agents
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {agents.length} agents used this tool
          </Typography>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>Agent</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {agents.map((a, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {a.entity_name}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(a.calls)}
                  </Typography>
                </Box>
              ))}
              {!agents.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No agent data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

AnalyticsToolDetailed.displayName = 'AnalyticsToolDetailed';

/** @type {MuiSx} */
const analyticsToolDetailedStyles = () => ({
  toolDetailedContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem' },
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
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
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
  fixedScrollList: { height: 300, overflowY: 'auto', overflowX: 'hidden' },
});

export default AnalyticsToolDetailed;

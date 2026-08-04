import { memo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';

import { useAnalyticsAgentDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/settings/ui/analytics';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

const AnalyticAgentDetailed = memo(props => {
  const { projectId, entityId, dateFrom, dateTo, onBack } = props;

  const styles = analyticsAgentDetailedStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { data, isFetching } = useAnalyticsAgentDetailQuery(
    { projectId, entityId, dateFrom, dateTo },
    { skip: !projectId || !entityId },
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

  const { entity_name, kpis, users = [], tools = [], daily_usage = [] } = data;

  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.agentDetail;

  return (
    <Box sx={styles.agentDetailedContent}>
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
          {entity_name}
        </Typography>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="TOTAL RUNS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_events)}
          tooltip={tt.TOTAL_RUNS}
        />
        <KPICard
          label="UNIQUE USERS"
          value={AnalyticCommonHelpers.fmtNum(kpis.unique_users)}
          tooltip={tt.UNIQUE_USERS}
        />
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.llm_cost)}
          subtitle="estimated"
          tooltip={tt.TOTAL_COST}
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          tooltip={tt.TOTAL_TOKENS}
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.input_tokens)}
          tooltip={tt.INPUT_TOKENS}
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.output_tokens)}
          tooltip={tt.OUTPUT_TOKENS}
        />
        <KPICard
          label="AVG LATENCY"
          value={AnalyticCommonHelpers.fmtDuration(kpis.avg_duration_ms)}
          tooltip={tt.AVG_LATENCY}
        />
        <KPICard
          label="ERRORS"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
          tooltip={tt.ERRORS}
        />
      </Box>

      {daily_usage.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Runs by Day
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
                  yAxisId="runs"
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
                  yAxisId="runs"
                  type="monotone"
                  dataKey="events"
                  name="Runs"
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
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {users.length} users used this agent / pipeline
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.USERS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Runs</Typography>
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
                    {AnalyticCommonHelpers.fmtNum(u.events)}
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
                  No runs recorded
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
            Tools
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {tools.length} tools used by this agent / pipeline
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.TOOLS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box sx={styles.tableWrapper}>
            <Box sx={styles.tableHeader}>
              <Typography sx={[styles.tableCell, { flex: 3 }]}>Tool</Typography>
              <Typography sx={[styles.tableCell, { flex: 1 }]}>Calls</Typography>
            </Box>
            <Box sx={styles.fixedScrollList}>
              {tools.map((t, i) => (
                <Box
                  key={i}
                  sx={styles.tableRow}
                >
                  <Typography
                    sx={[styles.tableCellValue, { flex: 3 }]}
                    noWrap
                  >
                    {t.tool_name}
                  </Typography>
                  <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                    {AnalyticCommonHelpers.fmtNum(t.calls)}
                  </Typography>
                </Box>
              ))}
              {!tools.length && (
                <Typography
                  variant="bodySmall"
                  sx={styles.emptyText}
                >
                  No tool data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

AnalyticAgentDetailed.displayName = 'AnalyticAgentDetailed';

/** @type {MuiSx} */
const analyticsAgentDetailedStyles = () => ({
  agentDetailedContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
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
  }),
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
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
    '&:hover': { backgroundColor: palette.background.conversation?.hover || 'rgba(255,255,255,0.02)' },
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

export default AnalyticAgentDetailed;

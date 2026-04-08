import { memo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';

import { useAnalyticsUserDetailQuery } from '@/[fsd]/features/analytics/api';
import { AnalyticsCommonConstants } from '@/[fsd]/features/analytics/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/analytics/ui';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

const AnalyticsUserDetailed = memo(props => {
  const { projectId, userId, dateFrom, dateTo, onBack } = props;

  const styles = analyticsUserDetailedStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { data, isFetching } = useAnalyticsUserDetailQuery(
    { projectId, userId, dateFrom, dateTo },
    { skip: !projectId || !userId },
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

  const { kpis, models = [], tools = [], agents = [], daily_activity = [] } = data;

  return (
    <Box sx={styles.userDetailedContent}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
          {data.user_email}
        </Typography>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="LLM Calls"
          value={AnalyticCommonHelpers.fmtNum(kpis.llm_events)}
        />
        <KPICard
          label="Tool Calls"
          value={AnalyticCommonHelpers.fmtNum(kpis.tool_events)}
        />
        <KPICard
          label="Chat Msg"
          value={AnalyticCommonHelpers.fmtNum(kpis.chat_events)}
        />
        <KPICard
          label="Agent Runs"
          value={AnalyticCommonHelpers.fmtNum(kpis.agent_events)}
        />
        <KPICard
          label="Active Days"
          value={String(kpis.active_days)}
        />
        <KPICard
          label="Errors"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
        />
      </Box>

      {daily_activity.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Activity
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Events by type per day
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <AreaChart data={daily_activity}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={d => d?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="left"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="llm"
                  name="LLM"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tool"
                  name="Tool"
                  stroke={palette.status.published}
                  fill={palette.status.published}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="chat"
                  name="Chat Msg"
                  stroke={palette.status.userApproval}
                  fill={palette.status.userApproval}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="agent"
                  name="Agent"
                  stroke={palette.status.onModeration}
                  fill={palette.status.onModeration}
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
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' },
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Models Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {models.length} models
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {models.length > 0 ? (
              models.map((m, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor:
                        AnalyticsCommonConstants.CHART_COLORS[
                          i % AnalyticsCommonConstants.CHART_COLORS.length
                        ],
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {m.display_name || m.model_name || 'Unknown Model'}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.listItemCount}
                  >
                    {AnalyticCommonHelpers.fmtNum(m.calls)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No model usage
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Tools Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {tools.length} tools
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {tools.length > 0 ? (
              tools.map((t, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {t.tool_name}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.listItemCount}
                  >
                    {AnalyticCommonHelpers.fmtNum(t.calls)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No tool usage
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Agents Used
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            {agents.length} agents
          </Typography>
          <Box sx={styles.fixedScrollList}>
            {agents.length > 0 ? (
              agents.map((a, i) => (
                <Box
                  key={i}
                  sx={styles.listItem}
                >
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {a.entity_name}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.listItemCount}
                  >
                    {a.runs}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="bodySmall"
                sx={styles.emptyText}
              >
                No agent activity
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

AnalyticsUserDetailed.displayName = 'AnalyticsUserDetailed';

/** @type {MuiSx} */
const analyticsUserDetailedStyles = () => ({
  userDetailedContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
  listItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0',
    borderBottom: `1px solid ${palette.border.table}`,
    minWidth: 0,
    '&:last-child': { borderBottom: 'none' },
  }),
  listItemCount: ({ palette }) => ({ color: palette.text.primary }),
  fixedScrollList: { height: 300, overflowY: 'auto', overflowX: 'hidden' },
});

export default AnalyticsUserDetailed;

import { memo, useMemo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/analytics/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { ChartTooltip, KPICard, ModelUsageTable } from '@/[fsd]/features/analytics/ui';

const AnalyticsOverview = memo(props => {
  const { data, onUserClick } = props;

  const styles = analyticsOverviewStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const { kpis, top_ai_users = [], daily_activity = [], models = [] } = data;

  const totalModelCalls = useMemo(() => models.reduce((s, m) => s + m.calls, 0), [models]);

  return (
    <Box sx={styles.overviewContent}>
      <Box sx={styles.kpiRow}>
        <KPICard
          label="TEAM"
          value={AnalyticCommonHelpers.fmtNum(kpis.unique_users)}
          valueSuffix={`of ${AnalyticCommonHelpers.fmtNum(kpis.total_project_users)}`}
          subtitle="active members"
        />
        <KPICard
          label="AI ACTIVE"
          value={AnalyticCommonHelpers.fmtNum(kpis.ai_active_users)}
          badge={kpis.adoption_rate > 0 ? `↑${kpis.adoption_rate}%` : undefined}
          subtitle={`${kpis.adoption_rate}% adoption`}
        />
        <KPICard
          label="LLM CALLS"
          value={AnalyticCommonHelpers.fmtNum(kpis.llm_calls)}
          subtitle="event_type = llm"
        />
        <KPICard
          label="TOOL RUNS"
          value={AnalyticCommonHelpers.fmtNum(kpis.tool_runs)}
          subtitle="event_type = tool"
        />
        <KPICard
          label="CHAT MSG"
          value={AnalyticCommonHelpers.fmtNum(kpis.chat_msgs)}
          subtitle="user messages sent"
        />
        <KPICard
          label="AGENT RUNS"
          value={AnalyticCommonHelpers.fmtNum(kpis.agent_runs)}
          subtitle="agents and pipelines interactions"
        />
      </Box>

      <Box sx={styles.chartsRowEqual}>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Daily Activity
          </Typography>
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height="100%"
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
                  yAxisId="events"
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  yAxisId="users"
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
                  name="Events"
                  stroke={palette.status.draft}
                  fill={palette.status.draft}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="users"
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke={palette.status.published}
                  fill={palette.status.published}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Top 5 AI Adopters
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Leaderboard by AI events (LLM + Tool + Agent)
          </Typography>

          {top_ai_users.length > 0 ? (
            <Box sx={styles.tableWrapper}>
              {top_ai_users.map((u, i) => (
                <Box
                  key={i}
                  sx={[
                    styles.leaderboardRow,
                    onUserClick && {
                      cursor: 'pointer',
                      '&:hover': ({ palette: muiPalette }) => ({
                        backgroundColor: muiPalette.background.conversation?.hover,
                      }),
                    },
                  ]}
                  onClick={() => onUserClick?.(u.user_id)}
                >
                  <Typography sx={styles.leaderboardRank}>{i + 1}</Typography>
                  <Box
                    sx={[
                      styles.leaderboardAvatar,
                      {
                        backgroundColor:
                          i < 3
                            ? AnalyticsCommonConstants.MEDAL_COLORS[i]
                            : AnalyticsCommonConstants.CHART_COLORS[
                                (i - 3) % AnalyticsCommonConstants.CHART_COLORS.length
                              ],
                      },
                    ]}
                  >
                    <Typography sx={styles.leaderboardInitial}>
                      {(u.user_email || '?')[0].toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="bodySmall"
                      noWrap
                      sx={[
                        styles.leaderboardEmail,
                        onUserClick && { '&:hover': { textDecoration: 'underline' } },
                      ]}
                    >
                      {u.user_email}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      sx={styles.leaderboardStats}
                    >
                      {AnalyticCommonHelpers.fmtNum(u.llm_calls)} LLM &middot;{' '}
                      {AnalyticCommonHelpers.fmtNum(u.tool_runs)} Tool &middot;{' '}
                      {AnalyticCommonHelpers.fmtNum(u.agent_runs)} Agent
                    </Typography>
                  </Box>
                  <Typography
                    variant="bodyMedium"
                    sx={styles.leaderboardScore}
                  >
                    {AnalyticCommonHelpers.fmtNum(u.ai_events)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No AI activity data.
            </Typography>
          )}
        </Box>
      </Box>

      <ModelUsageTable
        models={models}
        totalCalls={totalModelCalls}
      />
    </Box>
  );
});

/** @type {MuiSx} */
const analyticsOverviewStyles = () => ({
  overviewContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' },
  chartsRowEqual: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
    alignItems: 'stretch',
  },
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
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  leaderboardRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  leaderboardRank: ({ palette }) => ({
    width: '1.25rem',
    textAlign: 'center',
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: palette.text.metrics || palette.text.disabled,
  }),
  leaderboardAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leaderboardInitial: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 700,
    color: palette.text.button.primary,
    lineHeight: 1,
  }),
  leaderboardEmail: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    display: 'block',
  }),
  leaderboardStats: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    display: 'block',
    marginTop: '0.125rem',
  }),
  leaderboardScore: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 700,
    fontSize: '0.9375rem',
    flexShrink: 0,
  }),
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

AnalyticsOverview.displayName = 'AnalyticsOverview';

export default AnalyticsOverview;

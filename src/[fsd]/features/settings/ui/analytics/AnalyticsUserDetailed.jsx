import { memo } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';

import { useAnalyticsUserDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/settings/ui/analytics';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
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
      <Box
        sx={styles.loadingState}
        data-testid="analytics-user-detail-loading-indicator"
      >
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

  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.userDetail;

  return (
    <Box sx={styles.userDetailedContent}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <IconButton
          onClick={onBack}
          size="small"
          data-testid="analytics-user-detail-back-button"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
          data-testid="analytics-user-detail-title"
        >
          {data.user_email}
        </Typography>
      </Box>

      <Box sx={styles.kpiRow}>
        <KPICard
          label="ACTIVE DAYS"
          value={String(kpis.active_days)}
          tooltip={tt.ACTIVE_DAYS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="LLM CALLS"
          value={AnalyticCommonHelpers.fmtNum(kpis.llm_events)}
          tooltip={tt.LLM_CALLS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="TOOL CALLS"
          value={AnalyticCommonHelpers.fmtNum(kpis.tool_events)}
          tooltip={tt.TOOL_CALLS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="AGENT & PIPELINE RUNS"
          value={AnalyticCommonHelpers.fmtNum(kpis.agent_events)}
          tooltip={tt.AGENT_PIPELINE_RUNS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="CHAT MSG"
          value={AnalyticCommonHelpers.fmtNum(kpis.chat_events)}
          tooltip={tt.CHAT_MSG}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="ERRORS"
          value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
          color={kpis.errors > 0 ? palette.status.rejected : undefined}
          tooltip={tt.ERRORS}
          testId="analytics-user-detail-kpi-card"
          valueTestId="analytics-user-detail-kpi-errors-value"
        />
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
          tooltip={tt.TOTAL_TOKENS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.input_tokens)}
          tooltip={tt.INPUT_TOKENS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(kpis.output_tokens)}
          tooltip={tt.OUTPUT_TOKENS}
          testId="analytics-user-detail-kpi-card"
        />
        <KPICard
          label="TOTAL COST"
          value={AnalyticCommonHelpers.fmtCost(kpis.llm_cost)}
          subtitle="estimated"
          tooltip={tt.TOTAL_COST}
          testId="analytics-user-detail-kpi-card"
        />
      </Box>

      {daily_activity.length > 0 && (
        <Box sx={styles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
            data-testid="analytics-user-detail-chart-title"
          >
            Daily Activity
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
              data-testid="analytics-user-detail-chart-subtitle"
            >
              Events by type per day
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.DAILY_ACTIVITY,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-user-detail-chart-container"
          >
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
                <RechartsTooltip
                  content={tooltipProps => (
                    <ChartTooltip
                      {...tooltipProps}
                      testId="analytics-user-detail-chart-tooltip"
                    />
                  )}
                />
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
        <Box
          sx={styles.chartCard}
          data-testid="analytics-user-detail-models-panel"
        >
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
        <Box
          sx={styles.chartCard}
          data-testid="analytics-user-detail-tools-panel"
        >
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Tools Used
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {tools.length} tools
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.TOOLS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
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
        <Box
          sx={styles.chartCard}
          data-testid="analytics-user-detail-agents-panel"
        >
          <Typography
            variant="labelMedium"
            sx={styles.chartTitle}
          >
            Agents & Pipelines Used
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {agents.length} agents & pipelines
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: tt.AGENTS_SECTION,
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
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
                No agent or pipeline activity
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

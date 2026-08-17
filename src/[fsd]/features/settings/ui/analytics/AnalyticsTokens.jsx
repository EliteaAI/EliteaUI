import { memo, useMemo } from 'react';

import { Bar, BarChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { ChartTooltip, KPICard } from '@/[fsd]/features/settings/ui/analytics';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import { useAnalyticsCostsQuery } from '@/api';

const NO_TOKENS_MSG = 'No token usage is available for the selected date range.';

const getNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);

const getTokenStats = item => {
  const input = getNumber(
    item?.input_tokens ??
      item?.total_input_tokens ??
      item?.input_token ??
      item?.prompt_tokens ??
      item?.total_prompt_tokens ??
      item?.input,
  );
  const output = getNumber(
    item?.output_tokens ??
      item?.total_output_tokens ??
      item?.output_token ??
      item?.completion_tokens ??
      item?.total_completion_tokens ??
      item?.output,
  );
  const totalCandidate = item?.total_tokens ?? item?.tokens_total ?? item?.total;
  const total = Number.isFinite(Number(totalCandidate)) ? Number(totalCandidate) : input + output;
  return { total, input, output };
};

const toPercentage = (value, total) => (total > 0 ? (value / total) * 100 : 0);

const AnalyticsTokens = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = AnalyticCommonHelpers.axisTick(axisStroke);

  const { data, isFetching, isError } = useAnalyticsCostsQuery(
    { projectId, dateFrom, dateTo },
    { skip: !projectId },
  );

  const totalProjectTokens = getNumber(data?.kpis?.total_tokens);

  const userTableData = useMemo(
    () =>
      [...(data?.by_user || [])]
        .map(user => {
          const tokens = getTokenStats(user);
          return {
            name:
              user.user_display_name ||
              user.user_email ||
              `User ${user.user_id ?? ''}`.trim() ||
              'Unknown user',
            ...tokens,
            share: toPercentage(tokens.total, totalProjectTokens),
          };
        })
        .sort((a, b) => b.total - a.total),
    [data?.by_user, totalProjectTokens],
  );

  const modelTableData = useMemo(
    () =>
      [...(data?.by_model || [])]
        .map(model => {
          const tokens = getTokenStats(model);
          return {
            name: model.display_name || model.model_name || 'Unknown model',
            ...tokens,
            share: toPercentage(tokens.total, totalProjectTokens),
          };
        })
        .sort((a, b) => b.total - a.total),
    [data?.by_model, totalProjectTokens],
  );

  const agentTableData = useMemo(
    () =>
      [...(data?.by_agent || [])]
        .map(agent => {
          const tokens = getTokenStats(agent);
          return {
            name: agent.entity_name || agent.display_name || 'Unattributed',
            ...tokens,
            share: toPercentage(tokens.total, totalProjectTokens),
          };
        })
        .sort((a, b) => b.total - a.total),
    [data?.by_agent, totalProjectTokens],
  );

  const dailyChartData = useMemo(
    () =>
      (data?.daily || []).map(day => {
        const tokens = getTokenStats(day);
        return {
          date: day.date,
          total_tokens: tokens.total,
          input_tokens: tokens.input,
          output_tokens: tokens.output,
        };
      }),
    [data?.daily],
  );

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
        <Typography color="error">Failed to load token analytics. Please try again later.</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const kpis = data.kpis ?? {};
  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.tokens;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.kpiRow}>
        <KPICard
          label="TOTAL TOKENS"
          value={AnalyticCommonHelpers.fmtNum(getNumber(kpis.total_tokens))}
          subtitle="input + output tokens"
          tooltip={tt.TOTAL_TOKENS}
        />
        <KPICard
          label="INPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(getNumber(kpis.total_input_tokens))}
          subtitle="prompt tokens"
          tooltip={tt.INPUT_TOKENS}
        />
        <KPICard
          label="OUTPUT TOKENS"
          value={AnalyticCommonHelpers.fmtNum(getNumber(kpis.total_output_tokens))}
          subtitle="completion tokens"
          tooltip={tt.OUTPUT_TOKENS}
        />
      </Box>

      <Box sx={styles.chartCard}>
        <Typography
          variant="labelMedium"
          sx={styles.chartTitle}
        >
          Daily Token Usage
        </Typography>
        <Box sx={styles.subtitleRow}>
          <Typography
            variant="bodySmall"
            sx={styles.chartSubtitle}
          >
            Token usage per day
          </Typography>
          <InfoTooltip
            infoTooltip={{
              title: tt.DAILY_TOKEN_USAGE,
              icon: { width: 12, height: 12 },
            }}
          />
        </Box>
        {dailyChartData.length > 0 ? (
          <Box sx={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={dailyChartData}>
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickFormatter={value => value?.slice(5)}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="total_tokens"
                  name="Total Tokens"
                  fill={AnalyticsCommonConstants.CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="input_tokens"
                  name="Input Tokens"
                  fill={AnalyticsCommonConstants.CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="output_tokens"
                  name="Output Tokens"
                  fill={AnalyticsCommonConstants.CHART_COLORS[2]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={styles.noDataText}
          >
            {NO_TOKENS_MSG}
          </Typography>
        )}
      </Box>

      <TokenTable
        title="Token Usage by User"
        subtitleTooltip={tt.BY_USER}
        nameHeader="USER"
        rows={userTableData}
        emptyState={NO_TOKENS_MSG}
      />
      <TokenTable
        title="Token Usage by Model"
        subtitleTooltip={tt.BY_MODEL}
        nameHeader="MODEL"
        rows={modelTableData}
        emptyState={NO_TOKENS_MSG}
      />
      <TokenTable
        title="Token Usage by Agent & Pipeline"
        subtitleTooltip={tt.BY_AGENT_PIPELINE}
        nameHeader="AGENT / PIPELINE"
        rows={agentTableData}
        emptyState={NO_TOKENS_MSG}
      />
    </Box>
  );
});

const TokenTable = memo(props => {
  const { title, subtitleTooltip, nameHeader, rows, emptyState } = props;

  return (
    <Box sx={styles.chartCard}>
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="labelMedium"
          sx={[styles.chartTitle, { marginBottom: 0 }]}
        >
          {title}
        </Typography>
        <InfoTooltip
          infoTooltip={{
            title: subtitleTooltip,
            icon: { width: 12, height: 12 },
          }}
        />
      </Box>
      {rows.length > 0 ? (
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, styles.nameCell]}>{nameHeader}</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>TOTAL TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>INPUT TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>OUTPUT TOKENS</Typography>
            <Typography sx={[styles.tableCell, styles.rightAlignedCell]}>SHARE</Typography>
          </Box>
          {rows.map((row, index) => (
            <Box
              key={`${row.name}-${index}`}
              sx={styles.tableRow}
            >
              <Typography
                sx={[styles.tableCellValue, styles.nameCell]}
                noWrap
              >
                {row.name}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.total)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.input)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {AnalyticCommonHelpers.fmtNum(row.output)}
              </Typography>
              <Typography sx={[styles.tableCellValue, styles.rightAlignedCell]}>
                {`${row.share.toFixed(1)}%`}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={styles.noDataText}
        >
          {emptyState}
        </Typography>
      )}
    </Box>
  );
});

TokenTable.displayName = 'TokenTable';
AnalyticsTokens.displayName = 'AnalyticsTokens';

const styles = {
  centered: { display: 'flex', justifyContent: 'center', p: 4 },
  noDataText: { p: 2 },
  container: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.5rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  subtitleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  chartWrapper: { width: '100%', overflow: 'hidden', height: 240 },
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
    gap: '0.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  nameCell: { flex: 3, textAlign: 'left' },
  rightAlignedCell: { flex: 1.25, textAlign: 'right' },
};

export default AnalyticsTokens;

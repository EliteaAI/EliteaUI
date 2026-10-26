import { memo } from 'react';

import { Box, CircularProgress, useTheme } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { KPICard } from '@/[fsd]/features/settings/ui/analytics';

const ChatKpiRow = memo(props => {
  const { kpis, isFetching, isPersonalProject } = props;

  const { palette } = useTheme();
  const styles = chatKpiRowStyles();

  if (isFetching) {
    return (
      <Box
        sx={styles.loading}
        data-testid="analytics-chats-kpi-row"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="analytics-chats-kpi-row"
    >
      <KPICard
        label="ACTIVE CHATS"
        value={AnalyticCommonHelpers.fmtNum(kpis.active_chats)}
        testId="analytics-chats-kpi-active-chats"
      />
      <KPICard
        label="TOTAL CHAT COST"
        value={AnalyticCommonHelpers.fmtCost(kpis.llm_cost)}
        subtitle="estimated"
        testId="analytics-chats-kpi-total-cost"
      />
      <KPICard
        label="TOTAL CHAT TOKENS"
        value={AnalyticCommonHelpers.fmtNum(kpis.total_tokens)}
        testId="analytics-chats-kpi-total-tokens"
      />
      <KPICard
        label="AI RESPONSES"
        value={AnalyticCommonHelpers.fmtNum(kpis.responses)}
        testId="analytics-chats-kpi-responses"
      />
      <KPICard
        label="AVG COST / CHAT"
        value={AnalyticCommonHelpers.fmtCost(kpis.avg_cost_per_chat)}
        subtitle="estimated"
        testId="analytics-chats-kpi-avg-cost-per-chat"
      />
      <KPICard
        label="AVG COST / RESPONSE"
        value={AnalyticCommonHelpers.fmtCost(kpis.avg_cost_per_response)}
        subtitle="estimated"
        testId="analytics-chats-kpi-avg-cost-per-response"
      />
      {!isPersonalProject && (
        <KPICard
          label="CHAT USERS"
          value={AnalyticCommonHelpers.fmtNum(kpis.users)}
          testId="analytics-chats-kpi-users"
        />
      )}
      <KPICard
        label="SHARE OF PROJECT COST"
        value={kpis.share_of_project_cost != null ? `${(kpis.share_of_project_cost * 100).toFixed(1)}%` : '-'}
        testId="analytics-chats-kpi-share"
      />
      <KPICard
        label="ERRORS"
        value={AnalyticCommonHelpers.fmtNum(kpis.errors)}
        color={kpis.errors > 0 ? palette.status.rejected : undefined}
        testId="analytics-chats-kpi-errors"
      />
    </Box>
  );
});

ChatKpiRow.displayName = 'ChatKpiRow';

/** @type {MuiSx} */
const chatKpiRowStyles = () => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
    gap: '1rem',
  },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
});

export default ChatKpiRow;

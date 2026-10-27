import { memo, useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticsUrlStateHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsChatDetailed } from '@/[fsd]/features/settings/ui/analytics';
import { useAnalyticsChatsSummaryQuery } from '@/api';

import ChatActivityTable from './components/ChatActivityTable';
import ChatDailyUsage from './components/ChatDailyUsage';
import ChatKpiRow from './components/ChatKpiRow';
import ChatParticipantTable from './components/ChatParticipantTable';
import ChatTopChart from './components/ChatTopChart';

const { ANALYTICS_SEARCH_PARAMS } = AnalyticsCommonConstants;

const AnalyticsChats = memo(props => {
  const { projectId, dateFrom, dateTo, isPersonalProject } = props;

  const styles = analyticsChatsStyles();

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get(ANALYTICS_SEARCH_PARAMS.chatId);

  const { data: summaryData, isFetching: summaryFetching } = useAnalyticsChatsSummaryQuery(
    { projectId, dateFrom, dateTo },
    { skip: !projectId },
  );

  const kpis = summaryData?.kpis || {};
  const byParticipantType = summaryData?.by_participant_type || [];

  const handleChatClick = useCallback(
    conversationUuid =>
      setSearchParams(previous =>
        AnalyticsUrlStateHelpers.updateAnalyticsSearchParams(previous, {
          [ANALYTICS_SEARCH_PARAMS.chatId]: conversationUuid,
        }),
      ),
    [setSearchParams],
  );

  const handleBack = useCallback(() => handleChatClick(null), [handleChatClick]);

  if (selectedChatId) {
    return (
      <AnalyticsChatDetailed
        projectId={projectId}
        conversationUuid={selectedChatId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
        isPersonalProject={isPersonalProject}
      />
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="analytics-tab-chats"
    >
      <ChatKpiRow
        kpis={kpis}
        isFetching={summaryFetching}
        isPersonalProject={isPersonalProject}
      />

      <Box sx={styles.twoColRow}>
        <ChatTopChart
          projectId={projectId}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onBarClick={handleChatClick}
        />
        <ChatParticipantTable rows={byParticipantType} />
      </Box>

      <ChatDailyUsage
        projectId={projectId}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <ChatActivityTable
        projectId={projectId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        isPersonalProject={isPersonalProject}
        onChatClick={handleChatClick}
      />
    </Box>
  );
});

AnalyticsChats.displayName = 'AnalyticsChats';

/** @type {MuiSx} */
const analyticsChatsStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  twoColRow: { display: 'flex', gap: '1rem', alignItems: 'stretch' },
});

export default AnalyticsChats;

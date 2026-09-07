import { memo, useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const DEFAULT_TAB = 'all';

const AgentRunHistory = memo(() => {
  const { tab, agentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const styles = getStyles();

  const handleRestoreConversation = useCallback(
    id => {
      navigate(
        NavigationHelpers.buildRoute(RouteDefinitions.ApplicationsDetail, {
          tab: tab ?? DEFAULT_TAB,
          agentId,
        }) + search,
        { state: { restoredConversationID: id } },
      );
    },
    [navigate, tab, agentId, search],
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        <RunHistoryContainer
          entityId={agentId}
          source={ParticipantEntityTypes.Agent}
          handleRestoreConversation={handleRestoreConversation}
          ChatMessageListComponent={ChatMessageList}
          prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
          shareOpensHistoryTab
        />
      </Box>
    </Box>
  );
});

AgentRunHistory.displayName = 'AgentRunHistory';

/** @type {MuiSx} */
const getStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
});

export default AgentRunHistory;

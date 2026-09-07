import { memo, useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useApplicationDetailsQuery } from '@/api/applications';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const DEFAULT_TAB = 'all';

const RunHistoryPage = memo(props => {
  const { source, detailRoute } = props;
  const { tab, agentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const projectId = useSelectedProjectId();
  const styles = getStyles();

  const { data } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: !projectId || !agentId },
  );
  const versions = data?.versions ?? [];

  const handleRestoreConversation = useCallback(
    id => {
      navigate(
        NavigationHelpers.buildRoute(detailRoute, {
          tab: tab ?? DEFAULT_TAB,
          agentId,
        }) + search,
        { state: { restoredConversationID: id } },
      );
    },
    [navigate, tab, agentId, detailRoute, search],
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
          source={source}
          versions={versions}
          handleRestoreConversation={handleRestoreConversation}
          ChatMessageListComponent={ChatMessageList}
          prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
          shareOpensHistoryTab
        />
      </Box>
    </Box>
  );
});

RunHistoryPage.displayName = 'RunHistoryPage';

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

export default RunHistoryPage;

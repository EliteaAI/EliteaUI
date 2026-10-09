import { memo, useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { NavigationConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useApplicationDetailsQuery } from '@/api/applications';
import { SearchParams } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const DEFAULT_TAB = 'all';

const RunHistoryPage = memo(props => {
  const { source, detailRoute, analyticsRoute } = props;
  const { tab, agentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const projectId = useSelectedProjectId();
  const styles = runHistoryPageStyles();

  const { data } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: !projectId || !agentId },
  );
  const versions = data?.versions ?? [];

  const handleRestoreConversation = useCallback(
    id => {
      const { VERSION_SEARCH_PARAM } = NavigationConstants;
      const params = new URLSearchParams(search);
      const version = params.get(VERSION_SEARCH_PARAM);
      params.delete(VERSION_SEARCH_PARAM);

      const query = params.toString();

      navigate(
        NavigationHelpers.buildRoute(version ? `${detailRoute}/:version` : detailRoute, {
          tab: tab ?? DEFAULT_TAB,
          agentId,
          version,
        }) + (query ? `?${query}` : ''),
        { state: { restoredConversationID: id } },
      );
    },
    [navigate, tab, agentId, detailRoute, search],
  );

  // The run travels as `history_run_id`, so the Run History breadcrumb (which forwards the search)
  // brings the user back with the same record selected
  const handleOpenAnalytics = useCallback(
    id => {
      const params = new URLSearchParams(search);
      params.set(SearchParams.HistoryRunId, String(id));

      navigate(
        `${NavigationHelpers.buildRoute(analyticsRoute, { tab: tab ?? DEFAULT_TAB, agentId })}?${params.toString()}`,
      );
    },
    [navigate, tab, agentId, analyticsRoute, search],
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
          handleOpenAnalytics={analyticsRoute ? handleOpenAnalytics : undefined}
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
const runHistoryPageStyles = () => ({
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

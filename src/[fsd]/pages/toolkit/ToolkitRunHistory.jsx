import { memo, useCallback, useEffect, useMemo } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { buildRunHistoryRowDecorator } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexRunRow.helpers';
import { useToolkitIndexRuns } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { IndexRunDetail } from '@/[fsd]/features/toolkits/indexes/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const ToolkitRunHistory = memo(() => {
  const { tab, toolkitId } = useParams();
  const [searchParams] = useSearchParams();
  const isMCP = searchParams.get('isMCP') === 'true';
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = getStyles();

  const goToToolkitsList = useCallback(() => {
    navigate(NavigationHelpers.buildRoute(RouteDefinitions.ToolkitsWithTab, { tab: tab ?? 'all' }));
  }, [navigate, tab]);

  const { isError, error } = useToolkitsDetailsQuery(
    { projectId, toolkitId },
    { skip: !projectId || !toolkitId },
  );

  // Scheduler-started runs create no conversation, so nothing else surfaces them.
  const { indexRunRows, indexRunLookup, isIndexRunsLoading } = useToolkitIndexRuns({
    projectId,
    toolkitId,
    skip: isMCP,
  });

  const decorateRow = useMemo(
    () => buildRunHistoryRowDecorator({ lookup: indexRunLookup, isLookupReady: !isIndexRunsLoading }),
    [indexRunLookup, isIndexRunsLoading],
  );

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  useEffect(() => {
    if (shouldShowNotFoundPage) goToToolkitsList();
  }, [shouldShowNotFoundPage, goToToolkitsList]);

  if (shouldShowNotFoundPage) return null;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        <RunHistoryContainer
          entityId={toolkitId}
          source={isMCP ? ParticipantEntityTypes.MCP : ParticipantEntityTypes.Toolkit}
          versions={null}
          ChatMessageListComponent={ChatMessageList}
          prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
          additionalRows={indexRunRows}
          decorateRow={isMCP ? null : decorateRow}
          DetailComponent={IndexRunDetail}
        />
      </Box>
    </Box>
  );
});

ToolkitRunHistory.displayName = 'ToolkitRunHistory';

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
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    gap: '1.5rem',
    overflow: 'hidden',
  },
  historyColumn: {
    flex: '0 0 24rem',
    minWidth: '20rem',
    maxWidth: '28rem',
    overflow: 'hidden',
  },
  chatColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatContainer: {
    height: '100%',
  },
});

export default ToolkitRunHistory;

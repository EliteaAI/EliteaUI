import { memo, useCallback, useEffect, useMemo } from 'react';

import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
  const { tab, toolkitId, mcpId } = useParams();
  const [searchParams] = useSearchParams();
  const entityId = mcpId ?? toolkitId;
  const isMCP = !!mcpId;
  const isLegacyMcpLink = !mcpId && searchParams.get('isMCP') === 'true';
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = getStyles();

  const goToList = useCallback(() => {
    const listRoute = isMCP ? RouteDefinitions.MCPsWithTab : RouteDefinitions.ToolkitsWithTab;
    navigate(NavigationHelpers.buildRoute(listRoute, { tab: tab ?? 'all' }));
  }, [isMCP, navigate, tab]);

  const { isError, error } = useToolkitsDetailsQuery(
    { projectId, toolkitId: entityId },
    { skip: !projectId || !entityId },
  );

  // Scheduler-started runs create no conversation, so nothing else surfaces them.
  const { indexRunRows, indexRunLookup, isIndexRunsLoading } = useToolkitIndexRuns({
    projectId,
    toolkitId: entityId,
    skip: isMCP || isLegacyMcpLink,
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
    if (shouldShowNotFoundPage) goToList();
  }, [shouldShowNotFoundPage, goToList]);

  if (isLegacyMcpLink) {
    const target = NavigationHelpers.buildRoute(RouteDefinitions.MCPRunHistory, {
      tab: tab ?? 'all',
      mcpId: toolkitId,
    });
    const preserved = new URLSearchParams(searchParams);
    preserved.delete('isMCP');
    const search = preserved.toString();
    return (
      <Navigate
        replace
        to={{ pathname: target, search: search ? `?${search}` : '' }}
      />
    );
  }

  if (shouldShowNotFoundPage) return null;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        <RunHistoryContainer
          entityId={entityId}
          source={isMCP ? ParticipantEntityTypes.MCP : ParticipantEntityTypes.Toolkit}
          versions={null}
          ChatMessageListComponent={ChatMessageList}
          prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
          additionalRows={indexRunRows}
          additionalRowsLoading={isIndexRunsLoading}
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

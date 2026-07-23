import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses, RUN_TEST_OPERATION_TYPES } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexBreadcrumb, IndexChatContainer, IndexHistory } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

const IndexHistoryPage = memo(() => {
  const { tab, toolkitId, indexName: rawIndexName } = useParams();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = indexHistoryPageStyles();

  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  const goBackToRunIndex = useCallback(() => {
    const target = RouteDefinitions.ToolkitIndex.replace(':tab', tab ?? 'all')
      .replace(':toolkitId', String(toolkitId))
      .replace(':indexName', rawIndexName ?? '');
    navigate(target);
  }, [navigate, tab, toolkitId, rawIndexName]);

  const goBackToToolkit = useCallback(() => {
    const target = RouteDefinitions.ToolkitDetail.replace(':tab', tab ?? 'all').replace(
      ':toolkitId',
      String(toolkitId),
    );
    navigate(target);
  }, [navigate, tab, toolkitId]);

  const goToToolkitsList = useCallback(() => {
    navigate(RouteDefinitions.ToolkitsWithTab.replace(':tab', tab ?? 'all'));
  }, [navigate, tab]);

  const indexName = useMemo(() => (rawIndexName ? decodeURIComponent(rawIndexName) : ''), [rawIndexName]);

  const {
    data: publicToolkitData,
    isError,
    error,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  useGetIndexesListQuery({ toolkitId, projectId }, { skip: !projectId || !toolkitId });

  const {
    data: indexesList,
    isLoading: indexesLoading,
    isFetching: indexesFetching,
    hasData,
  } = useSelector(selectIndexesList);

  const currentIndex = useMemo(() => {
    if (!hasData || !indexName) return null;
    return indexesList.find(idx => idx?.metadata?.collection === indexName) || null;
  }, [indexesList, indexName, hasData]);

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const baseHistory = useMemo(() => currentIndex?.metadata?.history || [], [currentIndex]);

  const { data: runHistoryData, isLoading: runHistoryLoading } = RunHistoryApi.useGetRunHistoryListQuery(
    {
      source: ParticipantEntityTypes.Toolkit,
      projectId,
      entityId: toolkitId,
      page: 0,
      pageSize: 100,
    },
    { skip: !projectId || !toolkitId },
  );

  const runTestHistoryItems = useMemo(() => {
    const rows = runHistoryData?.rows || [];
    if (!indexName) return [];
    return rows
      .filter(row => row.index_name === indexName && RUN_TEST_OPERATION_TYPES.has(row.operation_type))
      .map(row => {
        // Backend emits malformed ISO like "2026-07-20T11:52:57+00:00Z" (offset + trailing Z).
        // Strip the redundant Z when a numeric offset is present so Date() can parse it.
        const raw = typeof row.created_at === 'string' ? row.created_at : '';
        const normalized = raw.replace(/([+-]\d{2}:?\d{2})Z$/, '$1');
        const ms = new Date(normalized).getTime();
        return {
          state: IndexStatuses.runTest,
          updated_on: Number.isFinite(ms) ? Math.floor(ms / 1000) : null,
          conversation_id: row.id,
          operation_type: row.operation_type,
        };
      })
      .filter(item => Number.isFinite(item.updated_on));
  }, [runHistoryData, indexName]);

  const history = useMemo(() => [...baseHistory, ...runTestHistoryItems], [baseHistory, runTestHistoryItems]);

  const isLoading = indexesLoading || indexesFetching || !hasData || runHistoryLoading;

  const toggleFullScreenChat = useCallback(() => setIsFullScreenChat(prev => !prev), []);

  if (shouldShowNotFoundPage) return <Page404 />;

  const toolkitName = publicToolkitData?.name || '';

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={toolkitName}
            current="History"
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
            onIndexClick={goBackToRunIndex}
            indexName={indexName}
          />
        }
      />
      <Box sx={styles.content}>
        {isLoading ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
          </Box>
        ) : !currentIndex ? (
          <Box sx={styles.loading}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Index &quot;{indexName}&quot; was not found for this toolkit.
            </Typography>
          </Box>
        ) : history.length === 0 ? (
          <Box sx={styles.loading}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              No history is available for this index yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={styles.body}>
            <Box sx={styles.historyColumn}>
              <IndexHistory history={history} />
            </Box>
            <Box sx={styles.chatColumn}>
              <IndexChatContainer
                selectedModel={null}
                onSelectModel={() => null}
                modelList={[]}
                llmSettings={undefined}
                onSetLLMSettings={() => null}
                isFullScreenChat={isFullScreenChat}
                toggleFullScreenChat={toggleFullScreenChat}
                clearChat={() => null}
                chatHistory={[]}
                conversation={null}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
});

IndexHistoryPage.displayName = 'IndexHistoryPage';

/** @type {MuiSx} */
const indexHistoryPageStyles = () => ({
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
});

export default IndexHistoryPage;

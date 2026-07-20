import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexChatContainer, IndexHistory } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import IndexBreadcrumb from '@/pages/Toolkits/IndexBreadcrumb';
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

  const history = currentIndex?.metadata?.history || [];
  const isLoading = indexesLoading || indexesFetching || !hasData;

  const toggleFullScreenChat = useCallback(() => setIsFullScreenChat(prev => !prev), []);

  if (shouldShowNotFoundPage) return <Page404 />;

  const toolkitName = publicToolkitData?.name || '';

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <IndexBreadcrumb
          toolkitName={toolkitName}
          current="History"
          onToolkitsClick={goToToolkitsList}
          onToolkitClick={goBackToToolkit}
          onIndexClick={goBackToRunIndex}
          indexName={indexName}
        />
      </Box>
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
              llmSettings={null}
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
  );
});

IndexHistoryPage.displayName = 'IndexHistoryPage';

/** @type {MuiSx} */
const indexHistoryPageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
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

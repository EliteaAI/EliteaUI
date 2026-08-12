import { memo, useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, IconButton, Typography } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { RunHistoryChat, RunHistoryList } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { SearchParams } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const RunHistoryContainer = memo(props => {
  const {
    entityId,
    versions,
    source,
    handleRestoreConversation,
    onClose,
    ChatMessageListComponent,
    prettifyConversation,
  } = props;

  const projectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();

  const { isSmallWindow } = useIsSmallWindow();

  const [allConversations, setAllConversations] = useState([]);
  const [page, setPage] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const [fetchRunList, { data, isLoading, isFetching }] = RunHistoryApi.useLazyGetRunHistoryListQuery();

  useEffect(() => {
    const historyRunId = searchParams.get(SearchParams.HistoryRunId);

    if (historyRunId && allConversations.length > 0) {
      setSelectedHistoryItem(+historyRunId);
    } else if (!selectedHistoryItem && allConversations.length > 0) {
      setSelectedHistoryItem(allConversations[0].id);
    }
  }, [allConversations, searchParams, selectedHistoryItem]);

  useEffect(() => {
    if (projectId && entityId) {
      fetchRunList({
        source,
        projectId,
        entityId,
        page,
      });
    }
  }, [projectId, entityId, page, fetchRunList, source]);

  useEffect(() => {
    if (!data?.isLoadMore) {
      setAllConversations(data?.rows || []);
    } else {
      setAllConversations(prev => {
        const existingIds = new Set(prev.map(conv => conv.id));
        const newItems = (data?.rows || []).filter(conv => !existingIds.has(conv.id));

        return [...prev, ...newItems];
      });
    }
  }, [data]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const handleHistoryItemSelect = useCallback(item => {
    setSelectedHistoryItem(item);
  }, []);

  const styles = runHistoryContainerStyles(isSmallWindow);

  return (
    <Box sx={onClose ? styles.outerWrapper : undefined}>
      {onClose && (
        <Box sx={styles.header}>
          <IconButton
            variant="elitea"
            color="tertiary"
            aria-label="close run history"
            onClick={onClose}
          >
            <CloseIcon sx={styles.iconClose} />
          </IconButton>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Run History
          </Typography>
        </Box>
      )}
      <Box sx={onClose ? styles.wrapperFlex : styles.wrapper}>
        <Box sx={styles.historyList}>
          <RunHistoryList
            conversations={allConversations}
            versions={versions}
            isLoading={isLoading && page === 0}
            isLoadingMore={isFetching && page > 0}
            listCurrentSize={allConversations.length}
            totalAvailableCount={data?.total || 0}
            onLoadMore={handleLoadMore}
            resetPageDependencies={[projectId, entityId]}
            handleHistoryItemSelect={handleHistoryItemSelect}
            selectedHistoryItem={selectedHistoryItem}
            source={source}
            handleRestoreConversation={handleRestoreConversation}
          />
        </Box>

        <RunHistoryChat
          selectedHistoryItem={selectedHistoryItem}
          prettifyChat={[ParticipantEntityTypes.Toolkit, ParticipantEntityTypes.MCP].includes(source)}
          ChatMessageListComponent={ChatMessageListComponent}
          prettifyConversation={prettifyConversation}
        />
      </Box>
    </Box>
  );
});

RunHistoryContainer.displayName = 'RunHistoryContainer';

/** @type {MuiSx} */
const runHistoryContainerStyles = isSmallWindow => ({
  outerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    width: '100%',
    flexShrink: 0,
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    boxSizing: 'border-box',
    gap: '0.75rem',
  },
  iconClose: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },
  wrapper: {
    height: 'calc(100vh - 6rem)',
    paddingTop: '0rem',
    display: 'flex',
    boxSizing: 'border-box',
    flexDirection: isSmallWindow ? 'column' : 'row',
    gap: '1.5rem',
  },
  wrapperFlex: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    boxSizing: 'border-box',
    flexDirection: isSmallWindow ? 'column' : 'row',
    gap: '1.5rem',
    padding: '0.75rem 1.5rem 0.75rem 1.5rem',
  },
  historyList: {
    flex: 3,
    maxWidth: isSmallWindow ? '100%' : '32rem',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    gap: '1.5rem',
  },
});

export default RunHistoryContainer;

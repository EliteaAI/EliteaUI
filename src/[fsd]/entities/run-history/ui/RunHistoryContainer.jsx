import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, IconButton, Typography } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { byNewestRunFirst } from '@/[fsd]/entities/run-history/lib/helpers';
import { RunHistoryChat, RunHistoryList } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { SearchParams } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const NO_ADDITIONAL_ROWS = [];
const NO_FILTERS = {};

const RunHistoryContainer = memo(props => {
  const {
    entityId,
    versions,
    source,
    handleRestoreConversation,
    handleOpenAnalytics,
    onClose,
    ChatMessageListComponent,
    prettifyConversation,
    additionalRows = NO_ADDITIONAL_ROWS,
    additionalRowsLoading = false,
    decorateRow = null,
    DetailComponent = null,
    shareOpensHistoryTab = false,
    entityProjectId,
    filters = NO_FILTERS,
    onFacets,
    extraColumns,
    listWidth,
    emptyState,
    fitParent = false,
  } = props;

  const projectId = useSelectedProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastInfo } = useToast();

  const { isSmallWindow } = useIsSmallWindow();

  const [allConversations, setAllConversations] = useState([]);
  const [page, setPage] = useState(0);
  const filtersKey = JSON.stringify(filters);
  const [pagedFiltersKey, setPagedFiltersKey] = useState(filtersKey);
  if (pagedFiltersKey !== filtersKey) {
    setPagedFiltersKey(filtersKey);
    setPage(0);
  }
  const requestFilters = useMemo(() => JSON.parse(filtersKey), [filtersKey]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const handledSharedRunId = useRef(null);
  const [mergedData, setMergedData] = useState();

  const [fetchRunList, { data, isLoading, isFetching, isUninitialized }] =
    RunHistoryApi.useLazyGetRunHistoryListQuery();

  // Not part of server-side pagination, so they are merged into every page.
  const historyRows = useMemo(() => {
    const conversationRows = decorateRow ? allConversations.map(decorateRow) : allConversations;
    return [...conversationRows, ...additionalRows].sort(byNewestRunFirst);
  }, [allConversations, additionalRows, decorateRow]);

  const selectedRow = useMemo(
    () => historyRows.find(historyRow => historyRow.id === selectedHistoryItem) ?? null,
    [historyRows, selectedHistoryItem],
  );

  const conversationsSettled = mergedData === data;

  const runsStillArriving =
    isUninitialized || isLoading || isFetching || additionalRowsLoading || !conversationsSettled;

  const resolveSharedRun = useCallback(
    (sharedRow, historyRunId) => {
      if (sharedRow) return { selection: sharedRow.id };

      const isConversationId = /^\d+$/.test(historyRunId);
      const listIsComplete = allConversations.length >= (data?.total ?? 0);

      if (isConversationId && !listIsComplete) return { selection: Number(historyRunId) };

      return {
        selection: historyRows[0]?.id ?? null,
        unavailableMessage: historyRows.length
          ? 'That run is not in this list. Showing the most recent run instead.'
          : 'That run is no longer available.',
      };
    },
    [allConversations, data, historyRows],
  );

  useEffect(() => {
    const historyRunId = searchParams.get(SearchParams.HistoryRunId);

    if (!historyRunId) handledSharedRunId.current = null;

    if (!historyRunId || handledSharedRunId.current === historyRunId) {
      if (!selectedHistoryItem && !runsStillArriving && historyRows.length) {
        setSelectedHistoryItem(historyRows[0].id);
      }
      return;
    }

    const sharedRow = historyRows.find(historyRow => String(historyRow.id) === historyRunId);

    if (!sharedRow && runsStillArriving) return;

    const { selection, unavailableMessage } = resolveSharedRun(sharedRow, historyRunId);

    handledSharedRunId.current = historyRunId;
    if (unavailableMessage) toastInfo(unavailableMessage);

    setSelectedHistoryItem(selection);
    setSearchParams(
      params => {
        params.delete(SearchParams.HistoryRunId);
        return params;
      },
      { replace: true },
    );
  }, [
    historyRows,
    searchParams,
    setSearchParams,
    selectedHistoryItem,
    runsStillArriving,
    resolveSharedRun,
    toastInfo,
  ]);

  useEffect(() => {
    if (projectId && entityId) {
      const request = fetchRunList({
        source,
        projectId,
        entityId,
        page,
        ...(entityProjectId ? { entityProjectId } : {}),
        ...requestFilters,
      });
      Promise.resolve(request).then(result => {
        if (result?.data?.facets) onFacets?.(result.data.facets);
      });
    }
  }, [projectId, entityId, entityProjectId, page, fetchRunList, source, requestFilters, onFacets]);

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

    setMergedData(data);
  }, [data]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const handleHistoryItemSelect = useCallback(item => {
    setSelectedHistoryItem(item);
  }, []);

  const styles = runHistoryContainerStyles(isSmallWindow, listWidth);

  return (
    <Box sx={onClose ? styles.outerWrapper : fitParent ? styles.outerFitParent : undefined}>
      {onClose && (
        <Box sx={styles.header}>
          <IconButton
            data-testid="run-history-close-button"
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
      <Box sx={onClose ? styles.wrapperFlex : [styles.wrapper, fitParent && styles.wrapperFitParent]}>
        <Box sx={styles.historyList}>
          <RunHistoryList
            conversations={historyRows}
            versions={versions}
            isLoading={isLoading && page === 0}
            isLoadingMore={isFetching && page > 0}
            listCurrentSize={allConversations.length}
            totalAvailableCount={data?.total || 0}
            onLoadMore={handleLoadMore}
            resetPageDependencies={[projectId, entityId, entityProjectId, filtersKey]}
            handleHistoryItemSelect={handleHistoryItemSelect}
            selectedHistoryItem={selectedHistoryItem}
            source={source}
            handleRestoreConversation={handleRestoreConversation}
            handleOpenAnalytics={handleOpenAnalytics}
            hasEvent={Boolean(decorateRow)}
            shareOpensHistoryTab={shareOpensHistoryTab}
            extraColumns={extraColumns}
            listWidth={listWidth}
            emptyState={typeof emptyState === 'function' ? emptyState(data) : emptyState}
          />
        </Box>

        {selectedRow?.entry && DetailComponent ? (
          <DetailComponent row={selectedRow} />
        ) : (
          <RunHistoryChat
            selectedHistoryItem={selectedHistoryItem}
            prettifyChat={[ParticipantEntityTypes.Toolkit, ParticipantEntityTypes.MCP].includes(source)}
            ChatMessageListComponent={ChatMessageListComponent}
            prettifyConversation={prettifyConversation}
          />
        )}
      </Box>
    </Box>
  );
});

RunHistoryContainer.displayName = 'RunHistoryContainer';

/** @type {MuiSx} */
const runHistoryContainerStyles = (isSmallWindow, listWidth = '32rem') => ({
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
  outerFitParent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  wrapperFitParent: {
    height: 'auto',
    flex: 1,
    minHeight: 0,
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
    maxWidth: isSmallWindow ? '100%' : listWidth,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    gap: '1.5rem',
  },
});

export default RunHistoryContainer;

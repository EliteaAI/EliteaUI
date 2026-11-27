import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { byNewestRunFirst, formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { RunHistoryChat, RunHistoryList } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useIsSmallWindow, useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SearchParams } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';

import RunHistoryRunView from './RunHistoryRunView';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const NO_ADDITIONAL_ROWS = [];
const NO_QUERY_PARAMS = {};

const COMPLEXITY_UNAVAILABLE_TEXT =
  'Complexity labels are not available right now, so this filter cannot be applied.';
const COMPLEXITY_TRUNCATED_TEXT =
  'Too many runs match the Complexity filter. Showing the newest ones; narrow the filters to see the rest.';

// A 400 names the filter the server refused; a 503 from the Complexity filter says its labels cannot be read.
// Any other error shows a plain text, never the server's own.
const runListErrorText = error => {
  if (error?.status === 400 && error?.data?.error) return error.data.error;
  if (error?.status === 503 && error?.data?.code === 'complexity_unavailable')
    return COMPLEXITY_UNAVAILABLE_TEXT;
  return 'Failed to load the run history.';
};

const RunHistoryContainer = memo(props => {
  const {
    entityId,
    entityProjectId,
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
    eventColumnLabel,
    DetailComponent = null,
    onHitlResume,
    shareOpensHistoryTab = false,
    queryParams = NO_QUERY_PARAMS,
    extraColumns,
    // Reports the loaded rows, so a parent can fetch per-row data such as complexity labels
    onRowsChange,
    // 'side': the detail is right of the list (full pages); 'stacked': below it, for a narrow parent
    layout = 'side',
    // true: an opened run replaces the list, with prev/next and close
    openInPlace = false,
    onRunOpenChange,
    // true: only the additional rows show and no conversation is fetched
    skipConversations = false,
  } = props;

  const projectId = useSelectedProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastInfo } = useToast();

  const { isSmallWindow } = useIsSmallWindow();

  const [allConversations, setAllConversations] = useState([]);
  // Rows in the list's sort order; prev and next walk this order
  const [sortedRows, setSortedRows] = useState([]);
  const [page, setPage] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const handledSharedRunId = useRef(null);
  const openedRunId = useRef(null);
  // Set once the open run's id is in the URL; a later URL without it means Back
  const openedRunWritten = useRef(false);
  const [mergedData, setMergedData] = useState();

  const [fetchRunList, { data, isLoading, isFetching, isUninitialized, isError, error }] =
    RunHistoryApi.useLazyGetRunHistoryListQuery();

  // Not part of server-side pagination, so they are merged into every page.
  const historyRows = useMemo(() => {
    const conversationRows = skipConversations
      ? []
      : decorateRow
        ? allConversations.map(decorateRow)
        : allConversations;
    return [...conversationRows, ...additionalRows].sort(byNewestRunFirst);
  }, [allConversations, additionalRows, decorateRow, skipConversations]);

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

    // Back removed the open run's id after it was written: close the run
    if (!historyRunId && openedRunId.current !== null && openedRunWritten.current) {
      openedRunId.current = null;
      openedRunWritten.current = false;
      setSelectedHistoryItem(null);
      return;
    }
    if (historyRunId && openedRunId.current !== null && String(openedRunId.current) === historyRunId) {
      openedRunWritten.current = true;
    }

    // An id written by opening a run in place is not a shared link
    if (!historyRunId && openedRunId.current === null) handledSharedRunId.current = null;

    // No run opens on its own; only a shared link selects one
    if (!historyRunId || handledSharedRunId.current === historyRunId) return;
    if (openedRunId.current !== null) return;

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

  const loadRunList = useCallback(() => {
    if (projectId && entityId && !skipConversations) {
      fetchRunList({
        source,
        projectId,
        entityId,
        entityProjectId,
        page,
        ...queryParams,
      });
    }
  }, [projectId, entityId, entityProjectId, page, fetchRunList, source, queryParams, skipConversations]);

  useEffect(() => {
    loadRunList();
  }, [loadRunList]);

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

  useEffect(() => {
    onRowsChange?.(allConversations);
  }, [allConversations, onRowsChange]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // `replace` keeps one history entry per open run, so Back closes it
  const handleHistoryItemSelect = useCallback(
    (item, { replace = false } = {}) => {
      setSelectedHistoryItem(item);
      if (openInPlace && item !== null) {
        handledSharedRunId.current = String(item);
        openedRunId.current = String(item);
        setSearchParams(
          params => {
            params.set(SearchParams.HistoryRunId, String(item));
            return params;
          },
          { replace },
        );
      }
    },
    [openInPlace, setSearchParams],
  );

  const handleCloseRun = useCallback(() => {
    openedRunId.current = null;
    openedRunWritten.current = false;
    setSelectedHistoryItem(null);
    setSearchParams(
      params => {
        params.delete(SearchParams.HistoryRunId);
        return params;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (openInPlace) onRunOpenChange?.(selectedHistoryItem !== null);
  }, [openInPlace, selectedHistoryItem, onRunOpenChange]);

  useEffect(() => {
    if (!openInPlace || selectedHistoryItem === null) return undefined;
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      // Let Esc close an open menu or dialog first
      if (event.defaultPrevented || document.querySelector('[role="dialog"], [role="menu"]')) return;
      handleCloseRun();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openInPlace, selectedHistoryItem, handleCloseRun]);

  const isStacked = layout === 'stacked';
  const styles = runHistoryContainerStyles(isSmallWindow, isStacked, '100%');

  const detail =
    selectedRow?.entry && DetailComponent ? (
      <DetailComponent row={selectedRow} />
    ) : (
      <RunHistoryChat
        selectedHistoryItem={selectedHistoryItem}
        prettifyChat={[ParticipantEntityTypes.Toolkit, ParticipantEntityTypes.MCP].includes(source)}
        ChatMessageListComponent={ChatMessageListComponent}
        prettifyConversation={prettifyConversation}
        onHitlResume={onHitlResume}
      />
    );

  const runDate = formatRunTimestamp(selectedRow?.created_at);
  const navigableRows = sortedRows.length ? sortedRows : historyRows;
  const openRunIndex = navigableRows.findIndex(historyRow => historyRow.id === selectedHistoryItem);
  const showInPlaceRun = openInPlace && selectedHistoryItem !== null && openRunIndex >= 0;

  const handlePrevious = () => handleHistoryItemSelect(navigableRows[openRunIndex - 1].id, { replace: true });
  const handleNext = () => handleHistoryItemSelect(navigableRows[openRunIndex + 1].id, { replace: true });

  const inPlaceJsx = (
    <RunHistoryRunView
      runDate={runDate}
      selectedRow={selectedRow}
      openRunIndex={openRunIndex}
      totalRuns={historyRows.length}
      detail={detail}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onCloseRun={handleCloseRun}
      source={source}
      handleOpenAnalytics={handleOpenAnalytics}
      handleRestoreConversation={handleRestoreConversation}
      shareOpensHistoryTab={shareOpensHistoryTab}
    />
  );

  return (
    <Box sx={onClose ? styles.outerWrapper : styles.root}>
      {onClose && (
        <Box sx={styles.header}>
          <BaseBtn
            data-testid="run-history-close-button"
            variant={BUTTON_VARIANTS.tertiary}
            aria-label="close run history"
            onClick={onClose}
          >
            <CloseIcon sx={styles.iconClose} />
          </BaseBtn>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Run History
          </Typography>
        </Box>
      )}
      {showInPlaceRun && <Box sx={styles.inPlaceRun}>{inPlaceJsx}</Box>}
      <Box
        data-testid="run-history-layout"
        sx={[
          onClose ? styles.wrapperFlex : styles.wrapper,
          // Hidden, not unmounted, so the list keeps its state
          showInPlaceRun && styles.tableHidden,
        ]}
      >
        <Box
          data-testid="run-history-list-column"
          sx={styles.historyList}
        >
          {isError && (
            // A 400 names the filter the server refused, so the user can change it
            <BannerMessage variant="error">
              <Typography
                variant="bodySmall"
                data-testid="run-history-error"
              >
                {runListErrorText(error)}{' '}
                <Link
                  component="button"
                  type="button"
                  variant="bodySmall"
                  onClick={loadRunList}
                >
                  Retry
                </Link>
              </Typography>
            </BannerMessage>
          )}
          {data?.complexityTruncated && (
            <BannerMessage variant="info">
              <Typography
                variant="bodySmall"
                data-testid="run-history-complexity-truncated"
              >
                {COMPLEXITY_TRUNCATED_TEXT}
              </Typography>
            </BannerMessage>
          )}
          <RunHistoryList
            conversations={historyRows}
            versions={versions}
            isLoading={isLoading && page === 0}
            isLoadingMore={isFetching && page > 0}
            listCurrentSize={allConversations.length}
            totalAvailableCount={data?.total || 0}
            onLoadMore={handleLoadMore}
            resetPageDependencies={[projectId, entityId, entityProjectId]}
            handleHistoryItemSelect={handleHistoryItemSelect}
            selectedHistoryItem={selectedHistoryItem}
            source={source}
            handleRestoreConversation={handleRestoreConversation}
            handleOpenAnalytics={handleOpenAnalytics}
            hasEvent={Boolean(decorateRow)}
            eventColumnLabel={eventColumnLabel}
            shareOpensHistoryTab={shareOpensHistoryTab}
            extraColumns={extraColumns}
            fillWidth={openInPlace}
            onSortedRowsChange={setSortedRows}
          />
        </Box>

        {openInPlace ? null : isStacked ? (
          <Box
            data-testid="run-history-detail-panel"
            sx={styles.detailPanel}
          >
            {detail}
          </Box>
        ) : (
          detail
        )}
      </Box>
    </Box>
  );
});

RunHistoryContainer.displayName = 'RunHistoryContainer';

/** @type {MuiSx} */
const runHistoryContainerStyles = (isSmallWindow, isStacked, listWidth = '32rem') => ({
  // Fills the caller's flex box, so the layout below can take exactly the height left for it
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
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
    // The space above varies (header, filters), so a viewport-based height cut off the list bottom
    // and its load-more trigger (EL-7422)
    ...(isStacked ? { height: 'auto' } : { flex: 1, minHeight: 0 }),
    paddingTop: '0rem',
    display: 'flex',
    boxSizing: 'border-box',
    flexDirection: isSmallWindow || isStacked ? 'column' : 'row',
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
    flex: isStacked ? 'none' : 2,
    height: isStacked ? '20rem' : undefined,
    // The column follows the list width, so the panel starts after it
    maxWidth: isSmallWindow || isStacked ? '100%' : listWidth,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    gap: '1.5rem',
  },
  detailPanel: {
    display: 'flex',
    flex: isStacked ? 'none' : 1,
    minWidth: 0,
    width: '100%',
    height: '32rem',
    boxSizing: 'border-box',
  },
  tableHidden: {
    display: 'none',
  },
  inPlaceRun: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem 1.5rem',
    boxSizing: 'border-box',
  },
});

export default RunHistoryContainer;

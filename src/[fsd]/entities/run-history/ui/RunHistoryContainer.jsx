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
    // true: an opened run replaces the list in the same page, with ‹ › and X (agents and pipelines, AC-13)
    openInPlace = false,
    // Tells the parent when a run opens or closes, so the parent can hide its own filter bar with the table
    onRunOpenChange,
    // true: only the additional rows show, no conversation is fetched (an index Event or Index filter, AC-39)
    skipConversations = false,
  } = props;

  const projectId = useSelectedProjectId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastInfo } = useToast();

  const { isSmallWindow } = useIsSmallWindow();

  const [allConversations, setAllConversations] = useState([]);
  // The rows in the order the list shows them (its sort); prev and next walk this order
  const [sortedRows, setSortedRows] = useState([]);
  const [page, setPage] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const handledSharedRunId = useRef(null);
  // The run the reader opened in place (its id is in the URL); null when no run is open
  const openedRunId = useRef(null);
  // Set once the open run's id is in the address bar; a later URL without it is Back, not a settling URL
  const openedRunWritten = useRef(false);
  const [mergedData, setMergedData] = useState();

  const [fetchRunList, { data, isLoading, isFetching, isUninitialized, isError, error }] =
    RunHistoryApi.useLazyGetRunHistoryListQuery();

  // Not part of server-side pagination, so they are merged into every page.
  const historyRows = useMemo(() => {
    // With skipConversations the list shows only the additional rows (index runs), never a loaded conversation
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

    // Browser Back removes the open run's id from the URL after it was written: the run closes with it (AC-15).
    // Until the write lands the URL has no id yet, so the rule waits for the id to have been written first.
    if (!historyRunId && openedRunId.current !== null && openedRunWritten.current) {
      openedRunId.current = null;
      openedRunWritten.current = false;
      setSelectedHistoryItem(null);
      return;
    }
    if (historyRunId && openedRunId.current !== null && String(openedRunId.current) === historyRunId) {
      openedRunWritten.current = true;
    }

    // A run the reader opened in place is written to the URL by the reader, not a shared link: the
    // effect must not treat its id as a new link. Only a link with no open run resets the handled ref.
    if (!historyRunId && openedRunId.current === null) handledSharedRunId.current = null;

    // No run opens on its own (ticket AC-18): only a shared link selects one
    if (!historyRunId || handledSharedRunId.current === historyRunId) return;
    // Once the reader has opened a run here, the URL is theirs to write: a stale id in it is not a shared link
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

  // `replace`: moving between runs (prev, next) keeps the one history entry of the open run, so Back closes it
  // rather than stepping back through every run visited (AC-15)
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

  // AC-14: closes the open run and removes history_run_id, so the table returns with its state
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

  // AC-14, AC-17: Esc closes an open run in place
  useEffect(() => {
    if (!openInPlace || selectedHistoryItem === null) return undefined;
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      // Esc closes an open menu or dialog first (they call preventDefault); the run stays open until the next Esc
      if (event.defaultPrevented || document.querySelector('[role="dialog"], [role="menu"]')) return;
      handleCloseRun();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openInPlace, selectedHistoryItem, handleCloseRun]);

  const isStacked = layout === 'stacked';
  // With the run opened in place there is no detail beside the table, so the table takes the whole width
  const styles = runHistoryContainerStyles(
    isSmallWindow,
    isStacked,
    // Side by side the flex split below sets the widths, so the table is not capped at a fixed width
    '100%',
  );

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

  // AC-13: the open run replaces the table on the same page; the list stays mounted, hidden, so its state survives
  const runDate = formatRunTimestamp(selectedRow?.created_at);
  // Prev and next follow the order the table shows (the sort), not the newest-first order of the rows
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
      {showInPlaceRun && (
        // AC-13: the open run replaces the table on the same page; the list is only hidden, so its state survives
        <Box sx={styles.inPlaceRun}>{inPlaceJsx}</Box>
      )}
      <Box
        data-testid="run-history-layout"
        sx={[
          onClose ? styles.wrapperFlex : styles.wrapper,
          // The table is replaced by the open run (AC-13). The style sets display, which would override the
          // hidden attribute, so the hiding is done in the style.
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
                {error?.status === 400 && error?.data?.error
                  ? error.data.error
                  : 'Failed to load the run history.'}{' '}
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

        {/* In place (AC-18, AC-13) the run replaces the table, and no empty panel sits beside it */}
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
    // Side by side the table takes two thirds and the chat one third (ticket #7682)
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

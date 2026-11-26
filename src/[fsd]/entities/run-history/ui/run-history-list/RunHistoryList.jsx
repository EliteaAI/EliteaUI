import { memo, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import {
  compareRunDuration,
  compareRunTimestamp,
  resolveRunHistoryColumns,
} from '@/[fsd]/entities/run-history/lib/helpers';
import { useRunHistorySorting } from '@/[fsd]/entities/run-history/lib/hooks';
import { RunHistoryListItem, RunHistorySortableHeader } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useGetWindowWidth, useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';
import { ContentContainer } from '@/pages/Common';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const NO_EXTRA_COLUMNS = [];

const SORT_TYPES = {
  DATE: 'date',
  EVENT: 'event',
  VERSION: 'version',
  DURATION: 'duration',
  SCHEDULE: 'schedule',
  STATUS: 'status',
};

const RunHistoryList = memo(props => {
  const {
    conversations = [],
    versions = [],
    isLoading = false,
    isLoadingMore = false,
    listCurrentSize = 0,
    totalAvailableCount = 0,
    onLoadMore,
    resetPageDependencies,
    handleHistoryItemSelect,
    selectedHistoryItem,
    source,
    handleRestoreConversation,
    handleOpenAnalytics,
    hasEvent = false,
    eventColumnLabel = 'Event',
    shareOpensHistoryTab = false,
    extraColumns = NO_EXTRA_COLUMNS,
    // true: the table takes the whole width of its parent (the run opens in place, nothing beside it)
    fillWidth = false,
    // Reports the rows in the order the table shows them, so the run's prev and next follow the sort
    onSortedRowsChange,
  } = props;
  const { isSmallWindow } = useIsSmallWindow();
  const { windowWidth } = useGetWindowWidth();

  // Beside the chat the parent's flex split sets the width; in place the table fills the whole width
  const styles = runHistoryListStyles(isSmallWindow, fillWidth ? '100%' : null);

  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting(SORT_TYPES.DATE);

  const noVersions = useMemo(() => versions === null, [versions]);

  const sortFunctions = useMemo(
    () => ({
      [SORT_TYPES.DATE]: (a, b) => compareRunTimestamp(a.created_at, b.created_at),
      [SORT_TYPES.EVENT]: (a, b) =>
        (a.event_sort ?? a.event_label ?? '').localeCompare(b.event_sort ?? b.event_label ?? '') ||
        (a.event_label ?? '').localeCompare(b.event_label ?? ''),
      [SORT_TYPES.VERSION]: (a, b) => {
        if (noVersions) return 0;

        const versionA = versions?.find(v => v.id === a.version_id)?.name || '';
        const versionB = versions?.find(v => v.id === b.version_id)?.name || '';

        return versionA.localeCompare(versionB);
      },
      [SORT_TYPES.DURATION]: compareRunDuration,
      [SORT_TYPES.SCHEDULE]: (a, b) =>
        (a.schedule_run?.schedule_name ?? '').localeCompare(b.schedule_run?.schedule_name ?? ''),
      [SORT_TYPES.STATUS]: (a, b) =>
        (a.schedule_run?.status ?? a.run_status ?? '').localeCompare(
          b.schedule_run?.status ?? b.run_status ?? '',
        ),
      // The extra column's own sort value (Complexity reads the labels it loaded); unscored rows sort last
      ...Object.fromEntries(
        extraColumns
          .filter(column => typeof column.sortValue === 'function')
          .map(column => [
            column.id,
            (a, b) => {
              const left = column.sortValue(a);
              const right = column.sortValue(b);
              return left < right ? -1 : left > right ? 1 : 0;
            },
          ]),
      ),
    }),
    [noVersions, versions, extraColumns],
  );

  const tableHeaderItems = useMemo(
    () => [
      { label: 'Date', type: SORT_TYPES.DATE },
      ...(hasEvent ? [{ label: eventColumnLabel, type: SORT_TYPES.EVENT }] : []),
      // The extra columns sort by their own value (Schedule/Webhook, Status and Complexity). A column with no
      // sort function (the toolkit's Index) has no arrows and no click, so nothing looks sortable that is not
      ...extraColumns.map(column => ({
        label: column.label,
        title: column.title,
        type: column.id,
        sortable: sortFunctions[column.id] !== undefined,
      })),
      ...(noVersions ? [] : [{ label: 'Version', type: SORT_TYPES.VERSION }]),
      { label: 'Duration', type: SORT_TYPES.DURATION },
    ],
    [noVersions, hasEvent, eventColumnLabel, extraColumns, sortFunctions],
  );

  const sortedConversations = useMemo(
    () => getSortedData(conversations, sortFunctions),
    [conversations, getSortedData, sortFunctions],
  );

  useEffect(() => {
    onSortedRowsChange?.(sortedConversations);
  }, [sortedConversations, onSortedRowsChange]);

  return (
    <ContentContainer sx={styles.wrapper}>
      <Box sx={styles.listContainer}>
        {!isLoading && (
          <RunHistorySortableHeader
            headerItems={tableHeaderItems}
            sortConfig={sortConfig}
            onSort={handleSortItems}
            gridTemplateColumns={resolveRunHistoryColumns(noVersions, hasEvent, extraColumns)}
          />
        )}
        <Box sx={styles.list}>
          {isLoading ? (
            Array.from({ length: 15 }).map((_, index) => (
              <RunHistoryListItem
                key={`skeleton-${index}`}
                useMock
                source={source}
                hasEvent={hasEvent}
                extraColumns={extraColumns}
                {...(source === ParticipantEntityTypes.Toolkit ? { versions: null } : {})}
              />
            ))
          ) : (
            <>
              {sortedConversations.map(conversationItem => (
                <RunHistoryListItem
                  key={conversationItem.id}
                  item={conversationItem}
                  selectedItem={selectedHistoryItem}
                  onItemSelect={handleHistoryItemSelect}
                  versions={versions}
                  tooltipTrigger={windowWidth}
                  handleRestoreConversation={handleRestoreConversation}
                  handleOpenAnalytics={handleOpenAnalytics}
                  source={source}
                  hasEvent={hasEvent}
                  extraColumns={extraColumns}
                  shareOpensHistoryTab={shareOpensHistoryTab}
                />
              ))}
            </>
          )}
          {conversations.length > 0 && onLoadMore && (
            <ListInfiniteMoreLoader
              listCurrentSize={listCurrentSize}
              totalAvailableCount={totalAvailableCount}
              onLoadMore={onLoadMore}
              isLoading={isLoadingMore}
              resetPageDependencies={resetPageDependencies}
            />
          )}
        </Box>
      </Box>
    </ContentContainer>
  );
});

RunHistoryList.displayName = 'RunHistoryList';

/** @type {MuiSx} */
// The list grows with its extra columns (48 rem with Schedule and Status); without them it keeps 32 rem
const runHistoryListStyles = (isSmallWindow, listWidth) => {
  // A null width leaves the table to its flex share, so it does not stop short of the split
  const wrapperWidth = isSmallWindow ? '100%' : listWidth;

  return {
    wrapper: {
      flex: listWidth ? 1 : 2,
      width: wrapperWidth ?? undefined,
      minWidth: 0,
      maxWidth: wrapperWidth ?? undefined,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      gap: '1.5rem',
      height: '100%',
      overflow: 'hidden',
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      height: '100%',
      overflow: 'hidden',
    },
    list: {
      overflowY: 'auto',
      flex: 1,
    },
  };
};

export default RunHistoryList;

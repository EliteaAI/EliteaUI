import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { compareRunDuration, resolveRunHistoryColumns } from '@/[fsd]/entities/run-history/lib/helpers';
import { useRunHistorySorting } from '@/[fsd]/entities/run-history/lib/hooks';
import { RunHistoryListItem, RunHistorySortableHeader } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { ContentContainer } from '@/pages/Common';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const SORT_TYPES = {
  DATE: 'date',
  EVENT: 'event',
  VERSION: 'version',
  DURATION: 'duration',
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
    hasEvent = false,
    shareOpensHistoryTab = false,
  } = props;
  const { isSmallWindow } = useIsSmallWindow();
  const { windowWidth } = useGetWindowWidth();

  const styles = runHistoryListStyles(isSmallWindow);

  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting(SORT_TYPES.DATE);

  const noVersions = useMemo(() => versions === null, [versions]);

  const sortFunctions = useMemo(
    () => ({
      [SORT_TYPES.DATE]: (a, b) => {
        const dateA = new Date(a.created_at?.replace?.('Z', '') || a.created_at);
        const dateB = new Date(b.created_at?.replace?.('Z', '') || b.created_at);
        return dateA.getTime() - dateB.getTime();
      },
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
    }),
    [noVersions, versions],
  );

  const tableHeaderItems = useMemo(
    () => [
      { label: 'Date', type: SORT_TYPES.DATE },
      ...(hasEvent ? [{ label: 'Event', type: SORT_TYPES.EVENT }] : []),
      ...(noVersions ? [] : [{ label: 'Version', type: SORT_TYPES.VERSION }]),
      { label: 'Duration', type: SORT_TYPES.DURATION },
    ],
    [noVersions, hasEvent],
  );

  const sortedConversations = useMemo(
    () => getSortedData(conversations, sortFunctions),
    [conversations, getSortedData, sortFunctions],
  );

  return (
    <ContentContainer sx={styles.wrapper}>
      <Box sx={styles.listContainer}>
        {!isLoading && (
          <RunHistorySortableHeader
            headerItems={tableHeaderItems}
            sortConfig={sortConfig}
            onSort={handleSortItems}
            gridTemplateColumns={resolveRunHistoryColumns(noVersions, hasEvent)}
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
                  source={source}
                  hasEvent={hasEvent}
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
const runHistoryListStyles = isSmallWindow => {
  const wrapperWidth = isSmallWindow ? '100%' : '32rem';

  return {
    wrapper: {
      flex: 3,
      width: wrapperWidth,
      minWidth: wrapperWidth,
      maxWidth: wrapperWidth,
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

import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import {
  RunHistoryListItem,
  RunHistorySortableHeader,
  compareRunDuration,
  resolveRunHistoryColumns,
  useRunHistorySorting,
} from '@/[fsd]/entities/run-history';
import { initialCompletedTsOf } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';
import {
  buildIndexHistoryRows,
  indexHistoryRowId,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexHistoryRow.helpers';
import { actions, selectHistoryItem } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { SearchParams } from '@/common/constants';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useToast from '@/hooks/useToast';

const SORT_TYPES = {
  DATE: 'date',
  EVENT: 'event',
  DURATION: 'duration',
};

const GRID_TEMPLATE_COLUMNS = resolveRunHistoryColumns(true, true);

const TABLE_HEADER_ITEMS = [
  { label: 'Date', type: SORT_TYPES.DATE },
  { label: 'Event', type: SORT_TYPES.EVENT },
  { label: 'Duration', type: SORT_TYPES.DURATION },
];

const SORT_FUNCTIONS = {
  [SORT_TYPES.DATE]: (a, b) => a.created_at - b.created_at,
  [SORT_TYPES.EVENT]: (a, b) => a.event_label.localeCompare(b.event_label),
  [SORT_TYPES.DURATION]: compareRunDuration,
};

const IndexHistory = memo(props => {
  const { history } = props;
  const dispatch = useDispatch();
  const { windowWidth } = useGetWindowWidth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastInfo } = useToast();

  const styles = indexHistoryStyles();

  const selectedHistoryItem = useSelector(selectHistoryItem);
  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting(SORT_TYPES.DATE);

  const initialCompletedTs = useMemo(() => initialCompletedTsOf(history), [history]);

  const historyRows = useMemo(
    () => buildIndexHistoryRows(history, initialCompletedTs),
    [history, initialCompletedTs],
  );

  useEffect(() => {
    const sharedRunId = searchParams.get(SearchParams.HistoryRunId);
    const sharedRow = historyRows.find(row => row.id === sharedRunId);
    const newestRow = historyRows.reduce(
      (newest, row) => (newest && newest.created_at >= row.created_at ? newest : row),
      null,
    );

    if (sharedRunId && !sharedRow) {
      toastInfo(
        newestRow
          ? 'That run is not in this list. Showing the most recent run instead.'
          : 'That run is no longer available.',
      );
    }

    dispatch(actions.selectHistoryItem(sharedRow?.entry ?? newestRow?.entry ?? null));

    if (sharedRunId) {
      setSearchParams(
        params => {
          params.delete(SearchParams.HistoryRunId);
          return params;
        },
        { replace: true },
      );
    }

    return () => {
      dispatch(actions.selectHistoryItem(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedRows = useMemo(() => getSortedData(historyRows, SORT_FUNCTIONS), [historyRows, getSortedData]);

  const selectedRowId = useMemo(
    () => (selectedHistoryItem ? indexHistoryRowId(selectedHistoryItem) : null),
    [selectedHistoryItem],
  );

  const handleSelectRow = useCallback(
    rowId => {
      dispatch(actions.selectHistoryItem(historyRows.find(row => row.id === rowId)?.entry ?? null));
    },
    [dispatch, historyRows],
  );

  return (
    <Box sx={styles.wrapper}>
      <RunHistorySortableHeader
        headerItems={TABLE_HEADER_ITEMS}
        sortConfig={sortConfig}
        onSort={handleSortItems}
        gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
      />
      <Box sx={styles.scrollableContent}>
        {sortedRows.map(row => (
          <RunHistoryListItem
            key={row.id}
            item={row}
            versions={null}
            hasEvent
            selectedItem={selectedRowId}
            onItemSelect={handleSelectRow}
            tooltipTrigger={windowWidth}
          />
        ))}
      </Box>
    </Box>
  );
});

IndexHistory.displayName = 'IndexHistory';

/** @type {MuiSx} */
const indexHistoryStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  scrollableContent: {
    flex: 1,
    width: '100%',
    overflowY: 'auto',
  },
});

export default IndexHistory;

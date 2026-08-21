import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import {
  RunHistorySortableHeader,
  formatRunTimestamp,
  useRunHistorySorting,
} from '@/[fsd]/entities/run-history';
import { IndexHistoryItemsLabels } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import {
  initialCompletedTsOf,
  resolveIndexEventLabel,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexEvent.helpers';
import { actions, selectHistoryItem } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';

const SORT_TYPES = {
  EVENT: 'event',
  DATE: 'date',
};

const IndexHistory = memo(props => {
  const { history } = props;
  const dispatch = useDispatch();

  const styles = indexHistoryStyles();

  const selectedHistoryItem = useSelector(selectHistoryItem);
  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting(SORT_TYPES.DATE);

  const initialCompletedTs = useMemo(() => initialCompletedTsOf(history), [history]);

  useEffect(() => {
    dispatch(actions.selectHistoryItem(history[history.length - 1]));

    return () => {
      dispatch(actions.selectHistoryItem(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveLabel = useCallback(
    item => resolveIndexEventLabel(item, initialCompletedTs),
    [initialCompletedTs],
  );

  const sortFunctions = useMemo(
    () => ({
      [SORT_TYPES.EVENT]: (a, b) => resolveLabel(a).localeCompare(resolveLabel(b)),
      [SORT_TYPES.DATE]: (a, b) => a.updated_on - b.updated_on,
    }),
    [resolveLabel],
  );

  const sortedHistory = useMemo(
    () =>
      getSortedData(history, sortFunctions).filter(
        item => Boolean(IndexHistoryItemsLabels[item.state]) && Number.isFinite(item.updated_on),
      ),
    [history, getSortedData, sortFunctions],
  );

  const tableHeaderItems = useMemo(
    () => [
      { label: 'Event', type: SORT_TYPES.EVENT },
      { label: 'Date', type: SORT_TYPES.DATE },
    ],
    [],
  );

  const handleSelectHistoryItem = useCallback(
    item => {
      dispatch(actions.selectHistoryItem(item));
    },
    [dispatch],
  );

  return (
    <Box sx={styles.wrapper}>
      <RunHistorySortableHeader
        headerItems={tableHeaderItems}
        sortConfig={sortConfig}
        onSort={handleSortItems}
        gridTemplateColumns="1fr 1fr"
      />
      <Box sx={styles.scrollableContent}>
        {sortedHistory.map(historyItem => (
          <Box
            key={`${historyItem.updated_on}_${historyItem.conversation_id}`}
            sx={[
              styles.historyItem,
              historyItem.updated_on === selectedHistoryItem?.updated_on &&
                historyItem.conversation_id === selectedHistoryItem?.conversation_id &&
                styles.selected,
            ]}
            onClick={() => handleSelectHistoryItem(historyItem)}
          >
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {resolveLabel(historyItem)}
            </Typography>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {formatRunTimestamp(historyItem.updated_on)}
            </Typography>
          </Box>
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
    maxHeight: 'calc(100vh - 14.25rem)',
    position: 'relative',
  },
  scrollableContent: {
    flex: 1,
    width: '100%',
    overflowY: 'auto',
  },
  historyItem: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    padding: '.5rem 1rem',
    width: '100%',
    color: palette.text.secondary,
    position: 'relative',
    borderRadius: '0.5rem',

    span: {
      padding: '0rem 1rem',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',

      '&:first-of-type': {
        padding: 0,
      },
    },

    svg: {
      display: 'none',
      position: 'absolute',
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
    },

    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '0.0625rem',
      backgroundColor: palette.divider,
    },

    '&:nth-of-type(2)': {
      '&:after': { display: 'none' },
    },

    '&:hover': {
      cursor: 'pointer',
      backgroundColor: palette.background.userInputBackground,

      '&:after': {
        display: 'none',
      },

      svg: {
        display: 'block',
      },
    },

    '&:hover + &:after': {
      display: 'none',
    },
  }),
  selected: ({ palette }) => ({
    background: palette.split.pressed,

    '&:after': {
      display: 'none',
    },

    '&:hover': {
      cursor: 'pointer',
      background: palette.split.pressed,
    },

    '+ *:after': {
      display: 'none',
    },
  }),
});

export default IndexHistory;

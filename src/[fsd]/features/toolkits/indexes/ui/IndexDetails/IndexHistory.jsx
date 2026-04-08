import { memo, useEffect, useMemo } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { useRunHistorySorting } from '@/[fsd]/entities/run-history/lib/hooks';
import { RunHistorySortableHeader } from '@/[fsd]/entities/run-history/ui';
import { IndexHistoryItemsLabels } from '@/[fsd]/features/toolkits/indexes/lib/constants';
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

  useEffect(() => {
    dispatch(actions.selectHistoryItem(history[history.length - 1]));

    return () => {
      dispatch(actions.selectHistoryItem(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortFunctions = useMemo(
    () => ({
      [SORT_TYPES.EVENT]: (a, b) => {
        const labelA = IndexHistoryItemsLabels[a.state] || a.state;
        const labelB = IndexHistoryItemsLabels[b.state] || b.state;
        return labelA.localeCompare(labelB);
      },
      [SORT_TYPES.DATE]: (a, b) => a.updated_on - b.updated_on,
    }),
    [],
  );

  const sortedHistory = useMemo(
    () => getSortedData(history, sortFunctions),
    [history, getSortedData, sortFunctions],
  );

  const tableHeaderItems = useMemo(
    () => [
      { label: 'Event', type: SORT_TYPES.EVENT },
      { label: 'Date', type: SORT_TYPES.DATE },
    ],
    [],
  );

  const handleSelectHistoryItem = item => {
    dispatch(actions.selectHistoryItem(item));
  };

  return (
    <Box sx={styles.wrapper}>
      <RunHistorySortableHeader
        headerItems={tableHeaderItems}
        sortConfig={sortConfig}
        onSort={handleSortItems}
        gridTemplateColumns="0.5fr 1fr"
      />
      <Box sx={styles.scrollableContent}>
        {sortedHistory.map((historyItem, idx) => (
          <Box
            key={`${idx}_${historyItem.conversation_id}`}
            sx={[
              styles.historyItem,
              historyItem.updated_on === selectedHistoryItem?.updated_on &&
                historyItem.conversation_id === selectedHistoryItem?.conversation_id &&
                styles.selected,
            ]}
            onClick={() => handleSelectHistoryItem(historyItem)}
          >
            <Typography
              variant="bodyM"
              color="text.secondary"
              sx={{ width: '6.5rem' }}
            >
              {IndexHistoryItemsLabels[historyItem.state]}
            </Typography>
            <Typography
              variant="bodyM"
              color="text.secondary"
            >
              {format(new Date(fromUnixTime(historyItem.updated_on)), 'dd-MM-yyyy, hh:mm a')}
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
    gridTemplateColumns: '0.5fr 1fr',
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
      height: '1px',
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

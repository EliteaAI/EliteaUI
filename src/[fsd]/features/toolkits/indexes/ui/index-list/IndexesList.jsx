import { memo } from 'react';

import { Box } from '@mui/material';

import IndexListItem from './IndexListItem';
import IndexesEmptyState from './IndexesEmptyState';

const SKELETON_COUNT = 4;

const IndexesList = memo(props => {
  const {
    canIndex = true,
    handleAddIndex,
    indexesList,
    onIndexClick,
    currentIndex,
    loading,
    onCardReindex,
    onCardDelete,
    onCardOpenNewTab,
    reindexingId,
  } = props;

  const styles = indexesListStyles();

  if (loading) {
    return (
      <Box sx={styles.wrapper}>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <IndexListItem
            useMock
            key={`skeleton-${index}`}
            index={index}
          />
        ))}
      </Box>
    );
  }

  if (!indexesList.length) {
    return (
      <IndexesEmptyState
        canIndex={canIndex}
        onAddIndex={handleAddIndex}
      />
    );
  }

  return (
    <Box sx={styles.wrapper}>
      {indexesList.map(index => (
        <IndexListItem
          key={index.id}
          index={index}
          onIndexClick={onIndexClick}
          currentIndex={currentIndex}
          listOnly
          onCardReindex={onCardReindex}
          onCardDelete={onCardDelete}
          onCardOpenNewTab={onCardOpenNewTab}
          isReindexing={reindexingId === index.id}
        />
      ))}
    </Box>
  );
});

IndexesList.displayName = 'IndexesList';

/** @type {MuiSx} */
const indexesListStyles = () => ({
  wrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
});

export default IndexesList;

import { memo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import PlusIcon from '@/assets/plus-icon.svg?react';

import IndexListItem from './IndexListItem';

const IndexesList = memo(props => {
  const { handleAddIndex, indexesList, onIndexClick, currentIndex, loading } = props;

  const styles = indexesListStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <Typography variant="subtitle">INDEXES</Typography>
        <IconButton
          variant="alita"
          color="secondary"
          onClick={handleAddIndex}
        >
          <PlusIcon />
        </IconButton>
      </Box>
      {!indexesList.length && !loading ? (
        <Typography
          variant="bodyMedium"
          sx={styles.placeholder}
        >
          Still no indexes created
        </Typography>
      ) : (
        <Box sx={styles.indexesListContainer}>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <IndexListItem
                  useMock
                  key={`skeleton-${index}`}
                  index={index}
                />
              ))
            : indexesList.map(index => (
                <IndexListItem
                  key={index.id}
                  index={index}
                  onIndexClick={onIndexClick}
                  currentIndex={currentIndex}
                />
              ))}
        </Box>
      )}
    </Box>
  );
});

IndexesList.displayName = 'IndexesList';

/** @type {MuiSx} */
const indexesListStyles = () => ({
  wrapper: ({ palette }) => ({
    width: '16.25rem',
    minWidth: '16.25rem',
    padding: '1rem 1.5rem 1rem 0rem',
    borderRight: `.0625rem solid ${palette.divider}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  placeholder: ({ palette }) => ({
    color: palette.text.button.disabled,
  }),
  indexesListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    overflowY: 'auto',
    flexGrow: 1,
    height: '100%',
    maxHeight: '100%',
  },
});

export default IndexesList;

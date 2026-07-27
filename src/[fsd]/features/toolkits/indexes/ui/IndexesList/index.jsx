import { memo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import PlusIcon from '@/assets/plus-icon.svg?react';

import IndexListItem from './IndexListItem';

const IndexesList = memo(props => {
  const {
    handleAddIndex,
    indexesList,
    onIndexClick,
    currentIndex,
    loading,
    listOnly = false,
    onCardReindex,
    onCardDelete,
    onCardOpenNewTab,
    reindexingId,
  } = props;

  const styles = indexesListStyles(listOnly);

  return (
    <Box sx={styles.wrapper}>
      {!listOnly && (
        <Box sx={styles.header}>
          <Typography variant="subtitle">INDEXES</Typography>
          <IconButton
            variant="elitea"
            color="secondary"
            onClick={handleAddIndex}
          >
            <PlusIcon />
          </IconButton>
        </Box>
      )}
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
                  listOnly={listOnly}
                  onCardReindex={onCardReindex}
                  onCardDelete={onCardDelete}
                  onCardOpenNewTab={onCardOpenNewTab}
                  isReindexing={reindexingId === index.id}
                />
              ))}
        </Box>
      )}
      {listOnly && (
        <Box sx={styles.footer}>
          <Button.BaseBtn
            variant="special"
            startIcon={<PlusIcon />}
            onClick={handleAddIndex}
            data-testid="toolkit-indexes-add-button"
          >
            Index
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

IndexesList.displayName = 'IndexesList';

/** @type {MuiSx} */
const indexesListStyles = listOnly => ({
  wrapper: ({ palette }) =>
    listOnly
      ? {
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }
      : {
          width: '16.25rem',
          minWidth: '16.25rem',
          padding: '1rem 1.5rem 1rem 0rem',
          borderRight: `.0625rem solid ${palette.divider}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  placeholder: ({ palette }) => ({
    color: palette.text.button.disabled,
  }),
  indexesListContainer: listOnly
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        overflowY: 'auto',
        flexGrow: 1,
        height: '100%',
        maxHeight: '100%',
      },
  footer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
});

export default IndexesList;

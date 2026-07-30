import { memo } from 'react';

import { Box } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import InfoIcon from '@/assets/info.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';

import RunIndexBanner from '../RunIndexBanner';
import IndexListItem from './IndexListItem';

const IndexesList = memo(props => {
  const {
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

  return (
    <Box sx={styles.wrapper}>
      {!indexesList.length && !loading ? (
        <RunIndexBanner
          banner={{
            severity: 'info',
            label: 'No indexes yet',
            message: 'Create your first index to get started.',
          }}
          CustomIcon={() => <InfoIcon />}
          sx={styles.banner}
        />
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
                  listOnly
                  onCardReindex={onCardReindex}
                  onCardDelete={onCardDelete}
                  onCardOpenNewTab={onCardOpenNewTab}
                  isReindexing={reindexingId === index.id}
                />
              ))}
        </Box>
      )}
      <Box sx={styles.footer}>
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.iconLabel}
          startIcon={<PlusIcon />}
          onClick={handleAddIndex}
          data-testid="toolkit-indexes-add-button"
        >
          Index
        </Button.BaseBtn>
      </Box>
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
    gap: '0.5rem',
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
  indexesListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  banner: {
    padding: '0rem !important',
  },
});

export default IndexesList;

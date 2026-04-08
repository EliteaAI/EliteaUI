import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import SimpleBucketList from './SimpleBucketList';

const BUCKET_TYPES = {
  DATA: 'data',
  FILTERED_EMPTY: 'filtered_empty',
  EMPTY: 'empty',
};

const BucketsListContent = memo(props => {
  const {
    bucketsType,
    filteredBuckets,
    selectedBucketName,
    selectedFile,
    currentPrefix,
    onEdit,
    onDelete,
    onSelect,
    onUpload,
    onSelectFile,
    onSelectFolder,
  } = props;

  const styles = bucketsListContentStyles();

  switch (bucketsType) {
    case BUCKET_TYPES.DATA:
      return (
        <SimpleBucketList
          buckets={filteredBuckets}
          selectedBucketName={selectedBucketName}
          selectedFile={selectedFile}
          currentPrefix={currentPrefix}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          onUpload={onUpload}
          onSelectFile={onSelectFile}
          onSelectFolder={onSelectFolder}
        />
      );

    case BUCKET_TYPES.FILTERED_EMPTY:
      return (
        <Box sx={styles.emptyStateContainer}>
          <Typography
            variant="bodyMedium"
            color="text.button.disabled"
            sx={styles.emptyStateTitle}
          >
            No buckets found
          </Typography>
          <Typography
            variant="bodySmall"
            color="text.button.disabled"
          >
            Try adjusting your search terms
          </Typography>
        </Box>
      );

    case BUCKET_TYPES.EMPTY:
      return (
        <Box sx={styles.emptyStateContainer}>
          <Typography
            variant="bodyMedium"
            color="text.button.disabled"
            sx={styles.emptyStateTitle}
          >
            No buckets created yet
          </Typography>
          <Typography
            variant="bodySmall"
            color="text.button.disabled"
          >
            Create your first bucket to get started
          </Typography>
        </Box>
      );

    default:
      return null;
  }
});

BucketsListContent.displayName = 'BucketsListContent';

/** @type {MuiSx} */
const bucketsListContentStyles = () => ({
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  emptyStateTitle: {
    marginBottom: '0.5rem',
  },
});

export { BUCKET_TYPES };
export default BucketsListContent;

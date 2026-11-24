import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import NewFolder from '@/components/Icons/NewFolder';
import { useTheme } from '@emotion/react';

import BucketSearch from './BucketSearch';

const BucketHeader = memo(props => {
  const { onCreateBucket, searchQuery, onSearchChange, onSearchClear, onSearchActivate } = props;

  const theme = useTheme();
  const styles = bucketHeaderStyles();

  return (
    <>
      <Box sx={styles.header}>
        <Box sx={styles.headerActions}>
          <Typography
            data-testid="artifacts-buckets-heading"
            variant="subtitle"
          >
            Buckets
          </Typography>
          <Tooltip
            title="Create bucket"
            placement="top"
          >
            <Box component="span">
              <Button
                onClick={onCreateBucket}
                variant="elitea"
                color="secondary"
                sx={styles.createBucketButton}
                data-testid="artifacts-create-bucket-button"
              >
                <NewFolder
                  sx={styles.newFolderIcon}
                  fill={theme.palette.icon.secondary}
                />
              </Button>
            </Box>
          </Tooltip>
          <BucketSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSearchClear={onSearchClear}
            onSearchActivate={onSearchActivate}
          />
        </Box>
      </Box>
    </>
  );
});

BucketHeader.displayName = 'BucketHeader';

/** @type {MuiSx} */
const bucketHeaderStyles = () => ({
  header: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '3.7rem',
    alignItems: 'center',
    padding: '1.5rem',
    paddingTop: '1.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
  }),
  headerActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  createBucketButton: {
    minWidth: '1.75rem !important',
    width: '1.75rem !important',
    height: '1.75rem',
    boxSizing: 'border-box',
    padding: '0.375rem !important',
  },
  newFolderIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default BucketHeader;

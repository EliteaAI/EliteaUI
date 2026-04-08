import { memo, useCallback } from 'react';

import { Box, Button, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import NewFolder from '@/components/Icons/NewFolder';
import { useTheme } from '@emotion/react';

import BucketSearch from './BucketSearch';

const BucketHeader = memo(props => {
  const {
    collapsed,
    onCreateBucket,
    onCollapsed,
    searchQuery,
    onSearchChange,
    onSearchClear,
    onSearchActivate,
  } = props;

  const theme = useTheme();
  const styles = bucketHeaderStyles(collapsed);

  const clickCreateBucket = useCallback(
    shouldCollapse => () => {
      onCreateBucket?.();
      if (shouldCollapse) {
        onCollapsed?.();
      }
    },
    [onCreateBucket, onCollapsed],
  );

  return (
    <>
      <Box sx={styles.header}>
        <Box sx={styles.headerActions}>
          {!collapsed && (
            <>
              <Typography variant="subtitle">Buckets</Typography>
              <Tooltip
                title="Create bucket"
                placement="top"
              >
                <Box component="span">
                  <Button
                    onClick={clickCreateBucket(false)}
                    variant="elitea"
                    color="secondary"
                    sx={styles.createBucketButton}
                  >
                    <NewFolder
                      sx={styles.newFolderIcon}
                      fill={theme.palette.icon.fill.secondary}
                    />
                  </Button>
                </Box>
              </Tooltip>
              <BucketSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onSearchClear={onSearchClear}
                collapsed={collapsed}
                onExpand={onCollapsed}
                onSearchActivate={onSearchActivate}
              />
            </>
          )}
        </Box>

        <IconButton
          variant="elitea"
          color="tertiary"
          onClick={onCollapsed}
        >
          {!collapsed ? (
            <DoubleLeftIcon
              fill={theme.palette.icon.fill.default}
              width={16}
            />
          ) : (
            <DoubleRightIcon
              fill={theme.palette.icon.fill.default}
              width={16}
            />
          )}
        </IconButton>
      </Box>
    </>
  );
});

BucketHeader.displayName = 'BucketHeader';

/** @type {MuiSx} */
const bucketHeaderStyles = collapsed => ({
  header: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: collapsed ? 'center' : 'space-between',
    height: '3.7rem',
    alignItems: 'center',
    padding: '1.5rem',
    paddingTop: '1.75rem',
    borderBottom: !collapsed ? `0.0625rem solid ${palette.border.lines}` : 'none',
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
  collapsedIconsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default BucketHeader;

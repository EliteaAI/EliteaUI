import { memo, useCallback, useState } from 'react';

import { Box, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';

import DatasetIcon from '@/assets/dataset-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import CheckIcon from '@/components/Icons/CheckIcon';

const BucketStorageSelector = memo(props => {
  const { storageOptions, configurationTitle, onStorageChange } = props;

  const [storageMenuAnchor, setStorageMenuAnchor] = useState(null);
  const styles = bucketStorageSelectorStyles();

  const currentStorage = storageOptions?.find(s => s.value === configurationTitle);

  const handleMenuOpen = useCallback(event => {
    setStorageMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setStorageMenuAnchor(null);
  }, []);

  const handleStorageSelect = useCallback(
    storageUID => {
      onStorageChange?.(storageUID);
      setStorageMenuAnchor(null);
    },
    [onStorageChange],
  );

  const createStorageSelectHandler = useCallback(
    storageUID => () => {
      handleStorageSelect(storageUID);
    },
    [handleStorageSelect],
  );

  return (
    <>
      <Box
        sx={styles.container}
        onClick={handleMenuOpen}
      >
        <DatasetIcon sx={styles.icon} />
        <Box sx={styles.content}>
          <Typography
            variant="bodyMedium"
            sx={styles.storageTitle}
          >
            {currentStorage?.label || configurationTitle || 'Select Storage'}
          </Typography>
        </Box>
        <Box
          component={ArrowDownIcon}
          sx={styles.chevron}
        />
      </Box>

      {/* Storage Selection Menu */}
      <Menu
        anchorEl={storageMenuAnchor}
        open={Boolean(storageMenuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              ...styles.menuPaper,
              width: storageMenuAnchor?.offsetWidth - 16,
              marginTop: '0.25rem',
              marginLeft: '0.5rem',
            },
          },
          list: {
            sx: {
              width: '100%',
              padding: 0,
            },
          },
        }}
      >
        {storageOptions?.map(storage => {
          const isSelected = configurationTitle === storage.value;
          return (
            <MenuItem
              key={`storage-${storage.value}`}
              onClick={createStorageSelectHandler(storage.value)}
              selected={isSelected}
              sx={styles.menuItem}
            >
              <Box sx={styles.menuItemContent}>
                <Typography
                  variant="bodyMedium"
                  sx={styles.menuItemTitle}
                >
                  {storage.label || storage.title || storage.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={styles.menuItemSubtitle}
                >
                  {(storage.type || 'S3').toUpperCase()} Storage
                </Typography>
              </Box>
              <ListItemIcon sx={styles.listItemIcon}>
                {isSelected && <CheckIcon sx={{ width: '1rem', height: '1rem' }} />}
              </ListItemIcon>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
});

BucketStorageSelector.displayName = 'BucketStorageSelector';

/** @type {MuiSx} */
const bucketStorageSelectorStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.45rem 1.5rem',
    height: '2.55rem',
    borderBottom: '1px solid',
    borderColor: 'divider',
    cursor: 'pointer',
    backgroundColor: palette.background.tabPanel,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  icon: {
    width: '1.25rem',
    height: '1.25rem',
    color: 'text.secondary',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  storageTitle: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  chevron: {
    fontSize: '1.25rem',
    color: 'text.default',
  },
  menuPaper: ({ palette }) => ({
    boxShadow: palette.boxShadow.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    maxHeight: '18.75rem',
  }),
  menuItem: ({ palette }) => ({
    padding: '0.25rem 1rem',
    minHeight: '2.5rem',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&.Mui-selected': {
      backgroundColor: palette.background.participant.active,
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
    },
  }),
  listItemIcon: {
    minWidth: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.0125rem',
  },
  menuItemTitle: {
    color: 'text.secondary',
  },
  menuItemSubtitle: {
    color: 'text.tertiary',
  },
});

export default BucketStorageSelector;

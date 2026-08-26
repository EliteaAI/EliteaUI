import { memo } from 'react';

import { Box, Divider, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';

import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import UngroupIcon from '@/assets/ungroup.svg?react';
import CheckIcon from '@/components/Icons/CheckIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

const FolderMenuContent = memo(props => {
  const { folders, currentFolderId, onCreateClick, onFolderClick, onRemoveClick, minWidth } = props;

  const styles = folderMenuContentStyles();

  return (
    <>
      <Box sx={[styles.fixedTopSection, minWidth && { minWidth }]}>
        <MenuItem
          onClick={onCreateClick}
          sx={styles.menuItem}
        >
          <ListItemIcon sx={styles.menuItemIcon}>
            <PlusIcon sx={{ fontSize: '1rem' }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="labelMedium">Create Folder</Typography>
          </ListItemText>
        </MenuItem>
        <Divider sx={styles.divider} />
      </Box>

      <Box sx={styles.scrollableSection}>
        {folders.length > 0 ? (
          folders.map(folder => {
            const isCurrentFolder = folder.id === currentFolderId;
            const isPinned = !!folder.meta?.is_pinned;
            return (
              <MenuItem
                key={folder.id}
                onClick={e => onFolderClick(e, folder)}
                sx={[styles.menuItem, isCurrentFolder && styles.activeMenuItem]}
              >
                <ListItemIcon sx={styles.menuItemIcon}>
                  <FolderIcon sx={{ fontSize: '1rem' }} />
                </ListItemIcon>
                <ListItemText sx={styles.listItemText}>
                  <Typography
                    variant="labelMedium"
                    sx={styles.truncatedText}
                  >
                    {folder.name}
                  </Typography>
                </ListItemText>
                {isPinned && (
                  <Box
                    component={PinIconFilled}
                    sx={styles.pinIcon}
                  />
                )}
                {isCurrentFolder && <CheckIcon sx={styles.checkIcon} />}
              </MenuItem>
            );
          })
        ) : (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              No folders created yet
            </Typography>
          </Box>
        )}
      </Box>

      {currentFolderId && (
        <Box sx={styles.fixedBottomSection}>
          <Divider sx={styles.divider} />
          <MenuItem
            onClick={onRemoveClick}
            sx={styles.menuItem}
          >
            <ListItemIcon sx={styles.menuItemIcon}>
              <UngroupIcon sx={{ fontSize: '1rem' }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="labelMedium">Remove from folder</Typography>
            </ListItemText>
          </MenuItem>
        </Box>
      )}
    </>
  );
});

FolderMenuContent.displayName = 'FolderMenuContent';

/** @type {MuiSx} */
const folderMenuContentStyles = () => ({
  fixedTopSection: {
    flexShrink: 0,
    pt: '0.25rem',
    pb: '0.25rem',

    '> li': {
      marginBottom: '0.25rem',
    },

    hr: {
      marginTop: '0px !important',
      marginBottom: '0px !important',
    },
  },
  fixedBottomSection: {
    flexShrink: 0,
    pt: '0.25rem',
    pb: '0.25rem',

    '> li': {
      marginTop: '0.25rem',
    },
  },
  scrollableSection: {
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    maxHeight: '15rem',
  },
  menuItem: ({ palette }) => ({
    padding: '0.5rem 1rem',
    color: palette.text.secondary,
    '& .MuiListItemIcon-root': {
      color: palette.icon.fill.default,
    },
  }),
  activeMenuItem: ({ palette }) => ({
    backgroundColor: palette.background.tabButton.active,
  }),
  menuItemIcon: {
    minWidth: '1.5rem',
  },
  listItemText: {
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
    marginRight: '0.5rem',
  },
  truncatedText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  pinIcon: ({ palette }) => ({
    width: '0.75rem',
    height: '0.75rem',
    color: palette.secondary.main,
    flexShrink: 0,
  }),
  checkIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.secondary,
    marginLeft: '0.5rem',
  }),
  divider: {},
  emptyState: {
    padding: '0.75rem 1rem',
    textAlign: 'center',
  },
});

export default FolderMenuContent;

import { memo } from 'react';

import { Box, Divider, ListItemIcon, ListItemText, MenuItem, Typography, useTheme } from '@mui/material';

import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import UngroupIcon from '@/assets/ungroup.svg?react';
import CheckIcon from '@/components/Icons/CheckIcon';
import FolderIcon from '@/components/Icons/FolderIcon';

import { isFolderWritable } from '../lib/helpers';

const FolderMenuContent = memo(props => {
  const {
    folders,
    currentFolderId,
    onCreateClick,
    onFolderClick,
    onRemoveClick,
    canWrite,
    canCreate = canWrite,
    minWidth,
  } = props;
  const writableFolders = folders.filter(
    folder => folder.id === currentFolderId || (canWrite && isFolderWritable(folder)),
  );

  const { palette } = useTheme();
  const styles = folderMenuContentStyles();

  return (
    <>
      <Box sx={[styles.fixedTopSection, minWidth && { minWidth }]}>
        {canCreate && (
          <MenuItem
            onClick={onCreateClick}
            sx={styles.wideMenuItem}
          >
            <ListItemIcon sx={styles.menuItemIcon}>
              <Box
                component={PlusIcon}
                sx={styles.plusIcon}
              />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="labelMedium">Create Folder</Typography>
            </ListItemText>
          </MenuItem>
        )}
        <Divider sx={styles.divider} />
      </Box>

      <Box sx={styles.scrollableSection}>
        {writableFolders.length > 0 ? (
          writableFolders.map(folder => {
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
                {isCurrentFolder && (
                  <CheckIcon
                    sx={styles.checkIcon}
                    fill={palette.icon.fill.secondary}
                  />
                )}
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

      {currentFolderId && canWrite && (
        <Box sx={styles.fixedBottomSection}>
          <Divider sx={styles.divider} />
          <MenuItem
            onClick={onRemoveClick}
            sx={styles.wideMenuItem}
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
const folderMenuContentStyles = () => {
  const baseMenuItem = palette => ({
    padding: '0.5rem 1rem',
    display: 'flex',
    gap: '0.5rem',
    color: palette.text.secondary,
    '& .MuiListItemIcon-root': {
      color: palette.icon.fill.default,
    },
  });

  return {
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
      ...baseMenuItem(palette),
    }),
    wideMenuItem: ({ palette }) => ({
      ...baseMenuItem(palette),
      gap: '0.75rem',
    }),
    activeMenuItem: ({ palette }) => ({
      backgroundColor: palette.background.participant.active,
    }),
    menuItemIcon: {
      flex: '0 0 auto',
      minWidth: '0 !important',
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
    plusIcon: {
      fontSize: '1rem',
    },
    pinIcon: ({ palette }) => ({
      width: '0.75rem',
      height: '0.75rem',
      color: palette.secondary.main,
      flexShrink: 0,
    }),
    checkIcon: {
      fontSize: '1rem',
      marginLeft: '0.5rem',
    },
    divider: {},
    emptyState: {
      padding: '0.75rem 1rem',
      textAlign: 'center',
    },
  };
};

export default FolderMenuContent;

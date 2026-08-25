import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Divider, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';

import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import UngroupIcon from '@/assets/ungroup.svg?react';
import CheckIcon from '@/components/Icons/CheckIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import MoveTo from '@/components/Icons/MoveTo';
import PlusIcon from '@/components/Icons/PlusIcon';
import NestedMenuItem from '@/components/NestedMenuItem';
import useToast from '@/hooks/useToast';

import { getFolderEntityType } from '../lib/helpers';
import { useEntityFolders, useMoveEntityToFolder, useRemoveEntityFromFolder } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';

const MoveToFolderSubmenu = memo(props => {
  const { entityId, entityType, currentFolderId, parentMenuOpen, onAction, menuItemSx } = props;

  const folderEntityType = useMemo(() => getFolderEntityType(entityType), [entityType]);
  const { folders, isLoading: foldersLoading } = useEntityFolders(folderEntityType, {
    skip: !folderEntityType,
  });
  const { moveEntityToFolder, isLoading: isMoving } = useMoveEntityToFolder();
  const { removeEntityFromFolder, isLoading: isRemoving } = useRemoveEntityFromFolder();
  const { toastSuccess, toastError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isLoading = foldersLoading || isMoving || isRemoving;

  const handleFolderClick = useCallback(
    async (event, folder) => {
      event.stopPropagation();
      onAction?.();

      if (folder.id === currentFolderId) return;

      try {
        await moveEntityToFolder({
          folderId: folder.id,
          folderName: folder.name,
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess(`Moved to "${folder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, moveEntityToFolder, onAction, toastSuccess, toastError],
  );

  const handleRemoveFromFolder = useCallback(
    async event => {
      event.stopPropagation();
      onAction?.();

      try {
        await removeEntityFromFolder({
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess('Removed from folder');
      } catch {
        toastError('Failed to remove from folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, onAction, removeEntityFromFolder, toastSuccess, toastError],
  );

  const handleCreateFolderClick = useCallback(
    event => {
      event.stopPropagation();
      onAction?.();
      setCreateDialogOpen(true);
    },
    [onAction],
  );

  const handleFolderCreated = useCallback(
    async newFolder => {
      setCreateDialogOpen(false);
      if (!newFolder?.id) return;

      try {
        await moveEntityToFolder({
          folderId: newFolder.id,
          folderName: newFolder.name,
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess(`Moved to "${newFolder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, moveEntityToFolder, toastSuccess, toastError],
  );

  const styles = moveToFolderSubmenuStyles();

  if (!folderEntityType) return null;

  return (
    <>
      <NestedMenuItem
        leftIcon={<MoveTo sx={{ fontSize: '1rem' }} />}
        label="Move to folder"
        parentMenuOpen={parentMenuOpen}
        MenuItemComponent={MenuItem}
        disabled={isLoading}
        sx={menuItemSx}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        subMenuProps={{ MenuListProps: { sx: { py: 0 } } }}
      >
        <Box sx={styles.fixedTopSection}>
          <MenuItem
            onClick={handleCreateFolderClick}
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
                  onClick={e => handleFolderClick(e, folder)}
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
              onClick={handleRemoveFromFolder}
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
      </NestedMenuItem>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onFolderCreated={handleFolderCreated}
        entityType={folderEntityType}
      />
    </>
  );
});

MoveToFolderSubmenu.displayName = 'MoveToFolderSubmenu';

/** @type {MuiSx} */
const moveToFolderSubmenuStyles = () => ({
  fixedTopSection: {
    flexShrink: 0,
    minWidth: '13.75rem',

    marginTop: '0.25rem',
    marginBottom: '0.25rem',

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
    marginTop: '0.25rem',

    '> li': {
      marginBottom: '0.25rem',
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
  activeMenuItem: {
    backgroundColor: 'rgba(106, 232, 250, 0.1)',
  },
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

export default MoveToFolderSubmenu;

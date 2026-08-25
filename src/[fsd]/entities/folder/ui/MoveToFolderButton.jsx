import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import UngroupIcon from '@/assets/ungroup.svg?react';
import CheckIcon from '@/components/Icons/CheckIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import MoveTo from '@/components/Icons/MoveTo';
import PlusIcon from '@/components/Icons/PlusIcon';
import useToast from '@/hooks/useToast';

import { getFolderEntityType } from '../lib/helpers';
import { useEntityFolders, useMoveEntityToFolder, useRemoveEntityFromFolder } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';

const MoveToFolderButton = memo(props => {
  const { entityId, entityType, currentFolderId, isVisible = false } = props;

  const folderEntityType = useMemo(() => getFolderEntityType(entityType), [entityType]);
  const { folders, isLoading: foldersLoading } = useEntityFolders(folderEntityType, {
    skip: !folderEntityType,
  });
  const { moveEntityToFolder, isLoading: isMoving } = useMoveEntityToFolder();
  const { removeEntityFromFolder, isLoading: isRemoving } = useRemoveEntityFromFolder();
  const { toastSuccess, toastError } = useToast();

  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleButtonClick = useCallback(event => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(event => {
    event?.stopPropagation?.();
    setAnchorEl(null);
  }, []);

  const handleCreateFolderClick = useCallback(
    event => {
      event.stopPropagation();
      handleMenuClose(event);
      setCreateDialogOpen(true);
    },
    [handleMenuClose],
  );

  const handleCreateDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

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
        });
        toastSuccess(`Moved to "${newFolder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [entityId, folderEntityType, moveEntityToFolder, toastSuccess, toastError],
  );

  const handleFolderClick = useCallback(
    async (event, folder) => {
      event.stopPropagation();
      handleMenuClose(event);

      if (folder.id === currentFolderId) return;

      try {
        await moveEntityToFolder({
          folderId: folder.id,
          folderName: folder.name,
          entityType: folderEntityType,
          entityId,
        });
        toastSuccess(`Moved to "${folder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [
      currentFolderId,
      entityId,
      folderEntityType,
      handleMenuClose,
      moveEntityToFolder,
      toastSuccess,
      toastError,
    ],
  );

  const handleRemoveFromFolder = useCallback(
    async event => {
      event.stopPropagation();
      handleMenuClose(event);

      try {
        await removeEntityFromFolder({
          entityType: folderEntityType,
          entityId,
        });
        toastSuccess('Removed from folder');
      } catch {
        toastError('Failed to remove from folder');
      }
    },
    [entityId, folderEntityType, handleMenuClose, removeEntityFromFolder, toastSuccess, toastError],
  );

  const isLoading = foldersLoading || isMoving || isRemoving;
  const styles = moveToFolderButtonStyles(isVisible || isMenuOpen);

  if (!folderEntityType) return null;

  return (
    <>
      <StyledTooltip
        title="Move to folder"
        placement="top"
        enterDelay={1000}
        enterNextDelay={1000}
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.icon}
            onClick={handleButtonClick}
            disabled={isLoading}
            sx={styles.button}
            data-testid={`move-to-folder-btn-${entityId}`}
          >
            <MoveTo sx={{ fontSize: '1rem' }} />
          </Button.BaseBtn>
        </Box>
      </StyledTooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={e => e.stopPropagation()}
        slotProps={{
          paper: { sx: styles.menuPaper },
          list: { sx: styles.menuList },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Create folder - fixed at top */}
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

        {/* Folders list - scrollable */}
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

        {/* Remove from folder - fixed at bottom */}
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
      </Menu>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onFolderCreated={handleFolderCreated}
        entityType={folderEntityType}
      />
    </>
  );
});

MoveToFolderButton.displayName = 'MoveToFolderButton';

/** @type {MuiSx} */
const moveToFolderButtonStyles = isVisible => ({
  button: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    minWidth: '1.75rem',
    padding: 0,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    color: palette.icon.fill.default,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: palette.background.button.secondary.default,
    },
  }),
  menuPaper: ({ palette }) => ({
    minWidth: '12rem',
    maxWidth: '18rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  menuList: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '20rem',
  },
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

export default MoveToFolderButton;

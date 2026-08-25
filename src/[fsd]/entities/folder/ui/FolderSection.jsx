import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

import { useEntityFolders, usePinFolder } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';
import DeleteFolderDialog from './DeleteFolderDialog';
import FolderActionsMenu from './FolderActionsMenu';
import FolderItem from './FolderItem';

const FolderSection = memo(props => {
  const { entityType, title = 'Folders', onFolderSelect, selectedFolderId } = props;

  const { folders, isLoading, isError } = useEntityFolders(entityType, { includeCounts: true });
  const { togglePin } = usePinFolder(entityType);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuFolder, setMenuFolder] = useState(null);

  const styles = folderSectionStyles();

  const handleOpenCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleFolderClick = useCallback(
    folder => {
      onFolderSelect?.(folder);
    },
    [onFolderSelect],
  );

  const handleMenuOpen = useCallback((e, folder) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuFolder(folder);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuFolder(null);
  }, []);

  const handlePin = useCallback(() => {
    if (menuFolder) {
      togglePin(menuFolder);
    }
    handleMenuClose();
  }, [menuFolder, togglePin, handleMenuClose]);

  const handleEdit = useCallback(() => {
    setEditFolder(menuFolder);
    handleMenuClose();
  }, [menuFolder, handleMenuClose]);

  const handleCloseEditDialog = useCallback(() => {
    setEditFolder(null);
  }, []);

  const handleDelete = useCallback(() => {
    setDeleteFolder(menuFolder);
    handleMenuClose();
  }, [menuFolder, handleMenuClose]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteFolder(null);
  }, []);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography
          component="div"
          variant="subtitle"
          sx={styles.title}
        >
          {title}
        </Typography>
        <StyledTooltip
          title="Create folder"
          placement="top"
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<PlusIcon />}
            onClick={handleOpenCreateDialog}
            data-testid="folders-panel-create-btn"
          />
        </StyledTooltip>
      </Box>

      <Box sx={styles.folderList}>
        {isLoading && <Typography variant="bodyMedium">Loading folders...</Typography>}

        {!isLoading && !isError && folders.length === 0 && (
          <Typography
            variant="bodyMedium"
            sx={styles.emptyText}
          >
            No folders created yet
          </Typography>
        )}

        {!isLoading && !isError && folders.length > 0 && (
          <Box sx={styles.folders}>
            {folders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isSelected={selectedFolderId === folder.id}
                onClick={handleFolderClick}
                onMenuClick={handleMenuOpen}
              />
            ))}
          </Box>
        )}

        {isError && <Typography variant="labelSmall">Failed to load folders</Typography>}
      </Box>

      <FolderActionsMenu
        anchorEl={menuAnchorEl}
        folder={menuFolder}
        onClose={handleMenuClose}
        onPin={handlePin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        entityType={entityType}
      />

      <CreateFolderDialog
        open={!!editFolder}
        onClose={handleCloseEditDialog}
        entityType={entityType}
        folder={editFolder}
      />

      <DeleteFolderDialog
        open={!!deleteFolder}
        onClose={handleCloseDeleteDialog}
        folder={deleteFolder}
        entityType={entityType}
      />
    </Box>
  );
});

FolderSection.displayName = 'FolderSection';

/** @type {MuiSx} */
const folderSectionStyles = () => ({
  container: {
    marginBottom: '1.5rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  title: ({ palette }) => ({
    color: palette.secondary.main,
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '6%',
  }),
  folderList: {
    minHeight: '1.5rem',
    maxHeight: '12rem',
    overflowY: 'auto',
    padding: '0.25rem 0.375rem 0.375rem',
    margin: '0 -0.375rem -0.375rem',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  loadingText: {
    fontSize: '.875rem',
  },
  emptyText: ({ palette }) => ({
    fontSize: '.875rem',
    color: palette.background.button.primary.disabled,
  }),
  folders: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
  },
});

export default FolderSection;

import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { PERMISSIONS } from '@/common/constants';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import useToast from '@/hooks/useToast';

import { isFolderWritable } from '../lib/helpers';
import { useEntityFolders, usePinFolder } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';
import DeleteFolderDialog from './DeleteFolderDialog';
import FolderActionsMenu from './FolderActionsMenu';
import FolderItem from './FolderItem';
import FolderManagePermissionsModal from './FolderManagePermissionsModal';

const VISIBLE_FOLDER_COUNT = 6;

const FolderSection = memo(props => {
  const {
    entityType,
    title = 'Folders',
    onFolderSelect,
    selectedFolderId,
    onExpandChange,
    onFolderDelete,
  } = props;

  const { isTeam } = useProjectType();
  const { checkPermission } = useCheckPermission();
  const canCreateFolder = checkPermission(PERMISSIONS.entityFolders.create);
  const canManagePermissions = isTeam && checkPermission(PERMISSIONS.entityFolders.managePermissions);
  const hasFolderWritePermission = checkPermission(PERMISSIONS.entityFolders.update);
  const canWriteFolder = useCallback(
    folder => hasFolderWritePermission && isFolderWritable(folder),
    [hasFolderWritePermission],
  );

  const styles = folderSectionStyles();

  const { folders, isLoading, isError } = useEntityFolders(entityType, { includeCounts: true });
  const { togglePin } = usePinFolder(entityType);
  const { toastError } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuFolder, setMenuFolder] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [managePermissionsFolder, setManagePermissionsFolder] = useState(null);

  const hasMoreFolders = folders.length > VISIBLE_FOLDER_COUNT;
  const visibleFolders = useMemo(() => {
    if (!hasMoreFolders || isExpanded) return folders;
    return folders.slice(0, VISIBLE_FOLDER_COUNT);
  }, [folders, hasMoreFolders, isExpanded]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const next = !prev;
      onExpandChange?.(next);
      return next;
    });
  }, [onExpandChange]);

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
  }, []);

  const handlePin = useCallback(async () => {
    const folder = menuFolder;
    handleMenuClose();
    if (!folder) return;
    try {
      await togglePin(folder);
    } catch {
      toastError('Failed to update folder');
    } finally {
      setMenuFolder(null);
    }
  }, [menuFolder, togglePin, handleMenuClose, toastError]);

  const handleEdit = useCallback(() => {
    setEditFolder(menuFolder);
    handleMenuClose();
  }, [menuFolder, handleMenuClose]);

  const handleCloseEditDialog = useCallback(() => {
    setEditFolder(null);
    setMenuFolder(null);
  }, []);

  const handleDelete = useCallback(() => {
    setDeleteFolder(menuFolder);
    handleMenuClose();
  }, [menuFolder, handleMenuClose]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteFolder(null);
    setMenuFolder(null);
  }, []);

  const handlePermission = useCallback(() => {
    setManagePermissionsFolder(menuFolder);
    handleMenuClose();
  }, [menuFolder, handleMenuClose]);

  const handleClosePermission = useCallback(() => {
    setManagePermissionsFolder(null);
    setMenuFolder(null);
  }, []);

  const onDeleteFolder = useCallback(
    folder => {
      handleCloseDeleteDialog();
      onFolderDelete?.(folder);
    },
    [handleCloseDeleteDialog, onFolderDelete],
  );

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
        {canCreateFolder && (
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
        )}
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
            {visibleFolders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isSelected={selectedFolderId === folder.id}
                onClick={handleFolderClick}
                onMenuClick={handleMenuOpen}
                showActionsMenu={canWriteFolder(folder)}
              />
            ))}
          </Box>
        )}

        {isError && <Typography variant="labelSmall">Failed to load folders</Typography>}
      </Box>

      {hasMoreFolders && (
        <Typography
          variant="bodyMedium"
          sx={styles.showMoreLink}
          onClick={handleToggleExpand}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Typography>
      )}

      <FolderActionsMenu
        anchorEl={menuAnchorEl}
        folder={menuFolder}
        onClose={handleMenuClose}
        onPin={handlePin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPermission={handlePermission}
        canManagePermissions={canManagePermissions}
        canWrite={canWriteFolder(menuFolder)}
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
        onDelete={onDeleteFolder}
        folder={deleteFolder}
        entityType={entityType}
      />

      <FolderManagePermissionsModal
        open={!!managePermissionsFolder}
        onClose={handleClosePermission}
        folderId={managePermissionsFolder?.id}
        folderName={managePermissionsFolder?.name}
      />
    </Box>
  );
});

FolderSection.displayName = 'FolderSection';

const folderSectionStyles = () => ({
  container: {
    marginBottom: '1.5rem',
    flexShrink: 0,
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
    padding: '0.25rem 0 0.375rem',
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
  showMoreLink: ({ palette }) => ({
    color: palette.primary.main,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    marginTop: '0.5rem',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
});

export default FolderSection;

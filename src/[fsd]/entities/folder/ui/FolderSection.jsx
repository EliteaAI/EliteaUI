import { memo, useCallback, useState } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

import { useEntityFolders } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';
import FolderItem from './FolderItem';

const FolderSection = memo(props => {
  const { entityType, title = 'Folders', onFolderSelect, selectedFolderId } = props;

  const { folders, isLoading, isError } = useEntityFolders(entityType, { includeCounts: true });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
        {isLoading && (
          <Box sx={styles.skeletonContainer}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                sx={styles.skeleton}
              />
            ))}
          </Box>
        )}

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
              />
            ))}
          </Box>
        )}

        {isError && (
          <Typography
            variant="labelSmall"
            sx={styles.errorText}
          >
            Failed to load folders
          </Typography>
        )}
      </Box>

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
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
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  skeleton: ({ palette }) => ({
    height: '2rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.tabButton.default,
  }),
  emptyText: ({ palette }) => ({
    fontSize: '.875rem',
    color: palette.background.button.primary.disabled,
  }),
  errorText: ({ palette }) => ({
    color: palette.error.main,
  }),
  folders: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

export default FolderSection;

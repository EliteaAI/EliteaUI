import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import ViewFileIcon from '@/assets/icons/ViewFileIcon.svg?react';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';

import { ARTIFACT_TYPES } from './constants';

/**
 * Action buttons for artifact table rows
 * Shows preview button (if applicable) and a dots menu with download, move to, and delete options
 */
const ArtifactRowActions = memo(props => {
  const { row, onPreview, onDownload, onDelete } = props;

  const handlePreview = useCallback(
    e => {
      e.stopPropagation();
      onPreview(row);
    },
    [onPreview, row],
  );

  const handleDownload = useCallback(() => {
    onDownload(row);
  }, [onDownload, row]);

  const handleDelete = useCallback(() => {
    onDelete(row);
  }, [onDelete, row]);

  const menuItems = useMemo(() => {
    // Only show actions for files, not for folders
    const isFile = row.type === ARTIFACT_TYPES.FILE;
    const items = [];

    if (isFile) {
      items.push({
        label: 'Download',
        icon: <DownloadIcon sx={styles.menuIcon} />,
        onClick: handleDownload,
      });

      items.push({
        label: 'Delete',
        icon: <DeleteIcon sx={styles.menuIcon} />,
        entityName: row.name,
        shouldRequestInputName: false,
        inlineExtraContent: ` It can't be restored.`,
        modalSx: { paper: { width: '30rem' } },
        onConfirm: handleDelete,
      });
    }

    return items;
  }, [handleDownload, handleDelete, row.name, row.type]);

  return (
    <Box sx={styles.actionsContainer}>
      {row.type === ARTIFACT_TYPES.FILE && row.canPreview && (
        <Tooltip
          title="View/Edit file"
          placement="top"
        >
          <IconButton
            onClick={handlePreview}
            sx={styles.actionButton}
            size="small"
            aria-label={`Preview ${row.name}`}
          >
            <Box
              component={ViewFileIcon}
              sx={styles.actionIcon}
            />
          </IconButton>
        </Tooltip>
      )}
      {row.type === ARTIFACT_TYPES.FILE && (
        <DotMenu
          id={`artifact-actions-${row.id}`}
          slotProps={{
            ListItemText: {
              sx: styles.listItemText,
              primaryTypographyProps: { variant: 'bodyMedium' },
            },
            ListItemIcon: {
              sx: styles.listItemIcon,
            },
          }}
        >
          {menuItems}
        </DotMenu>
      )}
    </Box>
  );
});

ArtifactRowActions.displayName = 'ArtifactRowActions';

/** @type {MuiSx} */
const styles = {
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actionButton: {
    padding: '0.375rem',
    minWidth: 0,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  actionIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.primary,
    '&:hover': {
      color: palette.icon.fill.secondary,
    },
  }),
  menuIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  listItemText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  listItemIcon: {
    minWidth: '1rem !important',
    marginRight: '.75rem',
  },
};

export default ArtifactRowActions;

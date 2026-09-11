import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import ViewFileIcon from '@/assets/icons/ViewFileIcon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { ARTIFACT_TYPES } from './constants';

const ArtifactRowActions = memo(props => {
  const { row, onPreview, onDownload, onDelete, onRename } = props;

  const { checkPermission } = useCheckPermission();
  const { isPrivate } = useProjectType();

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

  const handleRename = useCallback(() => {
    onRename?.(row);
  }, [onRename, row]);

  const styles = artifactRowActionsStyles();

  const menuItems = useMemo(() => {
    const isFile = row.type === ARTIFACT_TYPES.FILE;
    const canEdit = isPrivate || checkPermission(PERMISSIONS.artifacts.edit);
    const canDelete = isPrivate || checkPermission(PERMISSIONS.artifacts.delete);
    const items = [];

    if (isFile) {
      items.push({
        key: 'artifacts-file-download',
        label: 'Download',
        icon: <DownloadIcon sx={styles.menuIcon} />,
        onClick: handleDownload,
      });

      if (canEdit) {
        items.push({
          key: 'artifacts-file-rename',
          label: 'Rename',
          icon: <EditPenIcon sx={styles.menuIcon} />,
          onClick: handleRename,
        });
      }

      if (canDelete) {
        items.push({
          key: 'artifacts-file-delete',
          label: 'Delete',
          icon: <DeleteIcon sx={styles.menuIcon} />,
          entityName: row.name,
          shouldRequestInputName: false,
          inlineExtraContent: `? It can't be restored.`,
          modalSx: { paper: { width: '30rem' } },
          onConfirm: handleDelete,
        });
      }
    }

    return items;
  }, [
    handleDownload,
    handleRename,
    handleDelete,
    row.name,
    row.type,
    isPrivate,
    checkPermission,
    styles.menuIcon,
  ]);

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
            data-testid={`artifacts-file-preview-button-${row.name}`}
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
const artifactRowActionsStyles = () => ({
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actionButton: ({ palette }) => ({
    padding: '0.375rem',
    minWidth: 0,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
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
    marginRight: '0.75rem',
  },
});

export default ArtifactRowActions;

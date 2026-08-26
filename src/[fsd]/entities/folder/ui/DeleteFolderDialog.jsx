import { memo, useCallback } from 'react';

import { Alert, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import useToast from '@/hooks/useToast';

import { FOLDER_ENTITY_LABELS } from '../lib/constants';
import { useDeleteFolder } from '../lib/hooks';

const DeleteFolderDialog = memo(props => {
  const { open, onClose, folder, entityType } = props;

  const { deleteFolder, isLoading } = useDeleteFolder();
  const { toastSuccess, toastError } = useToast();

  const entityLabelBase = FOLDER_ENTITY_LABELS[entityType];
  const entityLabel = entityLabelBase ? entityLabelBase.toLowerCase() + 's' : 'entities';

  const handleConfirm = useCallback(async () => {
    if (!folder) return;
    try {
      await deleteFolder({ folderId: folder.id, entityType });
      toastSuccess('Folder deleted successfully');
      onClose?.();
    } catch {
      toastError('Failed to delete folder');
    }
  }, [folder, entityType, deleteFolder, toastSuccess, toastError, onClose]);

  const extraContent = (
    <Alert
      severity="info"
      sx={styles.alert}
    >
      <Typography variant="bodyMedium">
        {`Deleting this folder will not delete the ${entityLabel} inside. They will be moved back to the main ${entityLabel} list.`}
      </Typography>
    </Alert>
  );

  return (
    <Modal.DeleteEntityModal
      open={open}
      title="Delete Folder"
      textContent="Are you sure to delete folder "
      name={folder?.name || ''}
      inlineExtraContent="?"
      extraContent={extraContent}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirming={isLoading}
      data-testid="delete-folder-dialog"
    />
  );
});

DeleteFolderDialog.displayName = 'DeleteFolderDialog';

/** @type {MuiSx} */
const styles = {
  alert: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.info.secondary}`,
    backgroundColor: palette.background.info,
    padding: '0.75rem 1rem',
    gap: '0.75rem',
    alignItems: 'flex-start',
    '& .MuiAlert-icon': {
      padding: 0,
      marginRight: 0,
      minHeight: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      '& .MuiSvgIcon-root': {
        width: '0.875rem',
        height: '0.875rem',
        color: palette.info.main,
      },
    },
    '& .MuiAlert-message': {
      padding: 0,
    },
  }),
};

export default DeleteFolderDialog;

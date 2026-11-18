import { memo } from 'react';

import { Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

/** Deleting a file is stored at once and Discard does not bring it back, so it asks first. */
const SkillFileDeleteDialog = memo(props => {
  const { open, path, isFolder = false, fileCount = 1, isLoading = false, onClose, onConfirm } = props;

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title={isFolder ? 'Delete folder?' : 'Delete file?'}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Delete"
      alarm
      confirming={isLoading}
      data-testid="skill-file-delete-dialog"
      confirmButtonTestId="skill-file-delete-confirm"
      content={
        <Typography variant="bodyMedium">
          {isFolder
            ? `${path} and the ${fileCount} ${fileCount === 1 ? 'file' : 'files'} in it will be deleted from this version. This cannot be undone.`
            : `${path} will be deleted from this version. This cannot be undone.`}
        </Typography>
      }
    />
  );
});

SkillFileDeleteDialog.displayName = 'SkillFileDeleteDialog';

export default SkillFileDeleteDialog;

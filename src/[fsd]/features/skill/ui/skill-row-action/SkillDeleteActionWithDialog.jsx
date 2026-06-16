import { memo, useCallback, useState } from 'react';

import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import DeleteIcon from '@/components/Icons/DeleteIcon';

import SkillRowMenuItem from './SkillRowMenuItem';

const SkillDeleteActionWithDialog = memo(props => {
  const { name, onConfirm, closeMenu } = props;
  const [open, setOpen] = useState(false);
  const skipConfirmation = useDeleteConfirmationDisabled();

  const openDialog = useCallback(() => {
    if (skipConfirmation) {
      onConfirm?.();
      closeMenu();
      return;
    }
    closeMenu();
    setOpen(true);
  }, [closeMenu, skipConfirmation, onConfirm]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onClickConfirm = useCallback(() => {
    onConfirm?.();
    setOpen(false);
  }, [onConfirm]);

  return (
    <>
      <SkillRowMenuItem
        icon={<DeleteIcon fontSize="inherit" />}
        label="Delete"
        onClick={openDialog}
      />
      <Modal.DeleteEntityModal
        name={name}
        open={open}
        onClose={onClose}
        onCancel={onClose}
        onConfirm={onClickConfirm}
        shouldRequestInputName
      />
    </>
  );
});

SkillDeleteActionWithDialog.displayName = 'SkillDeleteActionWithDialog';

export default SkillDeleteActionWithDialog;

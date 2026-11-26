import { memo } from 'react';

import { Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

export const RunHistoryDeleteModal = memo(props => {
  const { open, onClose, onConfirm } = props;
  return (
    <Modal.DeleteEntityModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Remove run?"
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      customContent={<Typography variant="bodyMedium">Are you sure you want to remove this run?</Typography>}
      confirmButtonText="Remove"
    />
  );
});

RunHistoryDeleteModal.displayName = 'RunHistoryDeleteModal';

export default RunHistoryDeleteModal;

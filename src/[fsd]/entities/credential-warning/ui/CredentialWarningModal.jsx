import { memo } from 'react';

import { Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';

const CredentialWarningModal = memo(props => {
  const { open, onConfirm, onCancel, onClose } = props;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Credential Configuration Change"
      content={
        <Typography variant="bodyMedium">
          Changing the credential may make this toolkit non-operational for other team members who do not have
          a matching Private credential. Make this decision considering the potential impact on your team.
        </Typography>
      }
      actions={
        <>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={onCancel}
          >
            Discard changes
          </Button.BaseBtn>
          <Button.BaseBtn
            variant="elitea"
            color="alarm"
            onClick={onConfirm}
          >
            Confirm changes
          </Button.BaseBtn>
        </>
      }
    />
  );
});

CredentialWarningModal.displayName = 'CredentialWarningModal';

export default CredentialWarningModal;

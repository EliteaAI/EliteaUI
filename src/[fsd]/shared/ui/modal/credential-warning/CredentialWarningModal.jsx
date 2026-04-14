import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import ErrorIcon from '@/assets/error-icon.svg?react';
import AlertDialog from '@/components/AlertDialog';

const CredentialWarningModal = memo(({ open, onConfirm, onCancel, onClose }) => {
  return (
    <AlertDialog
      alarm
      open={open}
      onClose={onClose}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={
        <Box sx={styles.container}>
          <Box
            component={ErrorIcon}
            sx={styles.icon}
          />
          <Typography variant="headingSmall">Credential Configuration Change</Typography>
        </Box>
      }
      alertContent={
        <Typography variant="bodyMedium">
          Changing the credential may make this toolkit non-operational for other team members who do not have
          a matching Private credential. Make this decision considering the potential impact on your team.
        </Typography>
      }
      confirmButtonText="Confirm Change"
      cancelButtonText="Discard Change"
    />
  );
});

CredentialWarningModal.displayName = 'CredentialWarningModal';

export default CredentialWarningModal;

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1rem',
    color: ({ palette }) => palette.icon.fill.error,
    flexShrink: 0,
    marginTop: '0.1rem',
  },
};

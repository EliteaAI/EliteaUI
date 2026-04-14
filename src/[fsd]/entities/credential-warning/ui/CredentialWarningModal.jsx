import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import ErrorIcon from '@/assets/error-icon.svg?react';

const CredentialWarningModal = memo(props => {
  const { open, onConfirm, onCancel, onClose } = props;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        <Box sx={styles.titleContainer}>
          <Box
            component={ErrorIcon}
            sx={styles.icon}
          />
          <Typography variant="headingSmall">Credential Configuration Change</Typography>
        </Box>
      }
      content={
        <Typography variant="bodyMedium">
          Changing the credential may make this toolkit non-operational for other team members who do not have
          a matching Private credential. Make this decision considering the potential impact on your team.
        </Typography>
      }
      actions={
        <>
          <Button
            variant="elitea"
            color="secondary"
            onClick={onCancel}
            disableRipple
          >
            Discard changes
          </Button>
          <Button
            variant="elitea"
            color="alarm"
            onClick={onConfirm}
            disableRipple
          >
            Confirm changes
          </Button>
        </>
      }
    />
  );
});

CredentialWarningModal.displayName = 'CredentialWarningModal';

export default CredentialWarningModal;

/** @type {MuiSx} */
const styles = {
  titleContainer: {
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

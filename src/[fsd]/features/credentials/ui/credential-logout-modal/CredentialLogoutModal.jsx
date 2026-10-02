import { memo } from 'react';

import { Box, Link, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

const MY_APPS_URL = 'https://myapps.microsoft.com';

// Logout only removes the token from this browser. It doesn't sign out of the provider or revoke
// the token or the consent, so the text says what stays granted and where to revoke it.
const CredentialLogoutModal = memo(props => {
  const { open, isMicrosoftEntra = false, onClose, onConfirm } = props;

  const styles = credentialLogoutModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Typography
        variant="bodyMedium"
        component="div"
      >
        ELITEA removes the sign-in for this credential from this browser. Toolkits that use it ask you to log
        in again.
      </Typography>
      {isMicrosoftEntra ? (
        <Typography
          variant="bodyMedium"
          component="div"
          data-testid="credential-logout-modal-microsoft-note"
        >
          Microsoft keeps the permissions you granted, and you stay signed in to Microsoft in this browser.
          The next login can skip the sign-in and consent screens, and the new token again has every
          permission you granted before. To revoke permissions, open the app&apos;s Manage your application
          page at{' '}
          <Link
            href={MY_APPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={styles.link}
          >
            myapps.microsoft.com
          </Link>{' '}
          or ask your Microsoft Entra admin.
        </Typography>
      ) : (
        <Typography
          variant="bodyMedium"
          component="div"
          data-testid="credential-logout-modal-provider-note"
        >
          The provider keeps the permissions you granted. To revoke them, use the provider&apos;s account
          settings.
        </Typography>
      )}
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={ModalConstants.MODAL_ICON_TYPE.info}
      title="Log out of this credential?"
      content={content}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Log out"
      data-testid="credential-logout-modal"
      confirmButtonTestId="credential-logout-modal-confirm"
      cancelButtonTestId="credential-logout-modal-cancel"
    />
  );
});

CredentialLogoutModal.displayName = 'CredentialLogoutModal';

/** @type {MuiSx} */
const credentialLogoutModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  link: {
    color: 'inherit',
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
});

export default CredentialLogoutModal;

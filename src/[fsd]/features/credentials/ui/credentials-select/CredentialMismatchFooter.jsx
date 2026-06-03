import { memo } from 'react';

import { FormControl, FormHelperText } from '@mui/material';

import CredentialWarningBanner from '@/components/CredentialWarningBanner';

const CredentialMismatchFooter = memo(props => {
  const { mismatchedPrivateCredential, credentialId, credentialType, section } = props;

  if (mismatchedPrivateCredential) {
    return (
      <CredentialWarningBanner
        credentialId={credentialId}
        credentialType={credentialType}
        section={section}
      />
    );
  }

  return (
    <FormControl
      error
      fullWidth
    >
      <FormHelperText>Your configuration does not match any available configurations.</FormHelperText>
    </FormControl>
  );
});

CredentialMismatchFooter.displayName = 'CredentialMismatchFooter';

export default CredentialMismatchFooter;

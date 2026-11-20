import { memo } from 'react';

import { Typography } from '@mui/material';

import { ToolValidationConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { Banner, Chip } from '@/[fsd]/shared/ui';
import CredentialWarningBanner from '@/components/CredentialWarningBanner';

const { CREDENTIAL_NOT_FOUND, CONFIGURATION_MODEL_NOT_FOUND } = ToolValidationConstants;

const PRIVATE_CREDENTIAL_NOT_FOUND = 'private_credential_not_found';

const ToolValidationBanner = memo(props => {
  const { tool, validation } = props;
  const { validationInfo, governedRefusal, toolValidationMessage, errorType, isForeignPrivateCredential } =
    validation;

  const styles = toolValidationBannerStyles();

  if (!validationInfo) return null;

  if (governedRefusal) {
    return (
      <Banner.BannerMessage containerSx={styles.containerBanner}>
        <Typography variant="labelSmall">{governedRefusal.message}</Typography>
        <Chip.ErrorCodeChip
          code={governedRefusal.code}
          testId="tool-refusal-code-chip"
        />
      </Banner.BannerMessage>
    );
  }

  if (isForeignPrivateCredential) {
    return (
      <CredentialWarningBanner
        credentialId={toolValidationMessage.credential_id}
        credentialType={tool?.type}
        section="credentials"
      />
    );
  }

  if (errorType === CREDENTIAL_NOT_FOUND || errorType === PRIVATE_CREDENTIAL_NOT_FOUND) {
    return (
      <Banner.BannerMessage
        containerSx={styles.containerBanner}
        message="Your configuration does not match any available configurations."
      />
    );
  }

  if (errorType === CONFIGURATION_MODEL_NOT_FOUND) {
    return (
      <Banner.BannerMessage
        containerSx={styles.containerBanner}
        message={`Model "${toolValidationMessage.model_name}" is no longer available in project configurations.`}
      />
    );
  }

  return (
    <Banner.BannerMessage
      containerSx={styles.containerBanner}
      message={
        typeof toolValidationMessage === 'string'
          ? toolValidationMessage
          : toolValidationMessage?.message || JSON.stringify(toolValidationMessage)
      }
    />
  );
});

ToolValidationBanner.displayName = 'ToolValidationBanner';

/** @type {MuiSx} */
const toolValidationBannerStyles = () => ({
  containerBanner: {
    marginTop: 0,
  },
});

export default ToolValidationBanner;

import { useMemo } from 'react';

import { Box } from '@mui/material';

import { usePublishVersion } from '@/[fsd]/entities/version/lib/hooks';
import PublishWizardModal from '@/[fsd]/entities/version/ui/PublishWizardModal';
import PublishIcon from '@/assets/publish-version.svg?react';

export const usePublishApplicationMenu = onSuccess => {
  const {
    canPublish,
    isAdminPublish,
    showModal,
    step,
    versionName,
    setVersionName,
    agreed,
    setAgreed,
    validationResult,
    publishError,
    versionNameError,
    isValidating,
    handleOpenModal,
    handleCloseModal,
    handleContinue,
    handlePublish,
  } = usePublishVersion(onSuccess);

  const publishDialog = useMemo(
    () => (
      <PublishWizardModal
        open={showModal}
        isAdminPublish={isAdminPublish}
        step={step}
        versionName={versionName}
        onVersionNameChange={setVersionName}
        agreed={agreed}
        onAgreedChange={setAgreed}
        validationResult={validationResult}
        publishError={publishError}
        versionNameError={versionNameError}
        isValidating={isValidating}
        onClose={handleCloseModal}
        onContinue={handleContinue}
        onPublish={handlePublish}
      />
    ),
    [
      showModal,
      isAdminPublish,
      step,
      versionName,
      setVersionName,
      agreed,
      setAgreed,
      validationResult,
      publishError,
      versionNameError,
      isValidating,
      handleCloseModal,
      handleContinue,
      handlePublish,
    ],
  );

  const menuItem = useMemo(
    () =>
      canPublish
        ? {
            label: 'Publish',
            icon: (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '1rem',
                  height: '1rem',
                  color: ({ palette }) => palette.icon.fill.default,
                }}
              >
                <PublishIcon sx={{ fontSize: '1rem' }} />
              </Box>
            ),
            disabled: false,
            onClick: handleOpenModal,
          }
        : null,
    [canPublish, handleOpenModal],
  );

  return {
    publishApplicationMenuItem: menuItem,
    publishDialog,
  };
};

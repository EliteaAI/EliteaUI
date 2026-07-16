import { useMemo } from 'react';

import { Box } from '@mui/material';

import PublishWizardModal from '@/[fsd]/entities/version/ui/PublishWizardModal';
import PublishIcon from '@/assets/publish-version.svg?react';

import { usePublishSkill } from './usePublishSkill.hooks';

export const usePublishSkillMenu = onSuccess => {
  const {
    canShowPublish,
    isPublishBlockedByPolicy,
    isAdminPublish,
    showModal,
    step,
    versionName,
    setVersionName,
    category,
    setCategory,
    categoryOptions,
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
  } = usePublishSkill(onSuccess);

  const publishDialog = useMemo(
    () => (
      <PublishWizardModal
        open={showModal}
        isAdminPublish={isAdminPublish}
        entityLabel="skill"
        step={step}
        versionName={versionName}
        onVersionNameChange={setVersionName}
        category={category}
        onCategoryChange={setCategory}
        categoryOptions={categoryOptions}
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
      category,
      setCategory,
      categoryOptions,
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
      canShowPublish
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
            disabled: isPublishBlockedByPolicy,
            onClick: handleOpenModal,
            ...(isPublishBlockedByPolicy && {
              slotProps: {
                MenuItem: {
                  menuItemProps: { title: 'Publishing is blocked by platform policy' },
                },
              },
            }),
          }
        : null,
    [canShowPublish, isPublishBlockedByPolicy, handleOpenModal],
  );

  return {
    publishSkillMenuItem: menuItem,
    publishDialog,
  };
};

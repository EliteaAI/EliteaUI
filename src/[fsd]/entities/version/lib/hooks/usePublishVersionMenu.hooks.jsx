import { useMemo } from 'react';

import { Box } from '@mui/material';

import { usePublishVersion } from '@/[fsd]/entities/version/lib/hooks';
import PublishIcon from '@/assets/publish-version.svg?react';
import { CREATE_PUBLIC_VERSION, PUBLISH } from '@/common/constants';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import InputVersionDialog from '@/pages/Common/Components/InputVersionDialog';

export const usePublishApplicationMenu = onSuccess => {
  const isFromPipeline = useIsFromPipelineDetail();

  const {
    canPublish,
    onConfirmVersion,
    onInputVersion,
    onSaveVersion,
    onCancelShowInputVersion,
    showInputVersion,
    newVersion,
  } = usePublishVersion(onSuccess);

  const publishDialog = useMemo(
    () => (
      <InputVersionDialog
        showTips
        open={showInputVersion}
        disabled={!newVersion}
        title={CREATE_PUBLIC_VERSION}
        doButtonTitle={PUBLISH}
        versionName={newVersion}
        disabledInput={false}
        onCancel={onCancelShowInputVersion}
        onConfirm={onConfirmVersion}
        onChange={onInputVersion}
      />
    ),
    [showInputVersion, newVersion, onCancelShowInputVersion, onConfirmVersion, onInputVersion],
  );

  const menuItem = useMemo(
    () =>
      canPublish && !isFromPipeline
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
            onClick: onSaveVersion,
          }
        : null,
    [canPublish, isFromPipeline, onSaveVersion],
  );

  return {
    publishApplicationMenuItem: menuItem,
    publishDialog,
  };
};

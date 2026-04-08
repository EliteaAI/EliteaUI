import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { useTrackEvent } from '@/GA';
import UnpublishConfirmModal from '@/[fsd]/entities/version/ui/UnpublishConfirmModal';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useUnpublishApplicationMutation } from '@/api';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import UnpublishIcon from '@/components/Icons/UnpublishIcon';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useUnpublishVersionMenu = onSuccess => {
  const isFromPipeline = useIsFromPipelineDetail();
  const trackEvent = useTrackEvent();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { version: versionId, tab } = useParams();

  const projectId = useSelectedProjectId();
  const { toastError, toastInfo } = useToast();

  const isModerationSpace = useMemo(() => pathname.startsWith('/moderation-space'), [pathname]);
  const isAdminContext = useMemo(
    () => isModerationSpace || projectId == PUBLIC_PROJECT_ID,
    [isModerationSpace, projectId],
  );

  const {
    values: {
      id: applicationId,
      name: agentName,
      version_details: { id: versionIdFromDetail, status: versionStatus } = {},
    } = {},
  } = useFormikContext();

  const [unpublish, { isLoading: isUnpublishingVersion, reset }] = useUnpublishApplicationMutation();

  const [showConfirm, setShowConfirm] = useState(false);

  const canUnpublish = useMemo(() => versionStatus === CollectionStatus.Published, [versionStatus]);

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const onUnpublish = useCallback(
    async (id, reason) => {
      const { error } = await unpublish({ projectId, versionId: id, body: { reason } });

      if (!error) {
        toastInfo('Agent has been successfully unpublished!');
        trackEvent(GA_EVENT_NAMES.AGENT_UNPUBLISHED, {
          [GA_EVENT_PARAMS.AGENT_ID]: applicationId || 'unknown',
          [GA_EVENT_PARAMS.AGENT_NAME]: agentName || 'unknown',
          [GA_EVENT_PARAMS.VERSION_ID]: id || 'unknown',
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
        onSuccess();
        setTimeout(() => {
          reset();
        }, 0);
        if (isAdminContext) {
          if (isModerationSpace) {
            navigate('/moderation-space/agents');
          } else {
            navigate(`/agents/${tab || 'latest'}`);
          }
        }
      } else {
        const errorMsg = error.data?.msg || error.data?.error || 'Failed to unpublish';
        toastError(errorMsg);
        setTimeout(() => {
          reset();
        }, 0);
      }
    },
    [
      agentName,
      applicationId,
      isAdminContext,
      isModerationSpace,
      navigate,
      onSuccess,
      projectId,
      tab,
      unpublish,
      reset,
      toastError,
      toastInfo,
      trackEvent,
    ],
  );

  const handleOpenConfirm = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleConfirmUnpublish = useCallback(
    reason => {
      setShowConfirm(false);
      onUnpublish(currentVersionId, reason);
    },
    [onUnpublish, currentVersionId],
  );

  const menuItem = useMemo(
    () =>
      canUnpublish && !isFromPipeline
        ? {
            label: 'Unpublish',
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
                <UnpublishIcon sx={{ fontSize: '1rem' }} />
              </Box>
            ),
            disabled: isUnpublishingVersion,
            onClick: handleOpenConfirm,
          }
        : null,
    [canUnpublish, isUnpublishingVersion, handleOpenConfirm, isFromPipeline],
  );

  const unpublishDialog = useMemo(
    () => (
      <UnpublishConfirmModal
        open={showConfirm}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmUnpublish}
        isLoading={isUnpublishingVersion}
        showReason={isAdminContext}
      />
    ),
    [showConfirm, handleCancelConfirm, handleConfirmUnpublish, isUnpublishingVersion, isAdminContext],
  );

  return {
    unpublishVersionMenuItem: menuItem,
    unpublishDialog,
  };
};

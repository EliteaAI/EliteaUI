import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useUnpublishApplicationMutation } from '@/api';
import { CollectionStatus } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import UnpublishIcon from '@/components/Icons/UnpublishIcon';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useUnpublishVersionMenu = onSuccess => {
  const isFromPipeline = useIsFromPipelineDetail();
  const trackEvent = useTrackEvent();

  const { version: versionId } = useParams();

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();

  const {
    values: {
      id: applicationId,
      name: agentName,
      version_details: { id: versionIdFromDetail, status: versionStatus } = {},
    } = {},
  } = useFormikContext();

  const [unpublish, { isLoading: isUnpublishingVersion, reset }] = useUnpublishApplicationMutation();

  const canUnpublish = useMemo(() => versionStatus === CollectionStatus.Published, [versionStatus]);

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const onUnpublish = useCallback(
    async id => {
      const { error } = await unpublish({ projectId, versionId: id });

      if (!error) {
        toastSuccess('The agent has been unpublished');
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
      } else {
        toastError(buildErrorMessage(error));
        setTimeout(() => {
          reset();
        }, 0);
      }
    },
    [agentName, applicationId, onSuccess, projectId, unpublish, reset, toastError, toastSuccess, trackEvent],
  );

  const handleUnpublish = useCallback(() => {
    onUnpublish(currentVersionId);
  }, [onUnpublish, currentVersionId]);

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
            onClick: handleUnpublish,
          }
        : null,
    [canUnpublish, isUnpublishingVersion, handleUnpublish, isFromPipeline],
  );

  return {
    unpublishVersionMenuItem: menuItem,
  };
};

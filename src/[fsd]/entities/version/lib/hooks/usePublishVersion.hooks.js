import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useTrackEvent } from '@/GA';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { usePublishApplicationMutation } from '@/api';
import { CollectionStatus, PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const usePublishVersion = onSuccess => {
  const { version: versionId } = useParams();
  const trackEvent = useTrackEvent();

  const projectId = useSelectedProjectId();
  const isFromPipeline = useIsFromPipelineDetail();
  const { toastSuccess, toastError } = useToast();

  const { permissions = [] } = useSelector(state => state.user);

  const {
    values: { id: applicationId, name: agentName, version_details = {}, versions = [], webhook_secret } = {},
  } = useFormikContext();
  const { id: versionIdFromDetail, status: versionStatus } = version_details;

  const [showInputVersion, setShowInputVersion] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const currentVersionName = useMemo(
    () => versions?.find(version => version.id === currentVersionId)?.name,
    [currentVersionId, versions],
  );

  const canPublish = useMemo(
    () => permissions.includes(PERMISSIONS.applications.publish) && versionStatus === CollectionStatus.Draft,
    [permissions, versionStatus],
  );

  const onSaveVersion = useCallback(() => {
    if (!showInputVersion) setShowInputVersion(true);
  }, [showInputVersion]);

  const onCancelShowInputVersion = useCallback(() => {
    setShowInputVersion(false);
    setNewVersion('');
  }, []);

  const { onCreateNewVersion, isSavingNewVersion } = useSaveNewVersion({
    toastError,
    applicationId,
    versionDetails: {
      ...version_details,
      id: undefined,
    },
    webhook_secret,
  });

  const [publish, { isLoading: isPublishingVersion, reset }] = usePublishApplicationMutation();

  const doPublish = useCallback(
    async id => {
      if (isFromPipeline) return toastError('Pipeline publishing is not supported.');

      const { error } = await publish({ projectId, versionId: id });
      if (!error) {
        toastSuccess('The agent has been published');
        trackEvent(GA_EVENT_NAMES.AGENT_PUBLISHED, {
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
    [
      agentName,
      applicationId,
      isFromPipeline,
      onSuccess,
      projectId,
      publish,
      reset,
      toastError,
      toastSuccess,
      trackEvent,
    ],
  );

  const handlePublishVersion = useCallback(async () => {
    const foundNameInTheList = versions.find(item => item.name === newVersion);

    if (!foundNameInTheList && newVersion) {
      const createdVersion = await onCreateNewVersion(newVersion);
      if (createdVersion?.data.id) await doPublish(createdVersion?.data.id);
    } else {
      if (currentVersionName !== LATEST_VERSION_NAME && currentVersionName === newVersion) {
        await doPublish(currentVersionId);
      } else {
        toastError(
          newVersion
            ? 'A version with that name already exists. Please pick a unique name.'
            : 'Empty version name is not allowed!',
        );
      }
    }
  }, [currentVersionId, currentVersionName, doPublish, newVersion, onCreateNewVersion, toastError, versions]);

  const onConfirmVersion = useCallback(() => {
    setShowInputVersion(false);
    handlePublishVersion();
  }, [handlePublishVersion]);

  const onInputVersion = useCallback(event => {
    const { target } = event;
    event.stopPropagation();
    setNewVersion(target?.value.trim());
  }, []);

  return {
    canPublish,
    onConfirmVersion,
    onInputVersion,
    onSaveVersion,
    onCancelShowInputVersion,
    isPublishingVersion,
    isSavingNewVersion,
    showInputVersion,
    newVersion,
  };
};

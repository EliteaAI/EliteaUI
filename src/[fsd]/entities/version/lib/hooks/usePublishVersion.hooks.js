import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useTrackEvent } from '@/GA';
import { PUBLISH_STEPS } from '@/[fsd]/entities/version/ui/PublishWizardModal';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { usePublishApplicationMutation, useValidateForPublishMutation } from '@/api';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import { CollectionStatus, PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const MAX_AI_RETRIES = 2;

export const usePublishVersion = onSuccess => {
  const { version: versionId, tab } = useParams();
  const trackEvent = useTrackEvent();
  const navigate = useNavigate();

  const projectId = useSelectedProjectId();
  const isFromPipeline = useIsFromPipelineDetail();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const { permissions = [] } = useSelector(state => state.user);

  const { values: { id: applicationId, name: agentName, version_details = {}, versions = [] } = {} } =
    useFormikContext();
  const { id: versionIdFromDetail, status: versionStatus } = version_details;

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const isAdminPublish = useMemo(() => projectId == PUBLIC_PROJECT_ID, [projectId]);

  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const isPublishBlockedByPolicy = useMemo(() => {
    if (!platformSettings?.is_publish_blocked) return false;
    if (isAdminPublish) return false;
    const whitelist = platformSettings?.publish_whitelist_project_ids || [];
    return !whitelist.includes(Number(projectId));
  }, [platformSettings, projectId, isAdminPublish]);

  const canShowPublish = useMemo(
    () => permissions.includes(PERMISSIONS.applications.publish) && versionStatus === CollectionStatus.Draft,
    [permissions, versionStatus],
  );

  const canPublish = useMemo(
    () => canShowPublish && !isPublishBlockedByPolicy,
    [canShowPublish, isPublishBlockedByPolicy],
  );

  // Wizard state
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(PUBLISH_STEPS.PREPARATION);
  const [versionName, setVersionName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationToken, setValidationToken] = useState(null);
  const [publishError, setPublishError] = useState(null);

  const versionNameError = useMemo(() => {
    const trimmed = versionName.trim();
    if (!trimmed) return null;
    return versions.some(v => v.name === trimmed)
      ? 'A version with this name already exists. Choose a different name.'
      : null;
  }, [versionName, versions]);

  const [validateForPublish, { isLoading: isValidating, reset: resetValidation }] =
    useValidateForPublishMutation();
  const [publish, { isLoading: isPublishing, reset: resetPublish }] = usePublishApplicationMutation();

  const resetState = useCallback(() => {
    setStep(PUBLISH_STEPS.PREPARATION);
    setVersionName('');
    setAgreed(false);
    setValidationResult(null);
    setValidationToken(null);
    setPublishError(null);
    resetValidation();
    resetPublish();
  }, [resetValidation, resetPublish]);

  const handleOpenModal = useCallback(() => {
    if (isFromPipeline) {
      toastError('Pipeline publishing is not supported.');
      return;
    }
    resetState();
    setShowModal(true);
  }, [isFromPipeline, toastError, resetState]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    resetState();
  }, [resetState]);

  const callWithAIRetry = useCallback(async (mutationTrigger, args) => {
    let result;
    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
      result = await mutationTrigger(args);
      if (
        !result.error ||
        result.error.status !== 400 ||
        result.error.data?.error !== 'ai_validation_failed'
      ) {
        return result;
      }
    }
    return result;
  }, []);

  const handleContinue = useCallback(async () => {
    setPublishError(null);
    setStep(PUBLISH_STEPS.VALIDATION);

    const { data, error } = await callWithAIRetry(validateForPublish, {
      projectId,
      versionId: currentVersionId,
      body: { version_name: versionName },
    });

    if (error) {
      // 422 = FAIL validation result — display normally
      if (error.status === 422 && error.data?.status === 'FAIL') {
        setValidationResult(error.data);
        setValidationToken(null);
        return;
      }

      // 400 version_name_invalid — go back to preparation with inline error
      if (error.status === 400 && error.data?.error === 'version_name_invalid') {
        setStep(PUBLISH_STEPS.PREPARATION);
        setPublishError(error.data?.msg || 'Invalid version name');
        return;
      }

      // Other errors — toast and go back
      const errorMsg = error.data?.msg || error.data?.error || 'Validation failed';
      toastError(errorMsg);
      setStep(PUBLISH_STEPS.PREPARATION);
    } else {
      setValidationResult(data);
      setValidationToken(data.validation_token);
    }
  }, [projectId, currentVersionId, versionName, validateForPublish, callWithAIRetry, toastError]);

  const handlePublish = useCallback(async () => {
    setPublishError(null);
    if (!isAdminPublish) {
      setStep(PUBLISH_STEPS.PUBLISHING);
    }

    const { data, error } = await callWithAIRetry(publish, {
      projectId,
      versionId: currentVersionId,
      body: {
        version_name: versionName,
        ...(validationToken ? { validation_token: validationToken } : {}),
      },
    });

    if (error) {
      const errorMsg = error.data?.msg || error.data?.error || 'Publishing failed';
      setPublishError(errorMsg);
    } else {
      // Handle 207 partial success (sub-agent warnings)
      if (data?.error) {
        toastWarning(data.msg || 'Agent published, but some sub-agents may not have been published.');
      }
      toastSuccess('The agent has been published');
      trackEvent(GA_EVENT_NAMES.AGENT_PUBLISHED, {
        [GA_EVENT_PARAMS.AGENT_ID]: applicationId || 'unknown',
        [GA_EVENT_PARAMS.AGENT_NAME]: agentName || 'unknown',
        [GA_EVENT_PARAMS.VERSION_ID]: currentVersionId || 'unknown',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });
      onSuccess();
      handleCloseModal();

      // Navigate to the published clone version
      const sourceVersionId = data?.source_version_id;
      if (sourceVersionId && applicationId) {
        navigate(`/agents/${tab || 'latest'}/${applicationId}/${sourceVersionId}?viewMode=owner`);
      }
    }
  }, [
    projectId,
    currentVersionId,
    versionName,
    validationToken,
    isAdminPublish,
    publish,
    callWithAIRetry,
    toastSuccess,
    toastWarning,
    trackEvent,
    applicationId,
    agentName,
    onSuccess,
    handleCloseModal,
    navigate,
    tab,
  ]);

  return {
    canPublish,
    canShowPublish,
    isPublishBlockedByPolicy,
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
    isPublishing,
    handleOpenModal,
    handleCloseModal,
    handleContinue,
    handlePublish,
  };
};

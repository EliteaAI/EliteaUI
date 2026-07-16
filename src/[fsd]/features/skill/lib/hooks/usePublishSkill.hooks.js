import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { PUBLISH_STEPS } from '@/[fsd]/entities/version/ui/PublishWizardModal';
import {
  useGetSkillCategoriesQuery,
  usePublishSkillMutation,
  useValidateSkillForPublishMutation,
} from '@/[fsd]/features/skill/api';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import { CollectionStatus, PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const MAX_AI_RETRIES = 2;

const extractErrorMessage = (error, fallback) => {
  const data = error?.data;
  if (!data) return fallback;
  if (data.msg) return data.msg;
  if (Array.isArray(data.error)) return data.error[0]?.msg || fallback;
  return typeof data.error === 'string' ? data.error : fallback;
};

export const usePublishSkill = onSuccess => {
  const { version: versionId } = useParams();

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const { permissions = [] } = useSelector(state => state.user);

  const { values: { id: skillId, version_details = {}, versions = [] } = {} } = useFormikContext();
  const { id: versionIdFromDetail, status: versionStatus } = version_details;

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const isAdminPublish = useMemo(() => Number(projectId) === PUBLIC_PROJECT_ID, [projectId]);

  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const isPublishBlockedByPolicy = useMemo(() => {
    if (!platformSettings?.is_publish_blocked) return false;
    if (isAdminPublish) return false;
    const whitelist = platformSettings?.publish_whitelist_project_ids || [];
    return !whitelist.includes(Number(projectId));
  }, [platformSettings, projectId, isAdminPublish]);

  const canShowPublish = useMemo(
    () => permissions.includes(PERMISSIONS.skills.publish) && versionStatus === CollectionStatus.Draft,
    [permissions, versionStatus],
  );

  const canPublish = useMemo(
    () => canShowPublish && !isPublishBlockedByPolicy,
    [canShowPublish, isPublishBlockedByPolicy],
  );

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(PUBLISH_STEPS.PREPARATION);
  const [versionName, setVersionName] = useState('');
  const [category, setCategory] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationToken, setValidationToken] = useState(null);
  const [publishError, setPublishError] = useState(null);

  const { data: categoriesData } = useGetSkillCategoriesQuery({ projectId }, { skip: !projectId });
  const categoryOptions = useMemo(
    () => (categoriesData?.categories || []).map(c => ({ label: c.name, value: c.name })),
    [categoriesData],
  );

  const versionNameError = useMemo(() => {
    const trimmed = versionName.trim();
    if (!trimmed) return null;
    return versions.some(v => v.name === trimmed)
      ? 'A version with this name already exists. Choose a different name.'
      : null;
  }, [versionName, versions]);

  const [validateSkillForPublish, { isLoading: isValidating, reset: resetValidation }] =
    useValidateSkillForPublishMutation();
  const [publish, { isLoading: isPublishing, reset: resetPublish }] = usePublishSkillMutation();

  const resetState = useCallback(() => {
    setStep(PUBLISH_STEPS.PREPARATION);
    setVersionName('');
    setCategory('');
    setAgreed(false);
    setValidationResult(null);
    setValidationToken(null);
    setPublishError(null);
    resetValidation();
    resetPublish();
  }, [resetValidation, resetPublish]);

  const handleOpenModal = useCallback(() => {
    resetState();
    setShowModal(true);
  }, [resetState]);

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

    const { data, error } = await callWithAIRetry(validateSkillForPublish, {
      projectId,
      skillId,
      versionId: currentVersionId,
      body: { version_name: versionName, category },
    });

    if (error) {
      if (error.status === 422 && error.data?.status === 'FAIL') {
        setValidationResult(error.data);
        setValidationToken(null);
        return;
      }

      toastError(extractErrorMessage(error, 'Validation failed'));
      setStep(PUBLISH_STEPS.PREPARATION);
    } else {
      setValidationResult(data);
      setValidationToken(data.validation_token);
    }
  }, [
    projectId,
    skillId,
    currentVersionId,
    versionName,
    category,
    validateSkillForPublish,
    callWithAIRetry,
    toastError,
  ]);

  const handlePublish = useCallback(async () => {
    setPublishError(null);
    if (!isAdminPublish) {
      setStep(PUBLISH_STEPS.PUBLISHING);
    }

    const { data, error } = await callWithAIRetry(publish, {
      projectId,
      skillId,
      versionId: currentVersionId,
      body: {
        version_name: versionName,
        category,
        ...(validationToken ? { validation_token: validationToken } : {}),
      },
    });

    if (error) {
      setPublishError(extractErrorMessage(error, 'Publishing failed'));
    } else {
      if (data?.error) {
        toastWarning(data.msg || 'Skill published, but some resources may not have been published.');
      } else {
        toastSuccess('The skill has been published');
      }
      onSuccess();
      handleCloseModal();
    }
  }, [
    projectId,
    skillId,
    currentVersionId,
    versionName,
    category,
    validationToken,
    isAdminPublish,
    publish,
    callWithAIRetry,
    toastSuccess,
    toastWarning,
    onSuccess,
    handleCloseModal,
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
    category,
    setCategory,
    categoryOptions,
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

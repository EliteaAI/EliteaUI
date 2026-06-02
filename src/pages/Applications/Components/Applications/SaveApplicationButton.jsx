import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Button } from '@mui/material';

import { conversationStartersHelpers } from '@/[fsd]/features/agent/lib/helpers';
import { useFormDirtyExcluding } from '@/[fsd]/shared/lib/hooks';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useSaveVersion from '@/hooks/application/useSaveVersion';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';
import RouteDefinitions from '@/routes';

export default function SaveApplicationButton({ onSuccess }) {
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const { values } = useFormikContext();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { stateValidationErrors, hasIrreversibleChanges } = useSelector(state => state.pipeline);

  const isFormDirtyExcluding = useFormDirtyExcluding();

  const { onSave, isSaving } = useSaveVersion();

  // Enhanced save function with callback support
  const handleSave = useCallback(async () => {
    // onSave returns savedVersionDetails (with cleaned llm_settings) on success, false on failure
    const savedVersionDetails = await onSave();
    if (savedVersionDetails) {
      onSuccess?.({ ...values, version_details: savedVersionDetails });
    }
  }, [onSave, onSuccess, values]);

  // Check if there are validation errors in state variables (cached in Redux)
  const hasStateErrors = useMemo(() => {
    return stateValidationErrors && Object.keys(stateValidationErrors).length > 0;
  }, [stateValidationErrors]);

  const hasEmptyStarters = useMemo(
    () =>
      (values?.version_details?.conversation_starters || []).some(
        s => !conversationStartersHelpers.toString(s).trim(),
      ),
    [values?.version_details?.conversation_starters],
  );

  const isButtonDisabled = useMemo(() => {
    const hasNoChanges = !isFormDirtyExcluding && !isYamlCodeDirty && !hasIrreversibleChanges;

    // In chat context (edit mode), skip field validation since version data comes without description
    if (isFromChat && !!values?.id) {
      return isSaving || hasNoChanges || hasStateErrors || hasEmptyStarters;
    }

    // For standalone pages, validate required fields
    const hasMissingFields = !values?.name || !values?.description;
    return isSaving || hasNoChanges || hasMissingFields || hasStateErrors || hasEmptyStarters;
  }, [
    isFormDirtyExcluding,
    isYamlCodeDirty,
    values?.name,
    values?.description,
    values?.id,
    isSaving,
    isFromChat,
    hasStateErrors,
    hasEmptyStarters,
    hasIrreversibleChanges,
  ]);

  return (
    <Button
      disabled={isButtonDisabled}
      variant="elitea"
      color="primary"
      onClick={onSuccess ? handleSave : onSave}
    >
      Save
      {isSaving && <StyledCircleProgress size={20} />}
    </Button>
  );
}

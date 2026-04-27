import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Button } from '@mui/material';

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
  const { stateValidationErrors } = useSelector(state => state.pipeline);

  const isFormDirtyExcluding = useFormDirtyExcluding();

  const { onSave, isSaving } = useSaveVersion();

  // Enhanced save function with callback support
  const handleSave = useCallback(async () => {
    await onSave();
    // Call the success callback with the current form values
    onSuccess?.(values);
  }, [onSave, onSuccess, values]);

  // Check if there are validation errors in state variables (cached in Redux)
  const hasStateErrors = useMemo(() => {
    return stateValidationErrors && Object.keys(stateValidationErrors).length > 0;
  }, [stateValidationErrors]);

  const isButtonDisabled = useMemo(() => {
    const hasNoChanges = !isFormDirtyExcluding && !isYamlCodeDirty;

    // In chat context (edit mode), skip field validation since version data comes without description
    if (isFromChat && !!values?.id) {
      return isSaving || hasNoChanges || hasStateErrors;
    }

    // For standalone pages, validate required fields
    const hasMissingFields = !values?.name || !values?.description;
    return isSaving || hasNoChanges || hasMissingFields || hasStateErrors;
  }, [
    isFormDirtyExcluding,
    isYamlCodeDirty,
    values?.name,
    values?.description,
    values?.id,
    isSaving,
    isFromChat,
    hasStateErrors,
  ]);

  return (
    <Button
      disabled={isButtonDisabled}
      variant="alita"
      color="primary"
      onClick={onSuccess ? handleSave : onSave}
    >
      Save
      {isSaving && <StyledCircleProgress size={20} />}
    </Button>
  );
}

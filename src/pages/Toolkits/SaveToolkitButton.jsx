import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@mui/material';

import { useToolkitEditMutation } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useToast from '@/hooks/useToast';

export default function SaveToolkitButton({
  toolSchema,
  onToolkitSaved,
  hasErrors,
  triggerValidation,
  projectId,
  onBeforeSave,
}) {
  const { dirty: isFormDirty, values, resetForm } = useFormikContext();
  const { toastError, toastSuccess } = useToast();

  const [onSave, { isLoading: isSaving }] = useToolkitEditMutation();

  const onSaveToolkit = useCallback(async () => {
    // Check for validation errors before saving
    if (hasErrors) {
      // Trigger validation display
      triggerValidation?.();
      return;
    }

    // Define the actual save function
    const performSave = async () => {
      try {
        const toolkitNameKey = Object.keys(toolSchema?.properties || {}).find(
          key => toolSchema?.properties?.[key]?.toolkit_name,
        );

        const toolkitData = {
          projectId,
          toolId: values?.id,
          ...values,
          name: toolkitNameKey ? values?.settings?.[toolkitNameKey] : values?.name,
        };

        const result = await onSave(toolkitData).unwrap();
        toastSuccess('The toolkit has been updated successfully');

        // Notify parent component that save was successful
        if (onToolkitSaved) {
          onToolkitSaved(result, toolkitData);
        }
        resetForm({ values });
      } catch (error) {
        toastError(buildErrorMessage(error) || 'An error occurred while saving. Please try again.');
        throw error;
      }
    };

    // Check for credential changes before saving (if callback provided)
    if (onBeforeSave) {
      const shouldProceed = onBeforeSave(performSave);
      if (shouldProceed) {
        await performSave();
      }
      // If shouldProceed is false, the callback will handle showing the warning modal
    } else {
      // No pre-save check, proceed directly
      await performSave();
    }
  }, [
    toolSchema?.properties,
    projectId,
    values,
    onSave,
    toastSuccess,
    toastError,
    onToolkitSaved,
    hasErrors,
    triggerValidation,
    resetForm,
    onBeforeSave,
  ]);

  const shouldDisableSave = useMemo(() => {
    return isSaving || !isFormDirty;
  }, [isSaving, isFormDirty]);

  return (
    <Button
      disabled={shouldDisableSave}
      variant="elitea"
      color="primary"
      onClick={onSaveToolkit}
    >
      {'Save'}
      {isSaving && <StyledCircleProgress size={20} />}
    </Button>
  );
}

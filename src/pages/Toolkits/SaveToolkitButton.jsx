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

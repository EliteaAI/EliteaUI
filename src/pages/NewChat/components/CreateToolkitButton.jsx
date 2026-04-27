import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@mui/material';

import { useToolkitCreateMutation } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export default function CreateToolkitButton({ toolSchema, onToolkitCreated, hasErrors, triggerValidation }) {
  const { dirty: isFormDirty, values } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const projectId = useSelectedProjectId();

  const [onCreate, { isLoading: isCreating }] = useToolkitCreateMutation();

  const onCreateToolkit = useCallback(async () => {
    // Check for validation errors before creating
    if (hasErrors) {
      // Trigger validation display
      if (triggerValidation) {
        triggerValidation();
      }
      toastError('Please fill in all required fields before creating the toolkit.');
      return;
    }

    try {
      const toolkitNameKey = Object.keys(toolSchema?.properties || {}).find(
        key => toolSchema?.properties?.[key]?.toolkit_name,
      );

      const toolkitData = {
        projectId,
        ...values,
        name: toolkitNameKey ? values?.settings?.[toolkitNameKey] : values?.name,
      };

      const result = await onCreate(toolkitData).unwrap();
      toastSuccess('The toolkit has been created successfully');

      // Call the creation callback if provided
      if (onToolkitCreated) {
        onToolkitCreated(result);
      }
    } catch (error) {
      toastError(
        buildErrorMessage(error) || 'An error occurred while creating the toolkit. Please try again.',
      );
      throw error;
    }
  }, [
    toolSchema?.properties,
    projectId,
    values,
    onCreate,
    toastSuccess,
    toastError,
    onToolkitCreated,
    hasErrors,
    triggerValidation,
  ]);

  const shouldDisableSave = useMemo(() => {
    return isCreating || !isFormDirty || !values?.type;
  }, [isCreating, isFormDirty, values?.type]);

  return (
    <Button
      disabled={shouldDisableSave}
      variant="alita"
      color="primary"
      onClick={onCreateToolkit}
    >
      {isCreating && <StyledCircleProgress size={16} />}
      Create
    </Button>
  );
}

import React, { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@mui/material';

import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useCreateApplication from '@/hooks/application/useCreateApplication';

/**
 * Reusable save button for creating applications/agents
 * Can be used in both standalone pages and chat context
 */
const CreateApplicationSaveButton = ({
  onSuccess,
  onError,
  disabled: externalDisabled = false,
  ...buttonProps
}) => {
  const formik = useFormikContext();

  // Use the same hook but skip navigation and provide custom onSuccess
  const { create, isLoading, error, isError } = useCreateApplication(
    formik,
    null, // no resetBlockNav needed
    {
      skipNavigation: true,
      onSuccess,
    },
  );

  const handleSave = useCallback(async () => {
    await formik.validateForm();
    if (!formik.isValid) {
      return;
    }

    await create();
  }, [create, formik]);

  // Handle errors from the hook (if additional handling needed)
  React.useEffect(() => {
    if (isError && error && onError) {
      onError(error);
    }
  }, [isError, error, onError]);

  const shouldDisableSave = useMemo(
    () => isLoading || !formik.values.name || !formik.values.description || !formik.dirty || externalDisabled,
    [formik.dirty, formik.values.description, formik.values.name, isLoading, externalDisabled],
  );

  return (
    <Button
      variant="alita"
      color="primary"
      disabled={shouldDisableSave}
      onClick={handleSave}
      {...buttonProps}
    >
      {'Save'}
      {isLoading && <StyledCircleProgress size={20} />}
    </Button>
  );
};

export default CreateApplicationSaveButton;

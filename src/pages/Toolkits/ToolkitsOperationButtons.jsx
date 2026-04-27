import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { Button, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { alitaApi } from '@/api/alitaApi.js';
import { useToolkitEditMutation } from '@/api/toolkits.js';
import eventEmitter from '@/common/eventEmitter';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledDialog, StyledDialogActions, StyledDialogContentText } from '@/components/StyledDialog';
import { useExtraValidation } from '@/hooks/application/useExtraValidation';
import useConfigurations from '@/hooks/useConfigurations.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import { ToolEvents } from '@/pages/Applications/Components/Tools/consts';

export default function ToolkitsOperationButtons({
  editToolDetail,
  isAdding,
  hasErrors = false,
  hasNotSavedToolConfiguration = false,
  setShowValidation = () => {},
  onCreateConfiguration,
  toolSchema,
}) {
  const validateReasonRef = useRef('');
  const { toastError, toastSuccess } = useToast();
  const { values, resetForm, setValues } = useFormikContext();
  const projectId = useSelectedProjectId();
  const dispatch = useDispatch();
  const [openAlert, setOpenAlert] = useState(false);
  const [, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Some fields have missing or invalid data!');

  const [onSave, { isError: isSaveError, isSuccess: isSaveSuccess, error: saveError }] =
    useToolkitEditMutation();

  const onValidateFailure = useCallback(() => {
    if (validateReasonRef.current) {
      eventEmitter.emit(ToolEvents.ResetValidateEvent, validateReasonRef.current);
      validateReasonRef.current = '';
    }
  }, []);

  const doValidate = useExtraValidation(editToolDetail);
  const doValidateRef = useRef(doValidate);
  useEffect(() => {
    doValidateRef.current = doValidate;
  }, [doValidate]);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
    onValidateFailure();
  }, [onValidateFailure]);

  //@todo: need to reset state for initial values on discard
  const handleDiscard = useCallback(async () => {
    setOpenAlert(false);
    onValidateFailure();
  }, [onValidateFailure]);

  const handleCancel = useCallback(async () => {
    setOpenAlert(false);
    onValidateFailure();

    resetForm(); //@todo: most likely, can be remove since a form is reseted when you click on new tool
  }, [onValidateFailure, resetForm]);

  const { refetchProjectIntegrations, refetchPrivateIntegrations } = useConfigurations();

  /**
   * Creates Toolkit without configurable properties
   *
   * Event: ToolEvents.ToolkitsCreateToolkit
   *
   * Step. Create (save) a new toolkit
   *
   */
  const handleCreateToolkit = useCallback(
    async reason => {
      validateReasonRef.current = reason;
      // console.log('handleCreateToolkit', hasErrors, hasNotSavedToolConfiguration);
      if (!hasErrors && !hasNotSavedToolConfiguration) {
        setTimeout(async () => {
          setIsProcessing(true);
          const { isValid, message } = await doValidateRef.current();
          if (isValid) {
            eventEmitter.emit(ToolEvents.SaveEvent, validateReasonRef.current);
            validateReasonRef.current = '';
            // }
          } else {
            setErrorMessage(message);
            onValidateFailure();
          }
        }, 0);
      } else {
        setShowValidation(true);
        onValidateFailure();
      }
    },
    [hasErrors, onValidateFailure, setShowValidation, hasNotSavedToolConfiguration],
  );

  /**
   * Creates Toolkit with configurable properties
   *
   * Event: ToolEvents.ToolkitsCreateToolkitWithConfiguration
   *
   * Step. Create configuration (credentials) or select them from the list
   * Step. Create (save) a new toolkit
   *
   * Toolkit configuration can be:
   * - not saved: user is going to create a new configuration
   * - saved: user selected configuration from the list
   */
  const handleCreateToolkitWithConfiguration = useCallback(
    async reason => {
      setOpenAlert(false);
      validateReasonRef.current = reason;
      if (hasErrors) {
        setShowValidation(true);
        // setOpenAlert(true);
        onValidateFailure();
      } else if (hasNotSavedToolConfiguration) {
        const success = await onCreateConfiguration();
        if (success) {
          refetchProjectIntegrations();
          refetchPrivateIntegrations();
        } else {
          onValidateFailure();
        }
      } else {
        setTimeout(async () => {
          setIsProcessing(true);
          const { isValid, message } = await doValidateRef.current();
          if (isValid) {
            //@todo: consider to remove handleGoBackRef.current since it is not need it in this action
            // await handleGoBackRef.current({ saveChanges: isDirty, onlySave: !!validateReasonRef.current });
            // if (validateReasonRef.current) {
            eventEmitter.emit(ToolEvents.SaveEvent, validateReasonRef.current);
            validateReasonRef.current = '';
            // }
          } else {
            // setOpenAlert(true)
            setErrorMessage(message);
            onValidateFailure();
          }
        }, 0);
      }
      // } else {
      //   onValidateFailure()
      // }
    },
    [
      hasErrors,
      onValidateFailure,
      onCreateConfiguration,
      setShowValidation,
      refetchProjectIntegrations,
      refetchPrivateIntegrations,
      hasNotSavedToolConfiguration,
    ],
  );

  /**
   * Creates Toolkit without configurable properties
   *
   * Event: ToolEvents.ToolkitsCreateToolkit
   *
   * Step. Create (save) a new toolkit
   *
   */
  const handleUpdateToolkit = useCallback(async () => {
    if (!hasErrors && !hasNotSavedToolConfiguration) {
      setTimeout(async () => {
        try {
          const toolkitNameKey = Object.keys(toolSchema?.properties || {}).find(
            key => toolSchema?.properties?.[key]?.toolkit_name,
          );
          const data = await onSave({
            projectId,
            toolId: values?.id,
            ...values,
            name: toolkitNameKey ? values?.settings?.[toolkitNameKey] : values?.name,
          }).unwrap();

          // Reset the form with the response data
          // resetForm({ values: data?.data || values }); // `data?.data` must match `initialValues`

          // Manually set form values instead of using resetForm
          await setValues(data?.data || values, false); // Pass new values, set `false` to avoid marking the form as dirty
          dispatch(
            alitaApi.util.updateQueryData(
              'toolkitsDetails',
              { projectId, toolkitId: values?.id + '' },
              () => {
                return {
                  ...(data || {}),
                };
              },
            ),
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('handleUpdateToolkit:: Error saving:', error);
          toastError(buildErrorMessage(error) || 'An error occurred while saving. Please try again.');
        }
      }, 0);
    } else {
      setShowValidation(true);
      onValidateFailure();
    }
  }, [
    hasErrors,
    hasNotSavedToolConfiguration,
    values,
    projectId,
    onSave,
    toastError,
    onValidateFailure,
    setShowValidation,
    setValues,
    dispatch,
    toolSchema?.properties,
  ]);

  /**
   * Updates Toolkit with configurable properties
   *
   * Event: ToolEvents.ToolkitsUpdateToolkitWithConfiguration
   *
   * Step. Create configuration (credentials) or select them from the list
   * Step. Update (save) a new toolkit
   *
   * Toolkit configuration can be:
   * - not saved: user is going to create a new configuration
   * - saved: user selected configuration from the list
   */
  const handleUpdateToolkitWithConfiguration = useCallback(async () => {
    setOpenAlert(false);

    // Step 1: Handle configuration creation if not already saved
    if (hasNotSavedToolConfiguration) {
      try {
        const success = await onCreateConfiguration();

        if (success) {
          refetchProjectIntegrations();
          refetchPrivateIntegrations();
        } else {
          onValidateFailure();
          return;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating configuration:', error);
        toastError('Failed to create configuration. Please try again.');
        return;
      }
    }

    // Step 2: Check for errors or unsaved configurations before proceeding
    if (!hasErrors && !hasNotSavedToolConfiguration) {
      try {
        // Save the updated toolkit
        const data = await onSave({
          projectId,
          toolId: values?.id,
          ...values,
        }).unwrap();

        // Reset the form with the saved data
        // resetForm({ values: data?.data || values }); // Ensure the structure matches `initialValues`

        // Manually set form values instead of using resetForm
        await setValues(data?.data || values, false); // Pass new values, set `false` to avoid marking the form as dirty
        dispatch(
          alitaApi.util.updateQueryData('toolkitsDetails', { projectId, toolkitId: values?.id + '' }, () => {
            return {
              ...(data || {}),
            };
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('handleUpdateToolkitWithConfiguration:: Error saving:', error);
        toastError(buildErrorMessage(error) || 'An error occurred while saving. Please try again.');
      }
    } else {
      setShowValidation(true);
      onValidateFailure();
    }
  }, [
    hasErrors,
    hasNotSavedToolConfiguration,
    values,
    projectId,
    onSave,
    onCreateConfiguration,
    refetchProjectIntegrations,
    refetchPrivateIntegrations,
    onValidateFailure,
    setShowValidation,
    toastError,
    dispatch,
    setValues,
  ]);

  useEffect(() => {
    if (isSaveError) {
      toastError(buildErrorMessage(saveError));
    } else if (isSaveSuccess) {
      toastSuccess('Updated the toolkit successfully');
    }
  }, [saveError, isSaveError, isSaveSuccess, toastError, toastSuccess]);

  //@todo: remove handleBack >
  // const handleBackRef = useRef(handleBack)
  // useEffect(() => {
  //   handleBackRef.current = handleBack
  // }, [handleBack])
  //@todo: < remove handleBack

  const onValidateEvent = useCallback(reasonFor => {
    validateReasonRef.current = reasonFor;
  }, []);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ValidateToolEvent, onValidateEvent);
    return () => {
      eventEmitter.off(ToolEvents.ValidateToolEvent, onValidateEvent);
    };
  }, [onValidateEvent]);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ToolkitsCreateToolkit, handleCreateToolkit);
    return () => {
      eventEmitter.off(ToolEvents.ToolkitsCreateToolkit, handleCreateToolkit);
    };
  }, [handleCreateToolkit]);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ToolkitsCreateToolkitWithConfiguration, handleCreateToolkitWithConfiguration);
    return () => {
      eventEmitter.off(
        ToolEvents.ToolkitsCreateToolkitWithConfiguration,
        handleCreateToolkitWithConfiguration,
      );
    };
  }, [handleCreateToolkitWithConfiguration]);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ToolkitsUpdateToolkit, handleUpdateToolkit);
    return () => {
      eventEmitter.off(ToolEvents.ToolkitsUpdateToolkit, handleUpdateToolkit);
    };
  }, [handleUpdateToolkit]);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ToolkitsUpdateToolkitWithConfiguration, handleUpdateToolkitWithConfiguration);
    return () => {
      eventEmitter.off(
        ToolEvents.ToolkitsUpdateToolkitWithConfiguration,
        handleUpdateToolkitWithConfiguration,
      );
    };
  }, [handleUpdateToolkitWithConfiguration]);

  return (
    <>
      <StyledDialog
        open={openAlert}
        onClose={onCloseAlert}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <Typography
            color={'text.secondary'}
            variant="headingSmall"
          >
            {errorMessage}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <StyledDialogContentText id="alert-dialog-description">
            <Typography variant="labelMedium">Choose the action to proceed.</Typography>
          </StyledDialogContentText>
        </DialogContent>
        <StyledDialogActions>
          {hasNotSavedToolConfiguration ? (
            <>
              <Button
                color={'alarm'}
                variant="alita"
                onClick={handleDiscard}
              >
                <Typography variant="labelSmall">
                  {isAdding ? 'Delete toolkit' : 'Discard changes'}
                </Typography>
              </Button>
              <Button
                color={'secondary'}
                variant="alita"
                onClick={handleCancel}
              >
                <Typography variant="labelSmall">Cancel</Typography>
              </Button>
              <Button
                color="primary"
                variant="alita"
                onClick={handleCreateToolkitWithConfiguration}
                autoFocus
              >
                <Typography variant="labelSmall">Save</Typography>
              </Button>
            </>
          ) : (
            <>
              <Button
                color={'alarm'}
                variant="alita"
                onClick={handleDiscard}
              >
                <Typography variant="labelSmall">
                  {isAdding ? 'Delete toolkit' : 'Discard changes'}
                </Typography>
              </Button>
              <Button
                color="primary"
                variant="alita"
                onClick={onCloseAlert}
                autoFocus
              >
                <Typography variant="labelSmall">{'Continue editing'}</Typography>
              </Button>
            </>
          )}
        </StyledDialogActions>
      </StyledDialog>
    </>
  );
}

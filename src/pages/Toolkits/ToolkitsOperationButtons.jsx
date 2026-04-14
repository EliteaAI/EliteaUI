import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { Button, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { useCredentialWarning } from '@/[fsd]/shared/lib/hooks/useCredentialWarning';
import { CredentialWarningModal } from '@/[fsd]/shared/ui/modal/credential-warning';
import { eliteaApi } from '@/api/eliteaApi.js';
import { useToolkitEditMutation } from '@/api/toolkits.js';
import eventEmitter from '@/common/eventEmitter';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledDialog, StyledDialogActions, StyledDialogContentText } from '@/components/StyledDialog';
import { useExtraValidation } from '@/hooks/application/useExtraValidation';
import useConfigurations from '@/hooks/useConfigurations.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import { ToolEvents } from '@/pages/Applications/Components/Tools/consts';

// Helper functions
const getToolkitName = (values, toolSchema) => {
  const toolkitNameKey = Object.keys(toolSchema?.properties || {}).find(
    key => toolSchema?.properties?.[key]?.toolkit_name,
  );
  return toolkitNameKey ? values?.settings?.[toolkitNameKey] : values?.name;
};

const ToolkitsOperationButtons = memo(
  ({
    editToolDetail,
    isAdding,
    hasErrors = false,
    hasNotSavedToolConfiguration = false,
    setShowValidation = () => {},
    onCreateConfiguration,
    onRevertCredentials,
    toolSchema,
  }) => {
    const validateReasonRef = useRef('');
    const revertCredentialsRef = useRef(onRevertCredentials);
    const { toastError, toastSuccess } = useToast();
    const { values, initialValues, resetForm, setValues } = useFormikContext();
    const projectId = useSelectedProjectId();
    const dispatch = useDispatch();
    const [openAlert, setOpenAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState('Some fields have missing or invalid data!');

    // Keep revertCredentialsRef updated
    useEffect(() => {
      revertCredentialsRef.current = onRevertCredentials;
    }, [onRevertCredentials]);

    // Use credential warning hook
    const { showWarning, checkBeforeSave, handlers } = useCredentialWarning({
      isCreating: isAdding,
      editToolDetail: values,
      originalDetails: initialValues,
      revertCredentialsRef,
    });

    const [onSave, { isError: isSaveError, isSuccess: isSaveSuccess, error: saveError }] =
      useToolkitEditMutation();

    const onValidateFailure = useCallback(() => {
      if (validateReasonRef.current) {
        eventEmitter.emit(ToolEvents.ResetValidateEvent, validateReasonRef.current);
        validateReasonRef.current = '';
      }
    }, []);

    // Centralized save logic
    const saveToolkit = useCallback(async () => {
      try {
        const toolkitName = getToolkitName(values, toolSchema);
        const data = await onSave({
          projectId,
          toolId: values?.id,
          ...values,
          name: toolkitName,
        }).unwrap();

        await setValues(data?.data || values, false);
        dispatch(
          eliteaApi.util.updateQueryData(
            'toolkitsDetails',
            { projectId, toolkitId: values?.id + '' },
            () => ({
              ...(data || {}),
            }),
          ),
        );
      } catch (error) {
        toastError(buildErrorMessage(error) || 'An error occurred while saving. Please try again.');
        throw error;
      }
    }, [values, toolSchema, projectId, onSave, setValues, dispatch, toastError]);

    const doValidate = useExtraValidation(editToolDetail);
    const doValidateRef = useRef(doValidate);
    useEffect(() => {
      doValidateRef.current = doValidate;
    }, [doValidate]);

    const onCloseAlert = useCallback(() => {
      setOpenAlert(false);
      onValidateFailure();
    }, [onValidateFailure]);

    const handleDiscard = useCallback(() => {
      setOpenAlert(false);
      onValidateFailure();
    }, [onValidateFailure]);

    const handleCancel = useCallback(() => {
      setOpenAlert(false);
      onValidateFailure();
      resetForm();
    }, [onValidateFailure, resetForm]);

    const { refetchProjectIntegrations, refetchPrivateIntegrations } = useConfigurations();

    /**
     * Creates Toolkit without configurable properties
     *
     * Event: ToolEvents.ToolkitsCreateToolkit
     */
    const handleCreateToolkit = useCallback(
      async reason => {
        validateReasonRef.current = reason;

        if (hasErrors || hasNotSavedToolConfiguration) {
          setShowValidation(true);
          onValidateFailure();
          return;
        }

        const { isValid, message } = await doValidateRef.current();

        if (isValid) {
          eventEmitter.emit(ToolEvents.SaveEvent, validateReasonRef.current);
          validateReasonRef.current = '';
        } else {
          setErrorMessage(message);
          onValidateFailure();
        }
      },
      [hasErrors, hasNotSavedToolConfiguration, onValidateFailure, setShowValidation],
    );

    /**
     * Creates Toolkit with configurable properties
     *
     * Event: ToolEvents.ToolkitsCreateToolkitWithConfiguration
     *
     * Step 1: Create configuration (credentials) or select from list
     * Step 2: Create (save) the toolkit
     */
    const handleCreateToolkitWithConfiguration = useCallback(
      async reason => {
        setOpenAlert(false);
        validateReasonRef.current = reason;

        if (hasErrors) {
          setShowValidation(true);
          onValidateFailure();
          return;
        }

        if (hasNotSavedToolConfiguration) {
          const success = await onCreateConfiguration();
          if (success) {
            refetchProjectIntegrations();
            refetchPrivateIntegrations();
          } else {
            onValidateFailure();
          }
          return;
        }

        const { isValid, message } = await doValidateRef.current();

        if (isValid) {
          eventEmitter.emit(ToolEvents.SaveEvent, validateReasonRef.current);
          validateReasonRef.current = '';
        } else {
          setErrorMessage(message);
          onValidateFailure();
        }
      },
      [
        hasErrors,
        hasNotSavedToolConfiguration,
        onValidateFailure,
        onCreateConfiguration,
        setShowValidation,
        refetchProjectIntegrations,
        refetchPrivateIntegrations,
      ],
    );

    /**
     * Updates Toolkit without configurable properties
     *
     * Event: ToolEvents.ToolkitsUpdateToolkit
     */
    const handleUpdateToolkit = useCallback(async () => {
      if (hasErrors || hasNotSavedToolConfiguration) {
        setShowValidation(true);
        onValidateFailure();
        return;
      }

      const performSave = async () => {
        try {
          await saveToolkit();
        } catch {
          // Error already handled in saveToolkit
        }
      };

      // Use hook's checkBeforeSave to handle credential warning
      if (checkBeforeSave(performSave)) {
        await performSave();
      }
    }, [
      hasErrors,
      hasNotSavedToolConfiguration,
      saveToolkit,
      onValidateFailure,
      setShowValidation,
      checkBeforeSave,
    ]);

    useEffect(() => {
      if (isSaveError) {
        toastError(buildErrorMessage(saveError));
      } else if (isSaveSuccess) {
        toastSuccess('Updated the toolkit successfully');
      }
    }, [saveError, isSaveError, isSaveSuccess, toastError, toastSuccess]);

    const onValidateEvent = useCallback(reasonFor => {
      validateReasonRef.current = reasonFor;
    }, []);

    // Consolidated event listeners
    useEffect(() => {
      const eventHandlers = {
        [ToolEvents.ValidateToolEvent]: onValidateEvent,
        [ToolEvents.ToolkitsCreateToolkit]: handleCreateToolkit,
        [ToolEvents.ToolkitsCreateToolkitWithConfiguration]: handleCreateToolkitWithConfiguration,
        [ToolEvents.ToolkitsUpdateToolkit]: handleUpdateToolkit,
      };

      Object.entries(eventHandlers).forEach(([event, handler]) => {
        eventEmitter.on(event, handler);
      });

      return () => {
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          eventEmitter.off(event, handler);
        });
      };
    }, [onValidateEvent, handleCreateToolkit, handleCreateToolkitWithConfiguration, handleUpdateToolkit]);

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
                  variant="elitea"
                  onClick={handleDiscard}
                >
                  <Typography variant="labelSmall">
                    {isAdding ? 'Delete toolkit' : 'Discard changes'}
                  </Typography>
                </Button>
                <Button
                  color={'secondary'}
                  variant="elitea"
                  onClick={handleCancel}
                >
                  <Typography variant="labelSmall">Cancel</Typography>
                </Button>
                <Button
                  color="primary"
                  variant="elitea"
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
                  variant="elitea"
                  onClick={handleDiscard}
                >
                  <Typography variant="labelSmall">
                    {isAdding ? 'Delete toolkit' : 'Discard changes'}
                  </Typography>
                </Button>
                <Button
                  color="primary"
                  variant="elitea"
                  onClick={onCloseAlert}
                  autoFocus
                >
                  <Typography variant="labelSmall">{'Continue editing'}</Typography>
                </Button>
              </>
            )}
          </StyledDialogActions>
        </StyledDialog>
        <CredentialWarningModal
          open={showWarning}
          onConfirm={handlers.onConfirm}
          onCancel={handlers.onCancel}
          onClose={handlers.onClose}
        />
      </>
    );
  },
);

ToolkitsOperationButtons.displayName = 'ToolkitsOperationButtons';

export default ToolkitsOperationButtons;

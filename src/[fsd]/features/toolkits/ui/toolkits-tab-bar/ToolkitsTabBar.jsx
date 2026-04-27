import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Box, Button as MuiButton, Typography } from '@mui/material';

import { selectIndexesAvailable } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import ToolkitsTabBarPlaceholder from '@/[fsd]/features/toolkits/ui/toolkits-tab-bar/ToolkitsTabBarPlaceholder';
import { useFormDirtyExcluding } from '@/[fsd]/shared/lib/hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { useToolkitEditMutation } from '@/api/toolkits';
import eventEmitter from '@/common/eventEmitter';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { ToolEvents, ValidateToolEventReason } from '@/pages/Applications/Components/Tools/consts';
import useDiscardApplicationChanges from '@/pages/Applications/useDiscardApplicationChanges';
import { TabBarItems } from '@/pages/Common/Components';

const ToolkitsTabBarContainer = memo(props => {
  const {
    onDiscard,
    onClearEditTool,
    hasNotSavedCredentials,
    toolSchema,
    hasValidationErrors = false,
  } = props;

  const saveNewVersionButtonRef = useRef();
  const { toastError, toastSuccess } = useToast();
  const projectId = useSelectedProjectId();

  const { discardApplicationChanges } = useDiscardApplicationChanges(onDiscard);

  const { values, resetForm, initialValues } = useFormikContext();

  const isFormDirtyExcluding = useFormDirtyExcluding();

  const isIndexesAvailable = useSelector(selectIndexesAvailable);

  const [reasonFor, setReasonFor] = useState();
  const [alertSaving, setAlertSaving] = useState();

  const shouldAlertSaving = useMemo(() => {
    const isEmbeddingModelDirty = values.settings.embedding_model !== initialValues.settings.embedding_model;

    return isFormDirtyExcluding && isEmbeddingModelDirty && isIndexesAvailable;
  }, [values, initialValues, isFormDirtyExcluding, isIndexesAvailable]);

  const [onSave, { isError: isSaveError, isSuccess: isSaveSuccess, error: saveError, isLoading: isSaving }] =
    useToolkitEditMutation();

  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const handleConfirmSave = useCallback(() => {
    setReasonFor(ValidateToolEventReason.saveLatestVersion);
    eventEmitter.emit(ToolEvents.ToolkitsUpdateToolkit, ValidateToolEventReason.saveLatestVersion);
  }, []);

  const onClickSave = useCallback(() => {
    if (shouldAlertSaving) setAlertSaving(true);
    else handleConfirmSave();
  }, [handleConfirmSave, shouldAlertSaving]);

  const onSaveEvent = useCallback(
    async reason => {
      if (reason === ValidateToolEventReason.saveLatestVersion) {
        setTimeout(async () => {
          const toolkitNameKey = Object.keys(toolSchema?.properties || {}).find(
            key => toolSchema?.properties?.[key]?.toolkit_name,
          );
          await onSave({
            projectId,
            toolId: values?.id,
            ...values,
            name: toolkitNameKey ? values?.settings?.[toolkitNameKey] : values?.name,
          }).then(async () => {
            resetForm({ values });
          });

          setReasonFor('');
          onClearEditTool();
        }, 0);
      } else if (reason === ValidateToolEventReason.saveNewVersion) {
        saveNewVersionButtonRef.current?.onSaveVersion();
      }
    },
    [toolSchema?.properties, projectId, values, onSave, onClearEditTool, resetForm],
  );

  const onDiscardAlertChanges = useCallback(() => {
    discardApplicationChanges();
    setAlertSaving(false);
  }, [discardApplicationChanges]);

  const shouldDisableSave = useMemo(
    () =>
      isSaving ||
      !isFormDirtyExcluding ||
      reasonFor === ValidateToolEventReason.saveNewVersion ||
      hasValidationErrors,
    [isSaving, isFormDirtyExcluding, reasonFor, hasValidationErrors],
  );

  const onResetValidateEvent = useCallback(async () => {
    setReasonFor('');
  }, []);

  useEffect(() => {
    eventEmitter.on(ToolEvents.SaveEvent, onSaveEvent);

    return () => {
      eventEmitter.off(ToolEvents.SaveEvent, onSaveEvent);
    };
  }, [onSaveEvent]);

  useEffect(() => {
    if (isSaveError) {
      toastError(buildErrorMessage(saveError));
    }
  }, [saveError, isSaveError, toastError]);

  useEffect(() => {
    if (isSaveSuccess) {
      toastSuccess('The toolkit has been updated successfully');

      if (alertSaving) setAlertSaving(false);
    }
  }, [isSaveSuccess, toastSuccess, alertSaving]);

  useEffect(() => {
    eventEmitter.on(ToolEvents.ResetValidateEvent, onResetValidateEvent);

    return () => {
      eventEmitter.off(ToolEvents.ResetValidateEvent, onResetValidateEvent);
    };
  }, [onResetValidateEvent]);

  return (
    <>
      <TabBarItems>
        <MuiButton
          disabled={shouldDisableSave}
          variant="alita"
          color="primary"
          onClick={onClickSave}
        >
          {hasNotSavedCredentials ? 'Save Credentials' : 'Save'}
          {isSaving && <StyledCircleProgress size={20} />}
        </MuiButton>
        <Button.DiscardButton
          disabled={isSaving || !isFormDirtyExcluding}
          onDiscard={discardApplicationChanges}
        />
      </TabBarItems>

      <Modal.BaseModal
        hideSections
        open={alertSaving}
        title="Warning!"
        onClose={() => setAlertSaving(false)}
        content={
          <Typography>
            Are you sure to save changes for the Embedding Model? That will make all existing indexes
            non-operational. Make this decision considering the potential risks.
          </Typography>
        }
        actions={
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <MuiButton
              variant="alita"
              color="secondary"
              onClick={onDiscardAlertChanges}
              disableRipple
            >
              Discard changes
            </MuiButton>
            <MuiButton
              variant="alita"
              color="alarm"
              onClick={handleConfirmSave}
              disableRipple
              disabled={isSaving}
            >
              Save changes
            </MuiButton>
          </Box>
        }
      />
    </>
  );
});

ToolkitsTabBarContainer.displayName = 'ToolkitsTabBarContainer';

const ToolkitsTabBar = memo(props => {
  const { onDiscard, onClearEditTool, toolSchema, hasValidationErrors, showPlaceholder = false } = props;

  return showPlaceholder ? (
    <ToolkitsTabBarPlaceholder onDiscard={onDiscard} />
  ) : (
    <ToolkitsTabBarContainer
      onDiscard={onDiscard}
      onClearEditTool={onClearEditTool}
      hasNotSavedCredentials={false}
      toolSchema={toolSchema}
      hasValidationErrors={hasValidationErrors}
    />
  );
});

ToolkitsTabBar.displayName = 'ToolkitsTabBar';

export default ToolkitsTabBar;

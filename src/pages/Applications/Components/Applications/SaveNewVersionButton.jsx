import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { useFormikContext } from 'formik';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import useToast from '@/hooks/useToast';

const SaveNewVersionButton = forwardRef((props, ref) => {
  const { disabled, onClickHandler, onSuccess } = props;
  const { toastSuccess, toastError } = useToast();

  const { values: { id: applicationId, versions = [], version_details, webhook_secret } = {} } =
    useFormikContext();
  const [showInputVersion, setShowInputVersion] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  const internalClickHandler = useCallback(() => {
    if (!showInputVersion) {
      setShowInputVersion(true);
    }
  }, [showInputVersion]);

  const onSaveVersion = useCallback(() => {
    if (onClickHandler) {
      onClickHandler();
    } else {
      internalClickHandler();
    }
  }, [internalClickHandler, onClickHandler]);

  useImperativeHandle(ref, () => ({
    onSaveVersion: internalClickHandler,
  }));

  const onCancelShowInputVersion = useCallback(() => {
    setShowInputVersion(false);
    setNewVersion('');
  }, []);

  const { onCreateNewVersion, isSavingNewVersion } = useSaveNewVersion({
    toastError,
    toastSuccess,
    applicationId,
    onSuccess,
    versionDetails: {
      ...version_details,
      id: undefined,
    },
    sourceVersionId: version_details?.id,
    webhook_secret,
  });

  const handleSaveVersion = useCallback(() => {
    const foundNameInTheList = versions.find(item => item.name === newVersion);
    if (!foundNameInTheList && newVersion) {
      onCreateNewVersion(newVersion);
    } else {
      toastError(
        newVersion
          ? 'A version with that name already exists. Please pick a unique name.'
          : 'Empty version name is not allowed!',
      );
    }
  }, [newVersion, onCreateNewVersion, toastError, versions]);

  const onConfirmVersion = useCallback(() => {
    setShowInputVersion(false);
    handleSaveVersion();
  }, [handleSaveVersion]);

  const onInputVersion = useCallback(event => {
    const { target } = event;
    event.stopPropagation();
    setNewVersion(target?.value.trim());
  }, []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && newVersion) {
        event.preventDefault();
        onConfirmVersion();
      }
    },
    [newVersion, onConfirmVersion],
  );

  return (
    <>
      <Button.BaseBtn
        data-testid="agent-save-as-version-button"
        disabled={isSavingNewVersion || disabled}
        variant="elitea"
        color="secondary"
        onClick={onSaveVersion}
      >
        Save As Version
        {isSavingNewVersion && <StyledCircleProgress size={20} />}
      </Button.BaseBtn>
      <Modal.BaseModal
        open={showInputVersion}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.success}
        title="Create version"
        onClose={onCancelShowInputVersion}
        onConfirm={onConfirmVersion}
        confirmButtonText="Save"
        confirming={!newVersion}
        onKeyDown={handleKeyDown}
        closeButtonTestId="agent-version-dialog-close-button"
        cancelButtonTestId="agent-version-dialog-cancel-button"
        confirmButtonTestId="agent-version-dialog-save-button"
        content={
          <Input.InputBase
            label="Name"
            value={newVersion}
            onChange={onInputVersion}
            inputProps={{ maxLength: 255, 'data-testid': 'agent-version-dialog-name-input' }}
            autoFocus
          />
        }
      />
    </>
  );
});

SaveNewVersionButton.displayName = 'SaveNewVersionButton';

export default SaveNewVersionButton;

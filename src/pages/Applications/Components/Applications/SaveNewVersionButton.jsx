import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@mui/material';

import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import useToast from '@/hooks/useToast';
import InputVersionDialog from '@/pages/Common/Components/InputVersionDialog';

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

  return (
    <>
      <Button
        disabled={isSavingNewVersion || disabled}
        variant="elitea"
        color="secondary"
        onClick={onSaveVersion}
      >
        Save As Version
        {isSavingNewVersion && <StyledCircleProgress size={20} />}
      </Button>
      <InputVersionDialog
        open={showInputVersion}
        showTips={false}
        disabled={!newVersion}
        title={'Create version'}
        doButtonTitle={'Save'}
        versionName={newVersion}
        disabledInput={false}
        onCancel={onCancelShowInputVersion}
        onConfirm={onConfirmVersion}
        onChange={onInputVersion}
      />
    </>
  );
});

SaveNewVersionButton.displayName = 'SaveNewVersionButton';

export default SaveNewVersionButton;

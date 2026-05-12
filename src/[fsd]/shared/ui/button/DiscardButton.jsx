import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import AlertDialog from '@/components/AlertDialog';

import BaseBtn from './BaseBtn';

const DiscardButton = memo(props => {
  const {
    title = 'Discard',
    alertContent = 'Are you sure you want to discard changes?',
    onDiscard,
    disabled,
    discarding,
    color = 'secondary',
  } = props;

  const { isSaving } = useSelector(state => state.applications);

  const [openAlert, setOpenAlert] = useState(false);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
  }, []);

  const onConfirmDelete = useCallback(() => {
    onCloseAlert();
    onDiscard();
  }, [onCloseAlert, onDiscard]);

  return (
    <>
      <BaseBtn
        disabled={disabled || isSaving}
        variant="elitea"
        color={color}
        onClick={() => setOpenAlert(true)}
      >
        {title}
      </BaseBtn>
      <AlertDialog
        alarm
        title="Warning"
        alertContent={alertContent}
        open={openAlert}
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmDelete}
        confirming={discarding}
      />
    </>
  );
});

DiscardButton.displayName = 'DiscardButton';

export default DiscardButton;

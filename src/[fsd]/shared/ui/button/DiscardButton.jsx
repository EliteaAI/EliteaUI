import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

import BaseBtn from './BaseBtn';

const DiscardButton = memo(props => {
  const {
    title = 'Discard',
    alertContent = 'Are you sure you want to discard changes?',
    onDiscard,
    disabled,
    discarding,
    color = 'secondary',
    ...rest
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
        {...rest}
        disabled={disabled || isSaving}
        variant="elitea"
        color={color}
        onClick={() => setOpenAlert(true)}
      >
        {title}
      </BaseBtn>
      <Modal.BaseModal
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Warning"
        content={alertContent}
        open={openAlert}
        onClose={onCloseAlert}
        onConfirm={onConfirmDelete}
        confirmButtonText="Discard"
        confirming={discarding}
      />
    </>
  );
});

DiscardButton.displayName = 'DiscardButton';

export default DiscardButton;

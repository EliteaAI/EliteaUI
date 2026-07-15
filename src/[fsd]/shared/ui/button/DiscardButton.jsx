import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

import BaseBtn from './BaseBtn';

const DiscardButton = memo(props => {
  const {
    title = 'Discard',
    alertContent = ModalConstants.WARNING_MESSAGES.DISCARD_CHANGES,
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
        confirmButtonText={ModalConstants.WARNING_BUTTONS.DISCARD}
        confirming={discarding}
        dialogSx={{ fontSize: '0.875rem' }}
      />
    </>
  );
});

DiscardButton.displayName = 'DiscardButton';

export default DiscardButton;

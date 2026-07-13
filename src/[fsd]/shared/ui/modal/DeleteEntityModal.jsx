import { memo, useEffect, useMemo, useState } from 'react';

import { Box, TextField, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const DeleteEntityModal = memo(props => {
  const {
    name,
    open,
    onClose,
    onConfirm,
    shouldRequestInputName,
    extraContent,
    inlineExtraContent,
    sx,
    titleIcon = ModalConstants.MODAL_ICON_TYPE.destructive,
    title = 'Delete confirmation',
    actions,
    alarm = true,
    confirmButtonText = 'Delete',
    cancelButtonText = 'Cancel',
    customContent,
    textContent = 'Are you sure to delete the ',
  } = props;

  const styles = deleteEntityModalStyles();

  const [inputName, setInputName] = useState('');

  useEffect(() => {
    if (!open) {
      setInputName('');
    }
  }, [open]);

  const isButtonDisabled = useMemo(
    () => shouldRequestInputName && !!name && name !== inputName,
    [inputName, name, shouldRequestInputName],
  );

  const resetButtonState = (e, callback) => {
    setInputName('');
    callback(e);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !isButtonDisabled) {
      event.preventDefault();
      onConfirm();
    }
  };

  const contentNode = (
    <Box
      sx={styles.contentWrapper}
      onClick={event => event.stopPropagation()}
    >
      <Typography
        id="alert-dialog-description"
        color="text.deleteAlertText"
        variant="bodyMedium"
        sx={{ whiteSpaceCollapse: 'preserve' }}
      >
        {textContent}
        <Typography
          component="span"
          variant="headingSmall"
          sx={({ palette }) => ({ color: palette.text.deleteAlertEntityName })}
        >
          {name}
        </Typography>
        {inlineExtraContent || '?'}
        {shouldRequestInputName && ' Enter the name to complete the action.'}
      </Typography>
      {extraContent}
      {shouldRequestInputName && (
        <TextField
          fullWidth
          autoComplete="off"
          variant="standard"
          id="name"
          name="name"
          label="Name"
          value={inputName}
          onChange={event => setInputName(event.target.value)}
        />
      )}
    </Box>
  );

  const actionsNode = (
    <>
      <Button.BaseBtn
        autoFocus
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={e => resetButtonState(e, onClose)}
      >
        {cancelButtonText}
      </Button.BaseBtn>
      <Button.OneClickButton
        title={confirmButtonText}
        color={alarm ? BUTTON_COLORS.alarm : BUTTON_COLORS.primary}
        disabled={isButtonDisabled}
        onClick={onConfirm}
      />
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={titleIcon}
      title={title}
      content={customContent ?? contentNode}
      actions={actions ?? actionsNode}
      onClose={e => resetButtonState(e, onClose)}
      onKeyDown={handleKeyDown}
      sx={sx}
    />
  );
});

DeleteEntityModal.displayName = 'DeleteEntityModal';

/** @type {MuiSx} */
const deleteEntityModalStyles = () => ({
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.75rem',
  },
});

export default DeleteEntityModal;

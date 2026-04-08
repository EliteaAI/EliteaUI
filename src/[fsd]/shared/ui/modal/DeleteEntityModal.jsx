import { memo, useMemo, useState } from 'react';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button as MuiButton,
  TextField,
  Typography,
} from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';

const DeleteEntityModal = memo(props => {
  const {
    name,
    open,
    onClose,
    onCancel,
    onConfirm,
    shouldRequestInputName,
    extraContent,
    inlineExtraContent,
    sx,
  } = props;

  const styles = deleteEntityModalStyles();

  const [inputName, setInputName] = useState('');

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
    } else if (event.key === 'Escape') {
      event.preventDefault();
      resetButtonState(event, onCancel);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={e => resetButtonState(e, onClose)}
      onKeyDown={handleKeyDown}
      onClick={event => event.stopPropagation()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      slotProps={{ paper: { sx: { width: '37.5rem', ...sx?.paper } } }}
    >
      <DialogTitle id="alert-dialog-title">
        <Typography
          variant="headingSmall"
          color="text.deleteAlertText"
        >
          Delete confirmation
        </Typography>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography
          id="alert-dialog-description"
          color="text.deleteAlertText"
          variant="bodyMedium"
          sx={{
            whiteSpaceCollapse: 'preserve',
          }}
        >
          Are you sure to delete{' '}
          <Typography
            component={'span'}
            variant="headingSmall"
            sx={({ palette }) => ({ color: palette.text.deleteAlertEntityName })}
          >
            {name}
          </Typography>
          ?{inlineExtraContent}
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
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <MuiButton
          autoFocus
          disableRipple
          variant="elitea"
          color="secondary"
          onClick={e => resetButtonState(e, onCancel)}
        >
          Cancel
        </MuiButton>
        <Button.OneClickButton
          disableRipple
          title="Delete"
          color="alarm"
          disabled={isButtonDisabled}
          onClick={onConfirm}
        />
      </DialogActions>
    </Dialog>
  );
});

DeleteEntityModal.displayName = 'DeleteEntityModal';

/** @type {MuiSx} */
const deleteEntityModalStyles = () => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.75rem',
    maxWidth: '100%',
    width: '100%',
  },
  dialogActions: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    padding: '0.5rem 1.5rem 1.5rem 1.5rem',
  },
});

export default DeleteEntityModal;

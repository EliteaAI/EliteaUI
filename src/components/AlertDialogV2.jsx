import { useCallback } from 'react';

import { Button, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { StyledDialog, StyledDialogActions, StyledDialogContentText } from './StyledDialog';

export default function AlertDialogV2({
  open,
  setOpen,
  title,
  content,
  onConfirm,
  alarm,
  confirmButtonTitle = 'Confirm',
  confirmButtonSX,
  extraContent,
  sx,
  disabledConfirm,
  onCancel,
}) {
  const closeAlert = useCallback(() => {
    setOpen && setOpen(false);
    onCancel && onCancel();
  }, [onCancel, setOpen]);

  const doConfirm = useCallback(() => {
    setOpen && setOpen(false);
    onConfirm();
  }, [onConfirm, setOpen]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !disabledConfirm) {
        event.preventDefault();
        doConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeAlert();
      }
    },
    [disabledConfirm, doConfirm, closeAlert],
  );

  return (
    <StyledDialog
      open={open}
      onClose={closeAlert}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx,
      }}
    >
      {title && (
        <DialogTitle id="alert-dialog-title">
          <Typography
            variant="headingSmall"
            color="text.deleteAlertText"
          >
            {title}
          </Typography>
        </DialogTitle>
      )}
      <DialogContent>
        {!!content && (
          <StyledDialogContentText id="alert-dialog-description">{content}</StyledDialogContentText>
        )}
        {extraContent}
      </DialogContent>
      <StyledDialogActions>
        <Button
          disableRipple
          variant="alita"
          color="secondary"
          onClick={closeAlert}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          disabled={disabledConfirm}
          sx={confirmButtonSX}
          variant="alita"
          color={alarm ? 'alarm' : 'primary'}
          onClick={doConfirm}
        >
          {confirmButtonTitle}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}

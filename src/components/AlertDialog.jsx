import { Button, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { StyledDialog, StyledDialogActions, StyledDialogContentText } from './StyledDialog';

export default function AlertDialog({
  title,
  alertContent,
  open,
  onClose,
  onCancel,
  onConfirm,
  alarm,
  confirmButtonText = 'Confirm',
  multiline = false,
  confirming = false,
}) {
  const handleKeyDown = event => {
    if (event.key === 'Enter' && !confirming) {
      event.preventDefault();
      onConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
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
        <StyledDialogContentText
          id="alert-dialog-description"
          sx={
            !multiline
              ? undefined
              : {
                  whiteSpace: 'pre-line',
                }
          }
        >
          {alertContent}
        </StyledDialogContentText>
      </DialogContent>
      <StyledDialogActions>
        <Button
          variant="alita"
          color="secondary"
          onClick={onCancel}
          autoFocus
          disableRipple
        >
          Cancel
        </Button>
        <Button
          disableRipple
          variant="alita"
          color={alarm ? 'alarm' : 'primary'}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirmButtonText}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}

import { DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';

const Modal = props => {
  const {
    open,
    title,
    onClose,
    content,
    actions,
    hideSections = false,
    titleVariant = 'headingSmall',
    sx = {},
    onKeyDown,
    dialogSx = {},
  } = props;

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
    onKeyDown?.(event);
  };

  const styles = modalStyles(hideSections, actions);

  return (
    <StyledDialog
      open={!!open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={[styles.dialog, sx]}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={styles.dialogTitle}
      >
        <Typography
          variant={titleVariant}
          color="text.secondary"
        >
          {title}
        </Typography>
        <IconButton
          variant="alita"
          color="tertiary"
          aria-label="close"
          onClick={onClose}
          sx={{ padding: 0, margin: 0 }}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={[styles.dialogContent, dialogSx]}>{content}</DialogContent>
      {actions && <StyledDialogActions sx={styles.dialogActions}>{actions}</StyledDialogActions>}
    </StyledDialog>
  );
};

/** @type {MuiSx} */
const modalStyles = (hideSections, actions) => ({
  dialog: ({ palette }) => ({
    '& .MuiDialog-paper': {
      width: '37.5rem !important',
      maxWidth: '60% !important',
      background: `${palette.background.tabPanel} !important`,
      backgroundColor: `${palette.background.tabPanel} !important`,
    },
  }),
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
  },
  dialogContent: ({ palette }) => ({
    width: '100%',
    overflow: 'auto',
    maxHeight: 'calc(100vh - 23.75rem)',
    boxSizing: 'border-box',
    padding: '1.5rem !important',
    overflowY: 'scroll',
    gap: '1rem',

    ...(hideSections
      ? { background: `transparent !important` }
      : {
          background: `${palette.background.secondary} !important`,
          borderTop: `.0625rem solid ${palette.border.lines}`,
          ...(actions && { borderBottom: `.0625rem solid ${palette.border.lines}` }),
        }),
  }),
  dialogActions: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
});

export default Modal;

import { memo, useCallback, useState } from 'react';

import { Button, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';

import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';

const UnpublishConfirmModal = memo(
  ({ open, onClose, onConfirm, isLoading, showReason = false, agentName, versionName }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = useCallback(() => {
      onConfirm(showReason ? reason.trim() || undefined : undefined);
      setReason('');
    }, [onConfirm, reason, showReason]);

    const handleClose = useCallback(() => {
      setReason('');
      onClose();
    }, [onClose]);

    const handleKeyDown = useCallback(
      event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleClose();
        }
      },
      [handleClose],
    );

    return (
      <StyledDialog
        open={!!open}
        onClose={handleClose}
        onKeyDown={handleKeyDown}
        aria-labelledby="unpublish-dialog-title"
        sx={styles.dialogContainer}
      >
        <DialogTitle
          id="unpublish-dialog-title"
          sx={styles.dialogTitle}
        >
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Unpublish Agent
          </Typography>
          <IconButton
            variant="elitea"
            color="tertiary"
            aria-label="close"
            onClick={handleClose}
            sx={{ padding: 0, marginRight: '-0.5rem' }}
          >
            <CloseIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          {showReason ? (
            <TextField
              fullWidth
              variant="standard"
              label="Reason"
              placeholder="Provide clear explanation for the unpublishing decision."
              value={reason}
              onChange={e => setReason(e.target.value)}
              autoComplete="off"
            />
          ) : (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {'Are you sure you want to unpublish '}
              <Typography
                component="span"
                variant="headingSmall"
              >
                {agentName}
              </Typography>
              {' (version: '}
              <Typography
                component="span"
                variant="headingSmall"
              >
                {versionName}
              </Typography>
              {
                ')? The agent will be removed from Agents Studio immediately. Existing conversations using this agent version may be affected.'
              }
            </Typography>
          )}
        </DialogContent>
        <StyledDialogActions sx={styles.dialogActions}>
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Unpublish
          </Button>
        </StyledDialogActions>
      </StyledDialog>
    );
  },
);

UnpublishConfirmModal.displayName = 'UnpublishConfirmModal';

/** @type {MuiSx} */
const styles = {
  dialogContainer: {
    '& .MuiDialog-paper': {
      width: '100% !important',
      borderRadius: '1rem !important',
    },
  },
  dialogTitle: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
    backgroundColor: `${palette.background.tabPanel}`,
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    padding: '1.5rem !important',
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    background: `${palette.background.secondary} !important`,
  }),
  dialogActions: ({ palette }) => ({
    display: 'flex',
    gap: '0.25rem',
    padding: '1rem 1.5rem !important',
    width: '100%',
    backgroundColor: `${palette.background.tabPanel}`,
  }),
};

export default UnpublishConfirmModal;

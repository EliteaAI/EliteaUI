import { memo, useCallback, useState } from 'react';

import { DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';

import { ENTITY_STUDIO } from '@/[fsd]/entities/version/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';

const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);

const UnpublishConfirmModal = memo(props => {
  const {
    open,
    onClose,
    onConfirm,
    isLoading,
    showReason = false,
    entityName,
    versionName,
    entityLabel = 'agent',
  } = props;
  const [reason, setReason] = useState('');

  const entityTitle = capitalize(entityLabel);
  const studioName = ENTITY_STUDIO[entityLabel] || ENTITY_STUDIO.agent;

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
          Unpublish {entityTitle}
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
            Are you sure you want to unpublish{' '}
            <Typography
              component="span"
              variant="headingSmall"
            >
              {entityName}
            </Typography>{' '}
            (version:{' '}
            <Typography
              component="span"
              variant="headingSmall"
            >
              {versionName})?
            </Typography>{' '}
            The {entityLabel} will be removed from {studioName} immediately. Existing conversations using this{' '}
            {entityLabel} version may be affected.
          </Typography>
        )}
      </DialogContent>
      <StyledDialogActions sx={styles.dialogActions}>
        <Button.BaseBtn
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          Unpublish
        </Button.BaseBtn>
      </StyledDialogActions>
    </StyledDialog>
  );
});

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

import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const RequestAccessModal = memo(props => {
  const { application, isSubmitting, onClose, onSubmit, open } = props;
  const styles = requestAccessModalStyles();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleReasonChange = useCallback(
    event => {
      setReason(event.target.value);
      if (error) setError('');
    },
    [error],
  );

  const handleSubmit = useCallback(() => {
    if (!reason.trim()) {
      setError('Please provide a reason for your request');
      return;
    }
    onSubmit(application, reason.trim());
    setReason('');
    setError('');
  }, [application, onSubmit, reason]);

  const handleClose = useCallback(() => {
    setReason('');
    setError('');
    onClose();
  }, [onClose]);

  if (!application) return null;

  const content = (
    <Box sx={styles.content}>
      <Typography sx={styles.description}>
        Access to this feature requires approval. Please provide your project details and describe your use
        case.
      </Typography>

      <Box sx={styles.fieldWrapper}>
        <Typography
          variant="labelMedium"
          sx={styles.fieldLabel}
        >
          Reason{' *'}
        </Typography>
        <Input.InputBase
          multiline
          variant="outlined"
          value={reason}
          error={Boolean(error)}
          helperText={error}
          placeholder="Describe why you need access to this application..."
          onChange={handleReasonChange}
          showCopyAction={false}
          showFullScreenAction={false}
          showExpandAction={false}
          sx={styles.textarea}
        />
      </Box>
    </Box>
  );

  const actions = (
    <Box sx={styles.actions}>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        disabled={isSubmitting}
        onClick={handleClose}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.contained}
        disabled={isSubmitting || !reason.trim()}
        onClick={handleSubmit}
      >
        Send Request
      </Button.BaseBtn>
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Request Access"
      titleVariant="headingMedium"
      content={content}
      actions={actions}
      onClose={handleClose}
    />
  );
});

RequestAccessModal.displayName = 'RequestAccessModal';

/** @type {MuiSx} */
const requestAccessModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  fieldLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    fontWeight: 500,
    pl: '0.5rem',
  }),
  textarea: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      height: '11.25rem',
      alignItems: 'flex-start',
      backgroundColor: 'transparent',
      color: palette.text.secondary,
      borderRadius: '0.5rem',
    },
    '& .MuiInputBase-input': {
      height: '100% !important',
      overflow: 'auto !important',
    },
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
});

export default RequestAccessModal;

import { memo, useCallback, useEffect, useState } from 'react';

import { Box, TextField } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import EditIcon from '@/assets/edit.svg?react';

// Keep the inline edit bounded — the SDK guard also caps it server-side.
const MAX_EDIT_LENGTH = 2000;

/**
 * Inline "Edit" control rendered on a HITL authorization card.
 *
 * Parallel sub-agent fan-out can surface several authorization cards at once,
 * so the edited message cannot be collected through the shared chat input
 * (which attaches no toolCallId and so can't be matched to the right card).
 * Instead the button expands an input field ON the card itself; submitting
 * resumes THIS specific call with the edited message. Each card owns its own
 * local state, so edits never bleed between simultaneously-paused cards.
 */
const EditControl = memo(props => {
  const { onSubmit, disabled } = props;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const styles = getStyles();

  const trimmedText = text.trim();

  // Parallel HITL: another action (Approve/Reject) can decide this card and
  // flip it to `disabled` while the edit box is open. Collapse and clear so the
  // expanded textarea + Cancel button — both disabled — can't get stuck on the
  // card.
  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setText('');
    }
  }, [disabled]);

  const handleOpen = useCallback(() => setOpen(true), []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setText('');
  }, []);

  const handleChange = useCallback(event => {
    setText(event.target.value.slice(0, MAX_EDIT_LENGTH));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!trimmedText) return;
    onSubmit?.(trimmedText);
    setOpen(false);
    setText('');
  }, [onSubmit, trimmedText]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleSubmit, handleCancel],
  );

  if (!open) {
    return (
      <BaseBtn
        variant={BUTTON_VARIANTS.neutral}
        startIcon={<EditIcon />}
        onClick={handleOpen}
        disabled={disabled}
        sx={styles.buttonIcon}
      >
        Edit
      </BaseBtn>
    );
  }

  return (
    <Box sx={styles.commentBox}>
      <TextField
        multiline
        minRows={2}
        maxRows={6}
        autoFocus
        fullWidth
        size="small"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Enter your edited message to proceed. Press ⌘/Ctrl+Enter to send."
        slotProps={{ htmlInput: { maxLength: MAX_EDIT_LENGTH } }}
        sx={styles.commentInput}
      />
      <Box sx={styles.commentActions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleCancel}
          disabled={disabled}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.neutral}
          startIcon={<EditIcon />}
          onClick={handleSubmit}
          disabled={disabled || !trimmedText}
          sx={styles.buttonIcon}
        >
          Submit Edit
        </BaseBtn>
      </Box>
    </Box>
  );
});

EditControl.displayName = 'EditControl';

/** @type {MuiSx} */
const getStyles = () => ({
  commentBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.125rem',
  },
  commentInput: ({ palette }) => ({
    width: '100%',
    '& .MuiInputBase-root': {
      padding: '0.5rem 0.625rem',
      borderRadius: '0.375rem',
      backgroundColor: palette.background.default,
      border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
      fontSize: '0.8125rem',
      color: palette.text.primary,
    },
    '& .MuiInputBase-root.Mui-focused': {
      borderColor: palette.primary.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '& textarea::placeholder': {
      color: palette.text.secondary,
      opacity: 0.8,
    },
  }),
  commentActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonIcon: {
    '& .MuiButton-startIcon': {
      color: 'white',
    },
  },
});

export default EditControl;

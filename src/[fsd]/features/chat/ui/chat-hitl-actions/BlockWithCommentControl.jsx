import { memo, useCallback, useEffect, useState } from 'react';

import { Box, TextField } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import RejectIcon from '@/assets/reject.svg?react';

// Keep the inline note bounded — the SDK guard also caps it server-side.
const MAX_COMMENT_LENGTH = 2000;

/**
 * Inline "Block with Comment" control rendered on a HITL authorization card.
 *
 * Parallel sub-agent fan-out can surface several authorization cards at once,
 * so the note cannot be collected through the shared chat input. Instead the
 * button expands an input field ON the card itself; submitting blocks THIS
 * specific call and ships the note to the agent as the blocked-tool
 * `denial_reason` (issue #5318). Each card owns its own local state, so notes
 * never bleed between simultaneously-paused cards.
 */
const BlockWithCommentControl = memo(props => {
  const { onSubmit, disabled } = props;
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const styles = getStyles();

  const trimmedComment = comment.trim();

  // Parallel HITL: another action (Authorize/Block) can decide this card and
  // flip it to `disabled` while the note box is open. Collapse and clear so the
  // expanded textarea + Cancel button — both disabled — can't get stuck on the
  // card.
  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setComment('');
    }
  }, [disabled]);

  const handleOpen = useCallback(() => setOpen(true), []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setComment('');
  }, []);

  const handleChange = useCallback(event => {
    setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!trimmedComment) return;
    onSubmit?.(trimmedComment);
    setOpen(false);
    setComment('');
  }, [onSubmit, trimmedComment]);

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
        variant={BUTTON_VARIANTS.secondary}
        startIcon={<RejectIcon />}
        onClick={handleOpen}
        disabled={disabled}
        sx={styles.buttonIcon}
      >
        Block with Comment
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
        value={comment}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Tell the agent why this call is blocked and what to do instead. Press ⌘/Ctrl+Enter to send."
        slotProps={{ htmlInput: { maxLength: MAX_COMMENT_LENGTH } }}
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
          variant={BUTTON_VARIANTS.alarm}
          startIcon={<RejectIcon />}
          onClick={handleSubmit}
          disabled={disabled || !trimmedComment}
          sx={styles.buttonIcon}
        >
          Block with Comment
        </BaseBtn>
      </Box>
    </Box>
  );
});

BlockWithCommentControl.displayName = 'BlockWithCommentControl';

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

export default BlockWithCommentControl;

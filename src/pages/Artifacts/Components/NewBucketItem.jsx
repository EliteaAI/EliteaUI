import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, IconButton, TextField } from '@mui/material';

import CheckIcon from '@/components/Icons/CheckIcon';
import CloseIcon from '@/components/Icons/CloseIcon';

/**
 * NewBucketItem - Inline component for creating a new bucket
 * Shows an input field with confirm/cancel buttons that appears in the bucket list
 */
const NewBucketItem = memo(props => {
  const { onConfirm, onCancel, isLoading = false } = props;

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const styles = newBucketItemStyles();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Validate bucket name
  const validateName = useCallback(value => {
    if (!value || value.trim().length === 0) {
      return 'Name is required';
    }
    if (!/^[a-zA-Z]/.test(value)) {
      return 'Must start with a letter';
    }
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value)) {
      return 'Only letters, numbers, and hyphens allowed';
    }
    if (value.length > 56) {
      return 'Name must not exceed 56 characters';
    }
    return '';
  }, []);

  const handleNameChange = useCallback(
    event => {
      const newValue = event.target.value;
      setName(newValue);
      setError(validateName(newValue));
    },
    [validateName],
  );

  const handleConfirm = useCallback(() => {
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm?.(name.trim());
  }, [name, onConfirm, validateName]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleConfirm, handleCancel],
  );

  // Prevent click propagation to parent bucket selection
  const handleContainerClick = useCallback(event => {
    event.stopPropagation();
  }, []);

  return (
    <Box
      sx={styles.container}
      onClick={handleContainerClick}
    >
      <Box sx={styles.inputRow}>
        <Box sx={styles.contentInner}>
          <TextField
            inputRef={inputRef}
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="New Bucket..."
            size="small"
            variant="standard"
            error={!!error}
            disabled={isLoading}
            sx={styles.textField}
            slotProps={{
              input: {
                sx: styles.input,
                disableUnderline: true,
              },
            }}
          />
        </Box>
        <Box sx={styles.actionsContainer}>
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={handleConfirm}
            disabled={!!error || !name || isLoading}
            sx={styles.confirmButton}
          >
            <CheckIcon sx={styles.actionIcon} />
          </IconButton>
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={handleCancel}
            disabled={isLoading}
            sx={styles.cancelButton}
          >
            <CloseIcon sx={styles.actionIcon} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

NewBucketItem.displayName = 'NewBucketItem';

/** @type {MuiSx} */
const newBucketItemStyles = () => ({
  container: {
    padding: '0rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    background: 'transparent',
  },
  inputRow: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    borderBottom: `0.0625rem solid ${palette.primary.main}`,
    paddingBottom: 0,
  }),
  contentInner: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  textField: {
    flex: 1,
    minWidth: 0,
    paddingLeft: '0.7rem',
  },
  input: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.secondary,
    padding: '0.125rem 0',
    '&::placeholder': {
      color: palette.text.button.disabled,
      opacity: 1,
    },
  }),
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  confirmButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.success.main,
    '&.Mui-disabled': {
      color: palette.text.button.disabled,
    },
  }),
  cancelButton: {
    padding: '0.25rem',
  },
  actionIcon: {
    fontSize: '1rem',
  },
});

export default NewBucketItem;

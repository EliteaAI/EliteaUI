import React, { memo, useCallback, useMemo, useState } from 'react';

import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';

import { PathValidationHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';

const MAX_FOLDER_DEPTH = 10;

const UploadPathDialog = memo(props => {
  const { open, onClose, onConfirm, bucket = '', currentPrefix = '' } = props;

  const [folderPath, setFolderPath] = useState('');

  const getCurrentDepth = useCallback(prefix => {
    return prefix ? prefix.split('/').filter(Boolean).length : 0;
  }, []);

  const normalizePath = useCallback(path => {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }, []);

  const validationError = useMemo(
    () => PathValidationHelpers.validateFolderPath(folderPath, currentPrefix),
    [folderPath, currentPrefix],
  );

  const currentDepth = useMemo(() => getCurrentDepth(currentPrefix), [currentPrefix, getCurrentDepth]);
  const isAtMaxDepth = currentDepth >= MAX_FOLDER_DEPTH;

  const descriptionMessage = useMemo(() => {
    if (!currentPrefix) {
      return `Files will be uploaded to the selected bucket. Optionally, enter a folder path to organize your files. Use "/" to create nested folder(s).`;
    }

    if (isAtMaxDepth) {
      return `Files will be uploaded to "${bucket}/${currentPrefix}". Maximum folder depth reached. Files can only be uploaded to this location.`;
    }

    return `Files will be uploaded to "${bucket}/${currentPrefix}". Optionally, enter a subfolder path (relative to current location). Leave empty to upload to the current folder.`;
  }, [bucket, currentPrefix, isAtMaxDepth]);

  const handleConfirm = useCallback(() => {
    if (validationError) return;
    onConfirm(normalizePath(folderPath));
    setFolderPath('');
  }, [folderPath, onConfirm, validationError, normalizePath]);

  const handleCancel = useCallback(() => {
    setFolderPath('');
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !validationError) {
        event.preventDefault();
        handleConfirm();
      }
    },
    [validationError, handleConfirm],
  );

  const content = (
    <>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.description}
      >
        {descriptionMessage}
      </Typography>
      <Box sx={styles.textFieldContainer}>
        <TextField
          fullWidth
          label="Path"
          value={folderPath}
          onChange={e => setFolderPath(e.target.value)}
          variant="standard"
          sx={styles.textField}
          error={!!validationError}
          helperText={validationError || ' '}
          disabled={isAtMaxDepth}
          slotProps={{
            input: {
              startAdornment: bucket && (
                <InputAdornment
                  position="start"
                  sx={styles.adornment}
                >
                  {bucket}/{currentPrefix}
                </InputAdornment>
              ),
            },
          }}
          autoFocus
        />
      </Box>
    </>
  );

  const actions = (
    <>
      <Button
        variant="alita"
        color="secondary"
        onClick={handleCancel}
        sx={styles.cancelButton}
      >
        Cancel
      </Button>
      <Button
        variant="alita"
        color="primary"
        onClick={handleConfirm}
        disabled={!!validationError}
        sx={styles.confirmButton}
      >
        Upload
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={handleCancel}
      title="Upload files to ..."
      content={content}
      actions={actions}
      onKeyDown={handleKeyDown}
    />
  );
});

UploadPathDialog.displayName = 'UploadPathDialog';

/** @type {MuiSx} */
const styles = {
  description: {
    marginBottom: '0.5rem',
  },
  textFieldContainer: {
    minHeight: '5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  textField: {
    marginTop: '0.5rem',
    '& .MuiInput-root': {
      alignItems: 'baseline',
      fontSize: '0.875rem',
    },
    '& .MuiFormHelperText-root': {
      height: '1.5rem',
      margin: '0.25rem 0 0 0',
      lineHeight: '1.5rem',
    },
  },
  adornment: ({ palette }) => ({
    color: palette.text.secondary,
    marginRight: 0,
    marginBottom: 0,
    userSelect: 'none',
    '& .MuiTypography-root': {
      color: palette.text.secondary,
    },
  }),
};

export default UploadPathDialog;

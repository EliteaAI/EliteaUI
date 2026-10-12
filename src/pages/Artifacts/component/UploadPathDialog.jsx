import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, InputAdornment, TextField, Typography } from '@mui/material';

import { PathValidationHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';

const UploadPathDialog = memo(props => {
  const { open, onClose, onConfirm, bucket = '', currentPrefix = '' } = props;

  const [folderPath, setFolderPath] = useState(currentPrefix || '');

  useEffect(() => {
    if (open) setFolderPath(currentPrefix || '');
  }, [open, currentPrefix]);

  const normalizePath = useCallback(path => {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }, []);

  const validationError = useMemo(
    () => PathValidationHelpers.validateFolderPath(folderPath, ''),
    [folderPath],
  );

  const descriptionMessage = useMemo(() => {
    if (!currentPrefix) {
      return `Files will be uploaded to the selected bucket. Edit the path to choose a destination folder, or leave empty to upload to the bucket root.`;
    }

    return `Edit the path to choose any destination within "${bucket}/". You can navigate to a parent folder by removing path segments, or enter a deeper subfolder.`;
  }, [bucket, currentPrefix]);

  const handleConfirm = useCallback(() => {
    if (validationError) return;
    onConfirm(normalizePath(folderPath));
    setFolderPath('');
  }, [folderPath, onConfirm, validationError, normalizePath]);

  const handleCancel = useCallback(() => {
    setFolderPath(currentPrefix || '');
    onClose();
  }, [onClose, currentPrefix]);

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
        data-testid="artifacts-upload-path-description-text"
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.description}
      >
        {descriptionMessage}
      </Typography>
      <Box sx={styles.textFieldContainer}>
        <TextField
          data-testid="artifacts-upload-path-input"
          fullWidth
          label="Path"
          value={folderPath}
          onChange={e => setFolderPath(e.target.value)}
          variant="standard"
          sx={styles.textField}
          error={!!validationError}
          helperText={validationError || ' '}
          slotProps={{
            input: {
              startAdornment: bucket && (
                <InputAdornment
                  position="start"
                  sx={styles.adornment}
                >
                  {bucket}/
                </InputAdornment>
              ),
            },
            htmlInput: { 'data-testid': 'artifacts-upload-path-input-field' },
          }}
          autoFocus
        />
      </Box>
    </>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        onClick={handleCancel}
        sx={styles.cancelButton}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        data-testid="artifacts-upload-path-upload-button"
        variant="elitea"
        color="primary"
        onClick={handleConfirm}
        disabled={!!validationError}
        sx={styles.confirmButton}
      >
        Upload
      </Button.BaseBtn>
    </>
  );

  return (
    <BaseModal
      data-testid="artifacts-upload-path-dialog"
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

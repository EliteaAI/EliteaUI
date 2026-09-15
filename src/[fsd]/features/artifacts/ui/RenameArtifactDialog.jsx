import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, InputAdornment, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const getFileNameParts = filename => {
  if (!filename) return { baseName: '', extension: '' };
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { baseName: filename, extension: '' };
  }
  return {
    baseName: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex),
  };
};

const RenameArtifactDialog = memo(props => {
  const { open, artifact, onClose, onConfirm, isLoading } = props;

  const [newBaseName, setNewBaseName] = useState('');
  const [error, setError] = useState('');

  const { baseName: originalBaseName, extension } = useMemo(
    () => getFileNameParts(artifact?.name),
    [artifact?.name],
  );

  useEffect(() => {
    if (open && artifact) {
      setNewBaseName(originalBaseName);
      setError('');
    }
  }, [open, artifact, originalBaseName]);

  const handleNameChange = useCallback(e => {
    setNewBaseName(e.target.value);
    setError('');
  }, []);

  const fullNewName = useMemo(() => newBaseName.trim() + extension, [newBaseName, extension]);

  const handleConfirm = useCallback(() => {
    const trimmedBaseName = newBaseName.trim();
    if (!trimmedBaseName) {
      setError('File name cannot be empty');
      return;
    }
    if (trimmedBaseName === originalBaseName) {
      setError('New name must be different from current name');
      return;
    }
    if (trimmedBaseName.includes('/')) {
      setError('File name cannot contain slashes');
      return;
    }
    onConfirm(fullNewName);
  }, [newBaseName, originalBaseName, fullNewName, onConfirm]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !isLoading) {
        handleConfirm();
      }
    },
    [handleConfirm, isLoading],
  );

  const styles = renameArtifactDialogStyles();

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title="Rename file"
      onClose={onClose}
      sx={styles.modal}
      content={
        <Box sx={styles.content}>
          <Typography
            variant="bodyMedium"
            sx={styles.label}
          >
            Enter new file name:
          </Typography>
          <Input.InputBase
            value={newBaseName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter file name"
            autoFocus
            error={!!error}
            helperText={error}
            disabled={isLoading}
            fullWidth
            slotProps={{
              input: {
                endAdornment: extension ? (
                  <InputAdornment position="end">
                    <Typography
                      variant="bodyMedium"
                      sx={styles.extension}
                    >
                      {extension}
                    </Typography>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Box>
      }
      actions={
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            color={BUTTON_COLORS.secondary}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={handleConfirm}
            disabled={isLoading || !newBaseName.trim()}
          >
            {isLoading ? 'Renaming...' : 'Rename'}
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

RenameArtifactDialog.displayName = 'RenameArtifactDialog';

/** @type {MuiSx} */
const renameArtifactDialogStyles = () => ({
  modal: {
    paper: {
      width: '25rem',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  extension: ({ palette }) => ({
    color: palette.text.secondary,
    userSelect: 'none',
  }),
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '1rem',
  },
});

export default RenameArtifactDialog;

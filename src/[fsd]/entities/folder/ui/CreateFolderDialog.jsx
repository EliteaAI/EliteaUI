import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';

import { Input, Modal } from '@/[fsd]/shared/ui';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
import useToast from '@/hooks/useToast';

import { useCreateFolder, useUpdateFolder } from '../lib/hooks';

const CreateFolderDialog = memo(props => {
  const { open, onClose, onFolderCreated, entityType, folder } = props;

  const isEditMode = !!folder;
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const { createFolder, isLoading: isCreating } = useCreateFolder();
  const { updateFolder, isLoading: isUpdating } = useUpdateFolder();
  const { toastSuccess, toastError } = useToast();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (open && folder) {
      setFolderName(folder.name || '');
    } else if (!open) {
      setFolderName('');
      setError('');
    }
  }, [open, folder]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const handleNameChange = useCallback(
    e => {
      setFolderName(e.target.value);
      if (error) setError('');
    },
    [error],
  );

  const handleClose = useCallback(() => {
    setFolderName('');
    setError('');
    onClose?.();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    if (trimmedName.length > 128) {
      setError('Folder name must be 128 characters or less');
      return;
    }

    try {
      if (isEditMode) {
        await updateFolder({ folderId: folder.id, name: trimmedName, entityType });
        toastSuccess('Folder updated successfully');
        handleClose();
      } else {
        const newFolder = await createFolder({ name: trimmedName, entityType });
        if (onFolderCreated) {
          onFolderCreated(newFolder);
        } else {
          toastSuccess('Folder created successfully');
          handleClose();
        }
      }
    } catch {
      toastError(isEditMode ? 'Failed to update folder' : 'Failed to create folder');
    }
  }, [
    folderName,
    entityType,
    isEditMode,
    folder,
    createFolder,
    updateFolder,
    toastSuccess,
    toastError,
    handleClose,
    onFolderCreated,
  ]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !isLoading) {
        handleSubmit();
      }
    },
    [handleSubmit, isLoading],
  );

  const renderContent = (
    <Box>
      <Input.InputBase
        inputRef={inputRef}
        variant={INPUT_VARIANTS.standard}
        label="Folder Name"
        placeholder="Enter folder name"
        value={folderName}
        onChange={handleNameChange}
        onKeyDown={handleKeyDown}
        error={!!error}
        helperText={error}
        disabled={isLoading}
        inputProps={{ maxLength: 128 }}
        data-testid="create-folder-name-input"
      />
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEditMode ? 'Edit Folder' : 'Create Folder'}
      onClose={handleClose}
      onConfirm={handleSubmit}
      content={renderContent}
      confirmButtonText={isLoading ? 'Saving...' : 'Save'}
      cancelButtonText="Cancel"
      confirming={isLoading || !folderName.trim()}
      data-testid="create-folder-dialog"
      confirmButtonTestId="create-folder-submit-btn"
      cancelButtonTestId="create-folder-cancel-btn"
    />
  );
});

CreateFolderDialog.displayName = 'CreateFolderDialog';

export default CreateFolderDialog;

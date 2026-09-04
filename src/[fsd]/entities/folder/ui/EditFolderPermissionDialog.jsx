import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { FOLDER_EDIT_EXCEPTION_OPTIONS } from '@/[fsd]/entities/folder/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

const EditFolderPermissionDialog = memo(props => {
  const { open, onClose, onConfirm, user, loading = false } = props;

  const [permission, setPermission] = useState('');
  const canSubmit = !!permission && permission !== user?.accessValue && !loading;

  useEffect(() => {
    if (open && user) {
      setPermission(user.accessValue || '');
    } else if (!open) {
      setPermission('');
    }
  }, [open, user]);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    onConfirm({ permission });
  }, [canSubmit, onConfirm, permission]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key !== 'Enter' || !canSubmit) return;
      event.preventDefault();
      handleConfirm();
    },
    [canSubmit, handleConfirm],
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Edit exception"
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.description}
          >
            Select new folder permissions for {user?.name || user?.email || 'this user'}.
          </Typography>
          <SingleSelect
            value={permission}
            onValueChange={setPermission}
            options={FOLDER_EDIT_EXCEPTION_OPTIONS}
            label="Permissions"
            showBorder
            labelSX={styles.labelSx}
            disabled={loading}
          />
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant="elitea"
            color="primary"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            Save
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

EditFolderPermissionDialog.displayName = 'EditFolderPermissionDialog';

export default EditFolderPermissionDialog;

const styles = {
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '25rem',
  },
  description: {
    marginBottom: '0.5rem',
  },
  actionsWrapper: {
    display: 'flex',
    gap: '0.75rem',
  },
  labelSx: ({ typography }) => ({
    ...typography.labelMedium,
  }),
};

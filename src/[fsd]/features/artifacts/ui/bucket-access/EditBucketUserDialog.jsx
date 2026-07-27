import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { BucketAccessConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

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

const EditBucketUserDialog = memo(props => {
  const { open, onClose, onConfirm, users = [], loading = false } = props;

  const [permission, setPermission] = useState('');

  const isBulkEdit = users.length > 1;

  useEffect(() => {
    if (open && users.length > 0) {
      if (isBulkEdit) {
        setPermission('');
      } else {
        const firstUser = users[0];
        setPermission(firstUser.currentPermission || '');
      }
    } else if (!open) {
      setPermission('');
    }
  }, [open, users, isBulkEdit]);

  const handleConfirm = useCallback(() => {
    onConfirm({ permission });
  }, [permission, onConfirm]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  const handlePermissionChange = useCallback(value => {
    setPermission(value);
  }, []);

  return (
    <Modal.BaseModal
      open={open}
      title="Edit exception"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.description}
          >
            Select new bucket permissions for these users.
          </Typography>
          <SingleSelect
            value={permission}
            onValueChange={handlePermissionChange}
            options={BucketAccessConstants.EDIT_EXCEPTION_OPTIONS}
            label="Permissions"
            showBorder
            labelSX={styles.labelSx}
          />
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={onClose}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant="elitea"
            color="primary"
            onClick={handleConfirm}
            disabled={!permission || loading}
          >
            Save
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

EditBucketUserDialog.displayName = 'EditBucketUserDialog';

export default EditBucketUserDialog;

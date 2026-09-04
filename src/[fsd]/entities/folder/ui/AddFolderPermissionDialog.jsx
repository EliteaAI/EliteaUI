import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Autocomplete, Button, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useUserListQuery } from '@/api/admin';

const PERMISSION_OPTIONS = [
  { value: 'read_only', label: 'Read-only' },
  { value: 'no_access', label: 'No access' },
];

const AddFolderPermissionDialog = memo(props => {
  const { open, onClose, onConfirm, projectId, existingUserIds = [], loading = false } = props;

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('');

  const { data: usersData, isLoading: isLoadingUsers } = useUserListQuery(
    { projectId, page: 0, pageSize: 100 },
    { skip: !projectId || !open },
  );

  const availableUsers = useMemo(
    () =>
      (usersData?.rows || [])
        .filter(user => !existingUserIds.includes(user.id))
        .map(user => ({ ...user, name: user.name || user.email || '' })),
    [usersData?.rows, existingUserIds],
  );

  const canSubmit = selectedUsers.length > 0 && !!permission && !loading;

  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setPermission('');
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    onConfirm({ users: selectedUsers, permission });
  }, [canSubmit, onConfirm, permission, selectedUsers]);

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
      title="Add exceptions"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.description}
          >
            Select users, then restrict their folder permissions.
          </Typography>
          <Autocomplete.UserSearchSelect
            userList={availableUsers}
            selectedUsers={selectedUsers}
            onChangeUsers={setSelectedUsers}
            disabled={isLoadingUsers || loading}
            label="Users"
            showSearchIcon={false}
            sx={styles.userSelect}
          />
          <SingleSelect
            value={permission}
            onValueChange={setPermission}
            options={PERMISSION_OPTIONS}
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
            onClick={onClose}
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

AddFolderPermissionDialog.displayName = 'AddFolderPermissionDialog';

export default AddFolderPermissionDialog;

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
  userSelect: ({ typography }) => ({
    '& .MuiInputLabel-root': {
      ...typography.labelMedium,
    },
  }),
  labelSx: ({ typography }) => ({
    ...typography.labelMedium,
  }),
};

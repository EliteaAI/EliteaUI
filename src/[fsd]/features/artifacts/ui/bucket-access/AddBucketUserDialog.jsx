import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { BucketAccessConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { Autocomplete, Button, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useUserListQuery } from '@/api/admin';

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

const AddBucketUserDialog = memo(props => {
  const { open, onClose, onConfirm, projectId, existingUserIds = [], loading = false } = props;

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('');

  const { data: usersData, isLoading: isLoadingUsers } = useUserListQuery(
    { projectId, page: 0, pageSize: 100 },
    { skip: !projectId || !open },
  );

  const users = useMemo(() => usersData?.rows || [], [usersData]);

  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setPermission('');
    }
  }, [open]);

  const availableUsers = useMemo(
    () => users.filter(u => !existingUserIds.includes(u.id)),
    [users, existingUserIds],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedUsers.length) return;
    onConfirm({ users: selectedUsers, permission });
  }, [selectedUsers, permission, onConfirm]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && selectedUsers.length > 0) {
        event.preventDefault();
        handleConfirm();
      }
    },
    [selectedUsers, handleConfirm],
  );

  const handlePermissionChange = useCallback(value => {
    setPermission(value);
  }, []);

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
            Select users, then assign their bucket permissions.
          </Typography>
          <Autocomplete.UserSearchSelect
            userList={availableUsers}
            selectedUsers={selectedUsers}
            onChangeUsers={setSelectedUsers}
            disabled={isLoadingUsers}
            label="Users"
            showSearchIcon={false}
            sx={styles.userSelect}
          />
          <SingleSelect
            value={permission}
            onValueChange={handlePermissionChange}
            options={BucketAccessConstants.ADD_EXCEPTION_OPTIONS}
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
            disabled={selectedUsers.length === 0 || !permission || loading}
          >
            Save
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

AddBucketUserDialog.displayName = 'AddBucketUserDialog';

export default AddBucketUserDialog;

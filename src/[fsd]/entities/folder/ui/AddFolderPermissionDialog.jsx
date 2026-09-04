import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  FOLDER_ADD_EXCEPTION_OPTIONS,
  MAX_FOLDER_PERMISSION_ENTRIES,
} from '@/[fsd]/entities/folder/lib/constants';
import { Autocomplete, Button, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useUserListQuery } from '@/api/admin';

const USERS_PAGE_SIZE = 100;

const AddFolderPermissionDialog = memo(props => {
  const { open, onClose, onConfirm, projectId, existingUserIds = [], loading = false } = props;

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('');
  const [page, setPage] = useState(0);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useUserListQuery({ projectId, page, pageSize: USERS_PAGE_SIZE }, { skip: !projectId || !open });

  const users = useMemo(() => usersData?.rows || [], [usersData?.rows]);
  const totalUsers = usersData?.total || 0;

  const availableUsers = useMemo(
    () =>
      users
        .filter(user => !existingUserIds.includes(user.id))
        .map(user => ({ ...user, name: user.name || user.email || '' })),
    [existingUserIds, users],
  );

  const exceedsSelectionLimit = selectedUsers.length > MAX_FOLDER_PERMISSION_ENTRIES;
  const canSubmit = selectedUsers.length > 0 && !exceedsSelectionLimit && !!permission && !loading;

  useEffect(() => {
    setPage(0);
    if (!open) {
      setSelectedUsers([]);
      setPermission('');
    }
  }, [open, projectId]);

  const handleUsersScroll = useCallback(
    event => {
      const listbox = event.currentTarget;
      const bottomReached = listbox.scrollHeight - listbox.scrollTop <= listbox.clientHeight + 40;

      if (bottomReached && !isFetchingUsers && users.length < totalUsers) {
        setPage(currentPage => currentPage + 1);
      }
    },
    [isFetchingUsers, totalUsers, users.length],
  );

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
            slotProps={{ listBox: { onScroll: handleUsersScroll } }}
          />
          {exceedsSelectionLimit && (
            <Typography
              variant="bodySmall"
              color="error"
            >
              Select no more than {MAX_FOLDER_PERMISSION_ENTRIES} users.
            </Typography>
          )}
          <SingleSelect
            value={permission}
            onValueChange={setPermission}
            options={FOLDER_ADD_EXCEPTION_OPTIONS}
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

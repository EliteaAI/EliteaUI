import { memo, useCallback, useEffect, useState } from 'react';

import { Box, MenuItem, Select, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';

import { ACCESS_OPTIONS } from './constants';

const styles = {
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '20rem',
  },
  actionsWrapper: {
    display: 'flex',
    gap: '1rem',
  },
  usersListWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: 'background.secondary',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  select: {
    width: '100%',
  },
};

const BulkEditBucketUsersDialog = memo(props => {
  const { open, onClose, onConfirm, selectedUsers = [], loading = false } = props;

  const [permission, setPermission] = useState('read');

  useEffect(() => {
    if (!open) {
      setPermission('read');
    }
  }, [open]);

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

  return (
    <Modal.BaseModal
      open={open}
      title="Edit Access for Multiple Users"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Set the same permission for {selectedUsers.length} selected user
            {selectedUsers.length !== 1 ? 's' : ''}.
          </Typography>
          <Box sx={styles.usersListWrapper}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              Selected users
            </Typography>
            <Box sx={styles.usersList}>
              {selectedUsers.slice(0, 5).map(user => (
                <Typography
                  key={user.id}
                  variant="bodySmall"
                  color="text.primary"
                >
                  {user.name || user.email}
                </Typography>
              ))}
              {selectedUsers.length > 5 && (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  ... and {selectedUsers.length - 5} more
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={styles.fieldWrapper}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              Permission
            </Typography>
            <Select
              size="small"
              value={permission}
              onChange={e => setPermission(e.target.value)}
              sx={styles.select}
            >
              {ACCESS_OPTIONS.map(opt => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
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
            disabled={loading || selectedUsers.length === 0}
          >
            Update {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

BulkEditBucketUsersDialog.displayName = 'BulkEditBucketUsersDialog';

export default BulkEditBucketUsersDialog;

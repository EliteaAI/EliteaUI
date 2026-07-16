import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Autocomplete, Box, MenuItem, Select, TextField, Typography } from '@mui/material';

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
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  autocomplete: {
    width: '100%',
  },
  select: {
    width: '100%',
  },
  optionContent: {
    display: 'flex',
    flexDirection: 'column',
  },
};

const AddBucketUserDialog = memo(props => {
  const { open, onClose, onConfirm, users = [], existingUserIds = [], loading = false } = props;

  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState('read');

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setPermission('read');
    }
  }, [open]);

  const availableUsers = useMemo(
    () => users.filter(u => !existingUserIds.includes(u.id)),
    [users, existingUserIds],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedUser) return;
    onConfirm({ user: selectedUser, permission });
  }, [selectedUser, permission, onConfirm]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && selectedUser) {
        event.preventDefault();
        handleConfirm();
      }
    },
    [selectedUser, handleConfirm],
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Add User Access"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Select a user and assign bucket permissions.
          </Typography>
          <Box sx={styles.fieldWrapper}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              User
            </Typography>
            <Autocomplete
              options={availableUsers}
              getOptionLabel={u => u.name || u.email || ''}
              value={selectedUser}
              onChange={(_, v) => setSelectedUser(v)}
              size="small"
              sx={styles.autocomplete}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Select user"
                  size="small"
                />
              )}
              renderOption={(optionProps, option) => {
                const { key, ...otherOptionProps } = optionProps;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...otherOptionProps}
                  >
                    <Box sx={styles.optionContent}>
                      <Typography variant="bodyMedium">{option.name || option.email}</Typography>
                      {option.name && (
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                        >
                          {option.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
            />
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
            disabled={!selectedUser || loading}
          >
            Add
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

AddBucketUserDialog.displayName = 'AddBucketUserDialog';

export default AddBucketUserDialog;

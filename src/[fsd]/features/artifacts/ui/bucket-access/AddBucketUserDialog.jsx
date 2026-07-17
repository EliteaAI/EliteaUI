import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { useUserListQuery } from '@/api/admin';

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
  optionItem: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderBottom: `1px solid ${palette.border.lines}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      backgroundColor: palette.background.participant?.hover || palette.action.hover,
    },
  }),
  optionContent: {
    display: 'flex',
    flexDirection: 'column',
  },
};

const AddBucketUserDialog = memo(props => {
  const { open, onClose, onConfirm, projectId, existingUserIds = [], loading = false } = props;

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState('read');

  const { data: usersData, isLoading: isLoadingUsers } = useUserListQuery(
    { projectId, page: 0, pageSize: 100 },
    { skip: !projectId || !open },
  );

  const users = useMemo(() => usersData?.rows || [], [usersData]);

  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setPermission('read');
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
            Select users and assign bucket permissions.
          </Typography>
          <Box sx={styles.fieldWrapper}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              Users
            </Typography>
            <Autocomplete
              multiple
              options={availableUsers}
              getOptionLabel={u => u.name || u.email || ''}
              value={selectedUsers}
              onChange={(_, v) => setSelectedUsers(v)}
              loading={isLoadingUsers}
              size="small"
              sx={styles.autocomplete}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name || option.email}
                    size="small"
                  />
                ))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={selectedUsers.length === 0 ? 'Select users' : ''}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingUsers ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(optionProps, option) => {
                const { key, ...otherOptionProps } = optionProps;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...otherOptionProps}
                    sx={styles.optionItem}
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
            disabled={selectedUsers.length === 0 || loading}
          >
            Add {selectedUsers.length > 1 ? `(${selectedUsers.length})` : ''}
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

AddBucketUserDialog.displayName = 'AddBucketUserDialog';

export default AddBucketUserDialog;

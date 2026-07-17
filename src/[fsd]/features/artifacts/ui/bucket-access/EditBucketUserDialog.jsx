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
  userInfoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: 'background.secondary',
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

const EditBucketUserDialog = memo(props => {
  const { open, onClose, onConfirm, user, loading = false } = props;

  const [permission, setPermission] = useState('read');

  useEffect(() => {
    if (open && user) {
      setPermission(user.currentPermission || 'read');
    } else if (!open) {
      setPermission('read');
    }
  }, [open, user]);

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
      title="Edit User Access"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Box sx={styles.userInfoWrapper}>
            <Box sx={styles.fieldWrapper}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
              >
                Name
              </Typography>
              <Typography
                variant="bodyMedium"
                color="text.primary"
              >
                {user?.name || '-'}
              </Typography>
            </Box>
            <Box sx={styles.fieldWrapper}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
              >
                Email
              </Typography>
              <Typography
                variant="bodyMedium"
                color="text.primary"
              >
                {user?.email || '-'}
              </Typography>
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
            disabled={loading}
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

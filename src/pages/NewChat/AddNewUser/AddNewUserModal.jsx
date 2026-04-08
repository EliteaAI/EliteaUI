import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material';

import { ChatParticipantType } from '@/common/constants';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';
import useGetComponentHeight from '@/hooks/useGetComponentHeight';
import { useUserList } from '@/hooks/useUserList';

import UserSearchSelect from './UserSearchSelect';

export function AddNewUserModal({ participants, open, onAdd, onCancel }) {
  const theme = useTheme();
  const [localUsers, setLocalUsers] = useState([]);
  const listboxRef = useRef(null);
  const { componentHeight, componentRef } = useGetComponentHeight();
  const existingUserIds = useMemo(
    () =>
      participants
        .filter(item => item.entity_name === ChatParticipantType.Users)
        .map(item => item.entity_meta.id),
    [participants],
  );
  const {
    onLoadMoreUsers,
    data: usersData,
    isUsersFetching,
  } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query: '',
    pageSize: 20,
  });
  const { rows: users = [], total: usersTotal = 0 } = usersData || {};

  const loadMoreUsers = useCallback(() => {
    if (usersTotal <= users.length) {
      return;
    }
    onLoadMoreUsers();
  }, [usersTotal, users.length, onLoadMoreUsers]);

  // Handle scroll to bottom
  const handleScroll = useCallback(
    event => {
      const listbox = event.currentTarget;
      const threshold = 10; // pixels from bottom to trigger load more

      if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - threshold && !isUsersFetching) {
        loadMoreUsers();
      }
    },
    [isUsersFetching, loadMoreUsers],
  );

  const onChangeUsers = useCallback(newlySelectedUsers => {
    setLocalUsers(newlySelectedUsers);
  }, []);

  const handleOK = useCallback(() => onAdd(localUsers), [localUsers, onAdd]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && localUsers.length > 0) {
        event.preventDefault();
        handleOK();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    },
    [localUsers.length, handleOK, onCancel],
  );

  useEffect(() => {
    if (!open) {
      setLocalUsers([]); // Reset local users when dialog is closed
    }
  }, [open]);

  return (
    <StyledDialog
      open={open}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          width: '490px !important', // or any custom width
          maxWidth: '60% !important', // or any custom width
          background: `${theme.palette.background.tabPanel} !important`,
          backgroundColor: `${theme.palette.background.tabPanel} !important`,
        },
      }}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={{ height: '60px' }}
      >
        <Typography variant="headingSmall">Add users</Typography>
      </DialogTitle>
      <DialogContent
        ref={componentRef}
        sx={{
          width: '100%',
          overflow: 'auto',
          background: `${theme.palette.background.secondary} !important`,
          borderTop: `1px solid ${theme.palette.border.lines}`,
          borderBottom: `1px solid ${theme.palette.border.lines}`,
          maxHeight: 'calc(100vh - 380px)',
          boxSizing: 'border-box',
          padding: '24px !important',
          overflowY: 'scroll',
        }}
      >
        <UserSearchSelect
          userList={users
            .filter(user => !existingUserIds.includes(user.id))
            .map(user => ({
              ...user,
              name: user.name || user.email || '',
              participantType: ChatParticipantType.Users,
            }))}
          selectedUsers={localUsers}
          onChangeUsers={onChangeUsers}
          slotProps={{
            listBox: {
              ref: listboxRef,
              onScroll: handleScroll,
              style: {
                height: `calc(50vh - ${(componentHeight || 96) / 2 + 20}px)`,
                maxHeight: `calc(50vh - 40px)`,
                overflowY: 'auto',
              },
            },
          }}
        />
      </DialogContent>
      <StyledDialogActions
        sx={{
          alignItems: 'center',
          flexDirection: 'row',
          padding: '12px 24px !important',
          gap: '12px',
          height: '60px',
        }}
      >
        <Button
          variant="elitea"
          color="secondary"
          onClick={onCancel}
          disableRipple
        >
          Cancel
        </Button>
        <Button
          disabled={!localUsers.length}
          variant="elitea"
          onClick={handleOK}
          disableRipple
        >
          Add
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}

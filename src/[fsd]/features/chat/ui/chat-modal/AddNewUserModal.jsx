import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Button, DialogContent, DialogTitle, Typography } from '@mui/material';

import { ChatParticipantType } from '@/common/constants';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';
import useGetComponentHeight from '@/hooks/useGetComponentHeight';
import { useUserList } from '@/hooks/useUserList';
import UserSearchSelect from '@/pages/NewChat/AddNewUser/UserSearchSelect';

const AddNewUserModal = memo(props => {
  const { participants, open, onAdd, onCancel } = props;

  const listboxRef = useRef(null);

  const styles = addNewUserModalStyles();

  const currentUserId = useSelector(state => state.user.id);

  const [localUsers, setLocalUsers] = useState([]);

  const { componentHeight, componentRef } = useGetComponentHeight();

  const excludedUserIds = useMemo(
    () => [
      ...participants
        .filter(item => item.entity_name === ChatParticipantType.Users)
        .map(item => item.entity_meta.id),
      ...(currentUserId ? [currentUserId] : []),
    ],
    [participants, currentUserId],
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

  const usersList = useMemo(
    () =>
      users
        .filter(user => !excludedUserIds.includes(user.id))
        .map(user => ({
          ...user,
          name: user.name || user.email || '',
          participantType: ChatParticipantType.Users,
        })),
    [excludedUserIds, users],
  );

  const loadMoreUsers = useCallback(() => {
    if (usersTotal <= users.length) return;

    onLoadMoreUsers();
  }, [usersTotal, users.length, onLoadMoreUsers]);

  // Handle scroll to bottom
  const handleScroll = useCallback(
    event => {
      const listbox = event.currentTarget;
      const threshold = 10; // pixels from bottom to trigger load more

      if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - threshold && !isUsersFetching)
        loadMoreUsers();
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
    if (!open) setLocalUsers([]); // Reset local users when dialog is closed
  }, [open]);

  return (
    <StyledDialog
      open={open}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={styles.dialog}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={{ height: '60px' }}
      >
        <Typography variant="headingSmall">Add users</Typography>
      </DialogTitle>
      <DialogContent
        ref={componentRef}
        sx={styles.dialogContent}
      >
        <UserSearchSelect
          userList={usersList}
          selectedUsers={localUsers}
          onChangeUsers={onChangeUsers}
          slotProps={{
            listBox: {
              ref: listboxRef,
              onScroll: handleScroll,
              style: {
                height: `calc(50vh - ${(componentHeight || 96) / 2 + 20}px)`,
                maxHeight: `calc(50vh - 2.5rem)`,
                overflowY: 'auto',
              },
            },
          }}
        />
      </DialogContent>
      <StyledDialogActions sx={styles.actions}>
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
});

AddNewUserModal.displayName = 'AddNewUserModal';

/** @type {MuiSx} */
const addNewUserModalStyles = () => ({
  dialog: ({ palette }) => ({
    '& .MuiDialog-paper': {
      width: '30.625rem !important', // or any custom width
      maxWidth: '60% !important', // or any custom width
      background: `${palette.background.tabPanel} !important`,
      backgroundColor: `${palette.background.tabPanel} !important`,
    },
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    overflow: 'auto',
    background: `${palette.background.secondary} !important`,
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    maxHeight: 'calc(100vh - 23.75rem)',
    boxSizing: 'border-box',
    padding: '1.5rem !important',
    overflowY: 'scroll',
  }),
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
});

export default AddNewUserModal;

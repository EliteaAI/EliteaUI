import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { Autocomplete, Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ChatParticipantType } from '@/common/constants';
import { useUserList } from '@/hooks/useUserList';

const AddNewUserModal = memo(props => {
  const { participants, open, onAdd, onCancel } = props;

  const listboxRef = useRef(null);

  const styles = addNewUserModalStyles();

  const currentUserId = useSelector(state => state.user.id);

  const [localUsers, setLocalUsers] = useState([]);

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

  const handleScroll = useCallback(
    event => {
      const listbox = event.currentTarget;
      const threshold = 10;

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
      }
    },
    [localUsers.length, handleOK],
  );

  useEffect(() => {
    if (!open) setLocalUsers([]); // Reset local users when dialog is closed
  }, [open]);

  return (
    <Modal.BaseModal
      open={open}
      title="Add users"
      onClose={onCancel}
      onKeyDown={handleKeyDown}
      sx={styles.dialog}
      data-testid="add-users-dialog"
      closeButtonTestId="add-users-close-button"
      content={
        <Box>
          <Autocomplete.UserSearchSelect
            userList={usersList}
            selectedUsers={localUsers}
            onChangeUsers={onChangeUsers}
            inputTestId="add-users-search-input"
            chipTestId={user => `add-users-chip-${user.id}`}
            getOptionTestId={option => `add-users-option-${option.id}`}
            slotProps={{
              listBox: {
                ref: listboxRef,
                onScroll: handleScroll,
                style: {
                  maxHeight: '40rem',
                  overflowY: 'auto',
                },
              },
            }}
          />
        </Box>
      }
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onCancel}
            data-testid="add-users-cancel-button"
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            disabled={!localUsers.length}
            variant={BUTTON_VARIANTS.elitea}
            onClick={handleOK}
            data-testid="add-users-confirm-button"
          >
            Add
          </Button.BaseBtn>
        </>
      }
    />
  );
});

AddNewUserModal.displayName = 'AddNewUserModal';

/** @type {MuiSx} */
const addNewUserModalStyles = () => ({
  dialog: ({ palette }) => ({
    '& .MuiDialog-paper': {
      width: '30.625rem !important',
      maxWidth: '60% !important',
      background: `${palette.background.tabPanel} !important`,
      backgroundColor: `${palette.background.tabPanel} !important`,
    },
  }),
});

export default AddNewUserModal;

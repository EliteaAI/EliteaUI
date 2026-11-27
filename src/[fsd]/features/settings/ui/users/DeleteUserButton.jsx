import { memo, useCallback, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { useUserDeleteMutation } from '@/api/admin';
import { PRIVATE_PROJECT_NAME } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import RouteDefinitions from '@/routes';
import { actions as settingsActions } from '@/slices/settings.js';

const DeleteUserButton = memo(props => {
  const { users, disabled, setSelectedUsers, useSecondaryButton = false, testId, tooltip } = props;
  const styles = deleteUserButtonStyles(disabled, useSecondaryButton);
  const { toastError, toastSuccess } = useToast();
  const projectId = useSelectedProjectId();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: currentUserId, personal_project_id: privateProjectId } = useSelector(state => state.user);
  const [openAlert, setOpenAlert] = useState(false);

  const [deleteUser, { isLoading }] = useUserDeleteMutation();
  const onClickDelete = useCallback(() => {
    setOpenAlert(true);
  }, []);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
  }, []);

  // The users list is refreshed by the mutation's tag invalidation, no manual refetch needed
  const onConfirmAlert = useCallback(async () => {
    onCloseAlert();
    const removesSelf = users.some(({ id }) => Number(id) === Number(currentUserId));
    try {
      await deleteUser({
        projectId,
        removesSelf,
        params: {
          ids: users.map(({ id }) => id),
        },
      }).unwrap();
    } catch (err) {
      toastError(buildErrorMessage(err));
      return;
    }

    if (removesSelf) {
      // The user no longer belongs to this project, so leave it for the private one. Replace the history
      // entry so Back does not return to a page the user can no longer open.
      if (privateProjectId) {
        dispatch(settingsActions.setProject({ id: privateProjectId, name: PRIVATE_PROJECT_NAME }));
      }
      navigate(RouteDefinitions.SettingsProjectGeneral, { replace: true });
      return;
    }

    toastSuccess(
      users.length > 1
        ? 'The selected users have been successfully deleted.'
        : `The ${users[0]?.name || 'user'} user has been successfully deleted.`,
    );
    setSelectedUsers?.([]);
  }, [
    currentUserId,
    deleteUser,
    dispatch,
    navigate,
    onCloseAlert,
    privateProjectId,
    projectId,
    users,
    toastSuccess,
    toastError,
    setSelectedUsers,
  ]);

  return (
    <>
      <Tooltip
        title={tooltip || 'Delete user'}
        placement="top"
      >
        <Box component="span">
          <IconButton
            data-testid={testId}
            sx={styles.iconButton}
            variant="elitea"
            color={useSecondaryButton ? 'secondary' : 'tertiary'}
            aria-label="delete user"
            onClick={onClickDelete}
            disabled={disabled || isLoading}
          >
            <DeleteIcon sx={styles.deleteIcon} />
            {isLoading && <StyledCircleProgress />}
          </IconButton>
        </Box>
      </Tooltip>
      <Modal.DeleteEntityModal
        open={openAlert}
        onClose={onCloseAlert}
        onConfirm={onConfirmAlert}
        textContent={
          users.length > 1
            ? 'Are you sure to delete the selected users'
            : 'Are you sure to delete the selected user '
        }
        name={users.length > 1 ? '' : users[0]?.name || ''}
        inlineExtraContent="?"
      />
    </>
  );
});

DeleteUserButton.displayName = 'DeleteUserButton';

/** @type {MuiSx} */
const deleteUserButtonStyles = disabled => ({
  iconButton: {
    marginLeft: 0,
    '& svg': {
      fill: ({ palette }) => (!disabled ? palette.icon.default : palette.icon.disabled),
    },
  },
  deleteIcon: {
    fontSize: '1rem',
  },
});

export default DeleteUserButton;

import { memo, useCallback, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { useUserDeleteMutation } from '@/api/admin';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const DeleteUserButton = memo(props => {
  const { users, disabled, setSelectedUsers, useSecondaryButton = false, testId } = props;
  const styles = deleteUserButtonStyles(disabled, useSecondaryButton);
  const { toastError, toastSuccess } = useToast();
  const projectId = useSelectedProjectId();
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
    try {
      await deleteUser({
        projectId,
        params: {
          ids: users.map(({ id }) => id),
        },
      }).unwrap();
      toastSuccess(
        users.length > 1
          ? 'The selected users have been successfully deleted.'
          : `The ${users[0]?.name || 'user'} user has been successfully deleted.`,
      );
      setSelectedUsers?.([]);
    } catch (err) {
      toastError(buildErrorMessage(err));
    }
  }, [deleteUser, onCloseAlert, projectId, users, toastSuccess, toastError, setSelectedUsers]);

  return (
    <>
      <Tooltip
        title="Delete user"
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

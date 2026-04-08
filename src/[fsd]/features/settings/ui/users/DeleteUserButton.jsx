import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useUserDeleteMutation } from '@/api/admin';
import { buildErrorMessage } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const DeleteUserButton = memo(props => {
  const { users, refetch, disabled, setSelectedUsers, useSecondaryButton = false } = props;
  const styles = deleteUserButtonStyles(disabled, useSecondaryButton);
  const { toastError, toastSuccess } = useToast();
  const projectId = useSelectedProjectId();
  const [openAlert, setOpenAlert] = useState(false);

  const alertContent = useMemo(
    () =>
      `Are you sure to delete ${users.length > 1 ? 'the selected users' : `the selected user ${users[0]?.name || ''}`}?`,
    [users],
  );

  const [deleteUser, { isSuccess, isError, error, isLoading }] = useUserDeleteMutation();
  const onClickDelete = useCallback(() => {
    setOpenAlert(true);
  }, []);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
  }, []);

  const onConfirmAlert = useCallback(async () => {
    onCloseAlert();
    await deleteUser({
      projectId,
      params: {
        ids: users.map(({ id }) => id),
      },
    });
  }, [deleteUser, onCloseAlert, projectId, users]);

  useEffect(() => {
    if (isSuccess) {
      toastSuccess(users.length > 1 ? 'The users have been deleted' : 'The user has been deleted');
      setSelectedUsers([]);
      refetch();
    }
  }, [users.length, isSuccess, toastSuccess, refetch, setSelectedUsers]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <>
      <Tooltip
        title="Delete user"
        placement="top"
      >
        <Box component="span">
          <IconButton
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
      <AlertDialog
        title={'Delete user'}
        alertContent={alertContent}
        open={openAlert}
        alarm
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmAlert}
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
      fill: ({ palette }) => (!disabled ? palette.icon.fill.default : palette.icon.fill.disabled),
    },
  },
  deleteIcon: {
    fontSize: '1rem',
  },
});

export default DeleteUserButton;

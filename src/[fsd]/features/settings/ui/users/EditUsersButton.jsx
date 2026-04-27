import { memo, useCallback, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useBatchEditUsers, useEditUser } from '@/[fsd]/features/settings/lib/hooks';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import EditUserRolesDialog from '@/components/EditUserRolesDialog';
import EditIcon from '@/components/Icons/EditIcon';
import useToast from '@/hooks/useToast';

const EditUsersButton = memo(props => {
  const { users, refetch, disabled, setSelectedUsers, rolesOptions, isBatchEdit } = props;

  const { toastError, toastSuccess } = useToast();
  const [openEdit, setOpenEdit] = useState(false);

  const user = isBatchEdit ? null : Array.isArray(users) ? users[0] : users;

  const handleSuccess = useCallback(() => {
    if (isBatchEdit && setSelectedUsers) {
      setSelectedUsers([]);
    }
  }, [isBatchEdit, setSelectedUsers]);

  // Use appropriate hook based on single vs batch edit
  const singleEditHook = useEditUser({
    userId: user?.id,
    toastError,
    toastSuccess,
  });

  const batchEditHook = useBatchEditUsers({
    userIds: isBatchEdit ? users.map(({ id }) => id) : [],
    toastError,
    toastSuccess,
    onSuccess: handleSuccess,
    refetch,
  });

  const { saveUser, saveUsers, isLoading } = isBatchEdit
    ? { saveUser: null, saveUsers: batchEditHook.saveUsers, isLoading: batchEditHook.isLoading }
    : { saveUser: singleEditHook.saveUser, saveUsers: null, isLoading: singleEditHook.isLoading };

  const handleOpenEdit = useCallback(() => {
    setOpenEdit(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setOpenEdit(false);
  }, []);

  const handleConfirmEdit = useCallback(
    async roles => {
      handleCloseEdit();
      if (isBatchEdit) {
        await saveUsers(roles);
      } else {
        await saveUser(roles);
        await refetch();
      }
    },
    [isBatchEdit, saveUser, saveUsers, refetch, handleCloseEdit],
  );

  const styles = editUsersButtonStyles();

  return (
    <>
      <Tooltip
        title="Edit user role"
        placement="top"
      >
        <Box component="span">
          <IconButton
            disabled={disabled || isLoading}
            variant="alita"
            color={isBatchEdit ? 'secondary' : 'tertiary'}
            onClick={handleOpenEdit}
          >
            <EditIcon sx={styles.editIcon(disabled, isBatchEdit)} />
            {isLoading && <StyledCircleProgress />}
          </IconButton>
        </Box>
      </Tooltip>
      <EditUserRolesDialog
        title="Edit roles"
        open={openEdit}
        onClose={handleCloseEdit}
        onCancel={handleCloseEdit}
        onConfirm={handleConfirmEdit}
        rolesOptions={rolesOptions}
        originalRoles={isBatchEdit ? [] : user?.roles || []}
      />
    </>
  );
});

EditUsersButton.displayName = 'EditUsersButton';

/** @type {MuiSx} */
const editUsersButtonStyles = () => ({
  editIcon: (disabled, isBatchEdit) => ({
    width: '1rem',
    height: '1rem',
    '& path': {
      fill: ({ palette }) =>
        disabled
          ? palette.icon.fill.disabled
          : isBatchEdit
            ? palette.icon.fill.secondary
            : palette.icon.fill.default,
    },
  }),
});

export default EditUsersButton;

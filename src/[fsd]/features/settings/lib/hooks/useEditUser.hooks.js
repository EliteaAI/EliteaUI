import { useCallback } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useUserUpdateMutation } from '@/api/admin';
import { buildErrorMessage } from '@/common/utils';

export const useEditUser = ({ userId, toastError, toastSuccess }) => {
  const projectId = useSelectedProjectId();
  const [editUser, { isLoading }] = useUserUpdateMutation();

  const saveUser = useCallback(
    async selectedRoles => {
      const result = await editUser({
        projectId,
        id: userId,
        roles: selectedRoles,
      });
      if (result.error) {
        toastError(buildErrorMessage(result.error));
      } else {
        toastSuccess('The user has been edited successfully');
      }
    },
    [editUser, projectId, toastError, toastSuccess, userId],
  );

  return {
    saveUser,
    isLoading,
  };
};

export const useBatchEditUsers = ({ userIds, toastError, toastSuccess, onSuccess }) => {
  const projectId = useSelectedProjectId();
  const [editUser, { isLoading }] = useUserUpdateMutation();

  const saveUsers = useCallback(
    async selectedRoles => {
      const result = await editUser({
        projectId,
        ids: userIds,
        roles: selectedRoles,
      });
      if (result.error) {
        toastError(buildErrorMessage(result.error));
      } else {
        toastSuccess('The user has been edited successfully');
        onSuccess && onSuccess();
      }
    },
    [editUser, onSuccess, projectId, toastError, toastSuccess, userIds],
  );

  return {
    saveUsers,
    isLoading,
  };
};

export default useEditUser;

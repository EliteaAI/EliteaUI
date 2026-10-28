import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { StoredLoginHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { useUpdateConfigurationMutation } from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

/**
 * Credential-page counterpart of the toolkit bar: a Microsoft login here is also saved on the credential.
 * @param {Object} options
 * @param {Object} options.credential - credential as loaded by the page ({ id, project_id, type, data })
 * @param {string} options.tokenKey - browser token key of this credential ("<uuid>:<authority>")
 */
export const useCredentialPageStoredLogin = ({ credential, tokenKey }) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { toastSuccess, toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const [updateConfiguration] = useUpdateConfigurationMutation();

  const isStoredLoginType = Boolean(StoredLoginHelpers.getStoredLoginConfig(credential?.type));
  const isSaved = Boolean(credential?.id && credential?.project_id);
  const isPrivate = Boolean(personal_project_id) && credential?.project_id === personal_project_id;
  // Everyone runs on a team credential's login, so only admins may log in or out (the server enforces it)
  const canManageLogin = isPrivate || checkPermission(PERMISSIONS.users.edit);
  const enabled = isStoredLoginType && isSaved;
  const hasStoredLogin = enabled && Boolean(credential?.data?.refresh_token);

  const putData = useCallback(
    async refreshToken => {
      // PUT replaces data wholesale, so leaving the key out is what removes a saved login
      const nextData = { ...credential.data };
      delete nextData.refresh_token;
      const body = { data: refreshToken ? { ...nextData, refresh_token: refreshToken } : nextData };
      return updateConfiguration({
        projectId: credential.project_id,
        configId: credential.id,
        body,
      }).unwrap();
    },
    [credential, updateConfiguration],
  );

  const saveLogin = useCallback(async () => {
    if (!enabled) return;
    if (!canManageLogin) {
      toastError(
        'Signed in for this browser only: only project admins can save the login on a team credential.',
      );
      return;
    }
    const refreshToken = McpAuthHelpers.getRefreshToken(tokenKey);
    if (!refreshToken) {
      toastError('Microsoft did not return a refresh token, so scheduled runs cannot use this login.');
      return;
    }
    try {
      await putData(refreshToken);
      toastSuccess('Connected! The login is saved for scheduled runs.');
    } catch (error) {
      toastError(error?.data?.error || 'Could not save the login to the credential.');
    }
  }, [enabled, canManageLogin, tokenKey, putData, toastError, toastSuccess]);

  // Returns false when the saved login could not be removed, so the caller can keep the dialog open
  const removeLogin = useCallback(async () => {
    if (!hasStoredLogin) return true;
    if (!canManageLogin) {
      toastError('Only project admins can log out a team credential.');
      return false;
    }
    try {
      await putData(null);
      return true;
    } catch (error) {
      toastError(error?.data?.error || 'Could not remove the login from the credential.');
      return false;
    }
  }, [hasStoredLogin, canManageLogin, putData, toastError]);

  return useMemo(
    () => ({ enabled, hasStoredLogin, canManageLogin, saveLogin, removeLogin }),
    [enabled, hasStoredLogin, canManageLogin, saveLogin, removeLogin],
  );
};

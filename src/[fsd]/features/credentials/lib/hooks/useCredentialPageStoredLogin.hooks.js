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
      const body = StoredLoginHelpers.buildStoredLoginBody(credential.data, refreshToken);
      return updateConfiguration({
        projectId: credential.project_id,
        configId: credential.id,
        body,
      }).unwrap();
    },
    [credential, updateConfiguration],
  );

  // With unsaved edits the sign-in used the typed client, so the token may belong to another app
  const saveLogin = useCallback(
    async ({ isFormDirty = false } = {}) => {
      if (!enabled || !canManageLogin) return;
      if (isFormDirty) {
        toastError('Save the credential first, then log in again: the login must match the saved settings.');
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
    },
    [enabled, canManageLogin, tokenKey, putData, toastError, toastSuccess],
  );

  // Returns false when the saved login could not be removed, so the caller can keep the dialog open
  const removeLogin = useCallback(async () => {
    if (!hasStoredLogin) return true;
    if (!canManageLogin) return false;
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

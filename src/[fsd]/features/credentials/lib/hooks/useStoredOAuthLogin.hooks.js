import { useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { StoredLoginHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpAuthHelpers, useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useGetConfigurationsByTypeQuery,
  useTestConfigurationConnectionMutation,
  useUpdateConfigurationMutation,
} from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

/**
 * Login bar logic for toolkits whose credential keeps a Microsoft refresh token in the vault, so runs
 * without a browser (schedules) can use it. "Connected" means the credential holds a saved login that
 * the last validation did not reject; with `keepBrowserToken` a live browser token counts too.
 *
 * @param {Object} options
 * @param {string} options.configurationType - credential type, e.g. 'outlook'
 * @param {Object} options.credentialRef - toolkit setting pointing at the credential ({ elitea_title, private })
 * @param {number} options.projectId - page project
 * @param {(credential: Object, errorData: Object) => string} options.getAuthority - login authority, also the token key suffix
 * @param {boolean} [options.keepBrowserToken=false] - leave the browser token in place after saving the login
 * @param {boolean} [options.loginExpired=false] - validation reported the saved login needs authorization
 * @param {Function} [options.onLoginChange] - called after login or logout (re-runs toolkit validation)
 */
export const useStoredOAuthLogin = ({
  configurationType,
  credentialRef,
  projectId,
  getAuthority,
  keepBrowserToken = false,
  loginExpired = false,
  onLoginChange,
}) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { toastSuccess, toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const [isBusy, setIsBusy] = useState(false);
  const tokenKeyRef = useRef('');

  const eliteaTitle = credentialRef?.elitea_title;
  const credProjectId = credentialRef?.private ? personal_project_id : projectId;
  // Everyone runs on a team credential's login, so only admins may log in or out (the server enforces it)
  const canManageLogin = Boolean(credentialRef?.private) || checkPermission(PERMISSIONS.users.edit);

  const { data } = useGetConfigurationsByTypeQuery(
    { projectId: credProjectId, type: configurationType },
    { skip: !eliteaTitle || !credProjectId },
  );
  const credential = useMemo(
    () => data?.items?.find(item => item.elitea_title === eliteaTitle),
    [data, eliteaTitle],
  );

  const browserTokenKey = useMemo(
    () =>
      credential?.data?.oauth_discovery_endpoint
        ? `${credential.uuid}:${credential.data.oauth_discovery_endpoint}`
        : '',
    [credential],
  );
  const { isLoggedIn: hasBrowserToken } = useMcpTokenChange({
    serverUrl: keepBrowserToken ? browserTokenKey : '',
  });
  const hasSavedLogin = Boolean(credential?.data?.refresh_token) && !loginExpired;
  const isConnected = hasSavedLogin || (keepBrowserToken && hasBrowserToken);

  const [testConnection] = useTestConfigurationConnectionMutation();
  const [updateConfiguration] = useUpdateConfigurationMutation();

  const saveRefreshToken = useCallback(
    async refreshToken => {
      const body = StoredLoginHelpers.buildStoredLoginBody(credential.data, refreshToken);
      return updateConfiguration({ projectId: credProjectId, configId: credential.id, body }).unwrap();
    },
    [credential, credProjectId, updateConfiguration],
  );

  const onAuthorized = useCallback(async () => {
    const tokenKey = tokenKeyRef.current;
    try {
      const refreshToken = McpAuthHelpers.getRefreshToken(tokenKey);
      if (!refreshToken) {
        toastError('Microsoft did not return a refresh token, so scheduled runs cannot use this login.');
        return;
      }
      await saveRefreshToken(refreshToken);
      toastSuccess('Connected! The login is saved for scheduled runs.');
      onLoginChange?.();
    } catch (error) {
      toastError(error?.data?.error || 'Could not save the login to the credential.');
    } finally {
      // The vault copy is the one that counts; keepBrowserToken leaves chat and the credential page as they were
      if (!keepBrowserToken) McpAuthHelpers.logout(tokenKey);
    }
  }, [saveRefreshToken, toastError, toastSuccess, onLoginChange, keepBrowserToken]);

  const configOAuth = useConfigOAuthModal({
    onSuccess: onAuthorized,
    // Success is only reported after the credential is saved, by onAuthorized
    showSuccessToast: false,
    // A private credential lives in the personal project: its secret resolves there, not in the team project
    projectId: credProjectId,
    credentials: {
      client_id: credential?.data?.client_id,
      client_secret: credential?.data?.client_secret,
      scopes: credential?.data?.scopes,
    },
  });

  const login = useCallback(async () => {
    if (!credential || isBusy || !canManageLogin) return;
    setIsBusy(true);
    try {
      await testConnection({
        projectId: credProjectId,
        configType: configurationType,
        body: { ...credential.data, configuration_uuid: credential.uuid },
      }).unwrap();
      toastSuccess('The connection is OK!');
    } catch (error) {
      if (error?.status === 401 && error?.data?.requires_authorization) {
        const authority = getAuthority(credential, error.data);
        tokenKeyRef.current = `${credential.uuid}:${authority}`;
        configOAuth.handleConfigAuthRequired(error.data, authority, tokenKeyRef.current);
      } else {
        toastError(error?.data?.message || 'The connection test failed.');
      }
    } finally {
      setIsBusy(false);
    }
  }, [
    credential,
    isBusy,
    canManageLogin,
    testConnection,
    credProjectId,
    configurationType,
    getAuthority,
    configOAuth,
    toastSuccess,
    toastError,
  ]);

  const logout = useCallback(async () => {
    if (!credential || !canManageLogin) return;
    setIsBusy(true);
    try {
      if (credential.data?.refresh_token) await saveRefreshToken(null);
      if (keepBrowserToken && hasBrowserToken) McpAuthHelpers.logout(browserTokenKey);
      toastSuccess('You have successfully logged out!');
      onLoginChange?.();
    } catch (error) {
      toastError(error?.data?.error || 'Could not remove the login from the credential.');
    } finally {
      setIsBusy(false);
    }
  }, [
    credential,
    canManageLogin,
    saveRefreshToken,
    keepBrowserToken,
    hasBrowserToken,
    browserTokenKey,
    toastError,
    toastSuccess,
    onLoginChange,
  ]);

  return {
    hasCredential: Boolean(credential),
    credentialTitle: eliteaTitle,
    isConnected,
    isBusy,
    canManageLogin,
    login,
    logout,
    modalProps: configOAuth.getModalProps(),
  };
};

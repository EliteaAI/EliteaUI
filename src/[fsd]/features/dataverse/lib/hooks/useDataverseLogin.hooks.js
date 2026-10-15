import { useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { McpAuthHelpers, useConfigOAuthModal } from '@/[fsd]/features/mcp';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useGetConfigurationsByTypeQuery,
  useTestConfigurationConnectionMutation,
  useUpdateConfigurationMutation,
} from '@/api/configurations';

const CONFIGURATION_TYPE = 'dataverse';

// "Connected" means the credential holds a refresh token in the vault, not that this browser has a token.
export const useDataverseLogin = ({ credentialRef, projectId }) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { toastSuccess, toastError } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const tokenKeyRef = useRef('');

  const eliteaTitle = credentialRef?.elitea_title;
  const credProjectId = credentialRef?.private ? personal_project_id : projectId;

  const { data } = useGetConfigurationsByTypeQuery(
    { projectId: credProjectId, type: CONFIGURATION_TYPE },
    { skip: !eliteaTitle || !credProjectId },
  );
  const credential = useMemo(
    () => data?.items?.find(item => item.elitea_title === eliteaTitle),
    [data, eliteaTitle],
  );
  const isConnected = Boolean(credential?.data?.refresh_token);

  const [testConnection] = useTestConfigurationConnectionMutation();
  const [updateConfiguration] = useUpdateConfigurationMutation();

  const saveRefreshToken = useCallback(
    async refreshToken => {
      // PUT replaces data wholesale, so leaving the key out is what removes a saved login
      const nextData = { ...credential.data };
      delete nextData.refresh_token;
      const body = { data: refreshToken ? { ...nextData, refresh_token: refreshToken } : nextData };
      return updateConfiguration({ projectId: credProjectId, configId: credential.id, body }).unwrap();
    },
    [credential, credProjectId, updateConfiguration],
  );

  const onAuthorized = useCallback(async () => {
    const tokenKey = tokenKeyRef.current;
    // The vault copy is the one that counts, so the browser copy is dropped on every path
    try {
      const refreshToken = McpAuthHelpers.getRefreshToken(tokenKey);
      if (!refreshToken) {
        toastError('Microsoft did not return a refresh token, so scheduled runs cannot use this login.');
        return;
      }
      await saveRefreshToken(refreshToken);
      toastSuccess('Connected! The login is saved for scheduled runs.');
    } catch {
      toastError('Could not save the login to the credential.');
    } finally {
      McpAuthHelpers.logout(tokenKey);
    }
  }, [saveRefreshToken, toastError, toastSuccess]);

  const configOAuth = useConfigOAuthModal({
    onSuccess: onAuthorized,
    // Success is only reported after the credential is saved, by onAuthorized
    showSuccessToast: false,
    credentials: {
      client_id: credential?.data?.client_id,
      client_secret: credential?.data?.client_secret,
    },
  });

  const login = useCallback(async () => {
    if (!credential || isBusy) return;
    setIsBusy(true);
    try {
      await testConnection({
        projectId: credProjectId,
        configType: CONFIGURATION_TYPE,
        body: { ...credential.data, configuration_uuid: credential.uuid },
      }).unwrap();
      toastSuccess('The connection is OK!');
    } catch (error) {
      if (error?.status === 401 && error?.data?.requires_authorization) {
        const authority = error.data.auth_metadata?.server_url;
        tokenKeyRef.current = `${credential.uuid}:${authority}`;
        configOAuth.handleConfigAuthRequired(error.data, authority, tokenKeyRef.current);
      } else {
        toastError(error?.data?.message || 'The connection test failed.');
      }
    } finally {
      setIsBusy(false);
    }
  }, [credential, isBusy, testConnection, credProjectId, configOAuth, toastSuccess, toastError]);

  const logout = useCallback(async () => {
    if (!credential) return;
    setIsBusy(true);
    try {
      await saveRefreshToken(null);
      toastSuccess('You have successfully logged out!');
    } catch {
      toastError('Could not remove the login from the credential.');
    } finally {
      setIsBusy(false);
    }
  }, [credential, saveRefreshToken, toastError, toastSuccess]);

  return {
    hasCredential: Boolean(credential),
    credentialTitle: eliteaTitle,
    isConnected,
    isBusy,
    login,
    logout,
    modalProps: configOAuth.getModalProps(),
  };
};

import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { useGetConfigurationsByTypeQuery } from '@/api/configurations';
import { useLogoutMcpSavedLoginMutation } from '@/api/mcpOAuth';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { useMcpAuthCheck } from './useMcpAuthCheck.hooks';
import { extractMcpAuthMetadata } from './useMcpAuthModal.hooks';

export const MCP_LOGIN_TYPE = 'mcp_login';
export const NO_REFRESH_TOKEN_ERROR = 'no_refresh_token';

// A saved login only fits the server it was made for
export const isLoginForServer = (credential, serverUrl) =>
  Boolean(credential?.data?.url && serverUrl) &&
  McpAuthHelpers.canonicalizeServerUrl(credential.data.url) ===
    McpAuthHelpers.canonicalizeServerUrl(serverUrl);

export const hasSavedMcpLogin = credential => Boolean(credential?.data?.refresh_token);

// #7643 one admin sign-in for unattended runs; checked with NO browser tokens, so a 401 means "not saved yet"
export const useMcpSavedLogin = ({ values, projectId, onLoginChange }) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { toastSuccess, toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const [authMetadata, setAuthMetadata] = useState(null);
  const loginRef = values?.settings?.mcp_login_configuration;
  const serverUrl = values?.settings?.url;
  // A private login lives in the user's personal project; a team one is shared, so admin-only (server-enforced)
  const credProjectId = loginRef?.private ? personal_project_id : projectId;
  const canManageLogin = Boolean(loginRef?.private) || checkPermission(PERMISSIONS.users.edit);

  const { data, refetch, isLoading } = useGetConfigurationsByTypeQuery(
    // Exact title lookup: a project can hold more mcp_login credentials than one page
    { projectId: credProjectId, type: MCP_LOGIN_TYPE, params: { elitea_title: loginRef?.elitea_title } },
    { skip: !loginRef?.elitea_title || !credProjectId },
  );
  const credential = useMemo(
    () => data?.items?.find(item => item.elitea_title === loginRef?.elitea_title),
    [data, loginRef],
  );
  const matchesServer = isLoginForServer(credential, serverUrl);
  const isConnected = hasSavedMcpLogin(credential) && matchesServer;

  const onAuthRequired = useCallback(message => setAuthMetadata(extractMcpAuthMetadata(message)), []);
  const { runAuthCheck, isRunning } = useMcpAuthCheck({
    toolkitId: values?.id,
    values,
    onMcpAuthRequired: onAuthRequired,
    // Already authorized without a saved login (e.g. headers): nothing to save
    onSuccess: () => toastSuccess('The server answered without a sign-in; no saved login is needed.'),
    withoutBrowserTokens: true,
  });

  const [logoutSavedLogin, { isLoading: isLoggingOut }] = useLogoutMcpSavedLoginMutation();

  const login = useCallback(() => {
    if (!credential || !canManageLogin || !matchesServer) return;
    runAuthCheck();
  }, [credential, canManageLogin, matchesServer, runAuthCheck]);

  const logout = useCallback(async () => {
    if (!credential || !canManageLogin) return;
    try {
      await logoutSavedLogin({ projectId: credProjectId, configurationUuid: credential.uuid }).unwrap();
      if (serverUrl) McpAuthHelpers.logout(serverUrl);
      toastSuccess('The saved login was removed.');
      onLoginChange?.();
    } catch (error) {
      toastError(error?.data?.error_description || 'Could not remove the saved login.');
    }
  }, [
    credential,
    canManageLogin,
    logoutSavedLogin,
    credProjectId,
    serverUrl,
    toastSuccess,
    toastError,
    onLoginChange,
  ]);

  const onSaved = useCallback(() => {
    // The save happens server-side in the token exchange, which no cache tag covers: reload the credential
    refetch();
    toastSuccess('Connected! The login is saved for scheduled and webhook runs.');
    onLoginChange?.();
  }, [refetch, toastSuccess, onLoginChange]);

  const closeModal = useCallback(() => setAuthMetadata(null), []);

  return {
    hasLoginRef: Boolean(loginRef?.elitea_title),
    isLoading,
    credential,
    account: credential?.data?.account,
    matchesServer,
    isConnected,
    isBusy: isRunning || isLoggingOut,
    canManageLogin,
    login,
    logout,
    modalProps: {
      open: Boolean(authMetadata),
      mcpAuthMetadata: authMetadata,
      serverUrl,
      // The exchange and save run where the credential lives (personal project for a private login)
      projectId: credProjectId,
      toolkitId: values?.id,
      toolkitType: McpAuthHelpers.isPrebuildMcpType(values?.type) ? values?.type : undefined,
      // A client the server registered for us (DCR) is not a configured one: each login registers afresh
      formClientId:
        (credential?.data?.used_dcr ? '' : credential?.data?.client_id) || values?.settings?.client_id,
      formScopes: credential?.data?.scopes || values?.settings?.scopes,
      title: 'Save login for unattended runs',
      saveLogin: credential ? { configurationUuid: credential.uuid } : undefined,
      onSaved,
      onClose: closeModal,
      onCancel: closeModal,
    },
  };
};

import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useStoredOAuthLogin } from '@/[fsd]/features/credentials/lib/hooks';
import {
  McpAuthHelpers,
  McpAuthModal,
  McpLogoutModal,
  useConfigOAuthModal,
  useMcpTokenChange,
} from '@/[fsd]/features/mcp';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint/lib/hooks/useResolvedSharepointConfig.hooks';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import OnlineIcon from '@/assets/online-icon.svg?react';

const getAuthority = credential => credential.data?.oauth_discovery_endpoint;

const SharepointOAuthStatus = memo(props => {
  const { onLoginChange, loginExpired } = props;
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const spConfigRef = values?.settings?.sharepoint_configuration;
  const toolkitId = values?.id;
  const { spConfig, oauthEndpoint, oauthTokenKey, connectionTokenKey } = useResolvedSharepointConfig(
    spConfigRef,
    projectId,
  );

  const { isLoggedIn: hasBrowserToken } = useMcpTokenChange({ serverUrl: connectionTokenKey });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Delegated credentials also keep the login on the credential; the browser token stays for chat
  const storedLogin = useStoredOAuthLogin({
    configurationType: 'sharepoint',
    credentialRef: spConfigRef,
    projectId,
    getAuthority,
    keepBrowserToken: true,
    loginExpired,
    onLoginChange,
  });
  const isOAuthLoggedIn = oauthEndpoint ? storedLogin.isConnected : hasBrowserToken;

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: spConfig?.client_id,
      client_secret: spConfig?.client_secret,
      scopes: spConfig?.scopes,
    },
    toolkitId,
  });

  const authModalProps = useMemo(() => configOAuth.getModalProps(), [configOAuth]);

  // For non-delegated toolkits: mark connection as verified on successful check.
  const onNonDelegatedSuccess = useCallback(() => {
    if (connectionTokenKey) {
      McpAuthHelpers.setConnectionVerified(connectionTokenKey);
    }
  }, [connectionTokenKey]);

  const { runCheck, isRunning } = useSharepointCheckConnection({
    projectId,
    spConfig,
    onSuccess: !oauthEndpoint ? onNonDelegatedSuccess : undefined,
  });

  const onLogin = useCallback(() => {
    if (oauthEndpoint) {
      storedLogin.login();
      return;
    }
    runCheck(configOAuth.handleConfigAuthRequired, oauthTokenKey);
  }, [oauthEndpoint, storedLogin, runCheck, configOAuth.handleConfigAuthRequired, oauthTokenKey]);

  const onLogout = useCallback(() => setShowLogoutModal(true), []);

  const onConfirmLogout = useCallback(() => {
    if (oauthEndpoint) {
      storedLogin.logout();
    } else {
      McpAuthHelpers.logout(oauthTokenKey);
      toastSuccess('You have successfully logged out!');
    }
    setShowLogoutModal(false);
  }, [oauthEndpoint, storedLogin, oauthTokenKey, toastSuccess]);

  const onCloseLogoutModal = useCallback(() => setShowLogoutModal(false), []);

  const styles = getStyles(isOAuthLoggedIn);

  // No credential configured at all — nothing to render (checked after all hooks)
  if (!spConfig) return null;
  return (
    <>
      <Box sx={styles.loginStatusContainer(!!oauthEndpoint)}>
        <Box sx={styles.statusContent}>
          <OnlineIcon style={styles.statusIconOnline} />
          <Typography
            variant="bodySmall"
            sx={styles.loginStatusText}
          >
            {isOAuthLoggedIn ? 'Connected!' : 'Not Connected'}
          </Typography>
        </Box>
        <Button.BaseBtn
          onClick={isOAuthLoggedIn ? onLogout : onLogin}
          disabled={isRunning || storedLogin.isBusy}
          variant="secondary"
        >
          {isOAuthLoggedIn ? 'Logout' : isRunning ? 'Logging in...' : 'Login'}
        </Button.BaseBtn>
      </Box>
      <McpAuthModal {...(oauthEndpoint ? storedLogin.modalProps : authModalProps)} />
      <McpLogoutModal
        serverUrl={oauthTokenKey}
        open={showLogoutModal}
        onClose={onCloseLogoutModal}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

/** @type {MuiSx} */
const getStyles = isLoggedIn => ({
  statusIconOnline: {
    width: '.875rem',
    height: '.875rem',
  },
  statusContent: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: isLoggedIn ? palette.icon.success : palette.icon.attention,
  }),
  loginStatusText: ({ palette }) => ({
    color: isLoggedIn
      ? palette.components.oauthStatus.text.loginSuccess
      : palette.components.oauthStatus.text.logout,
  }),
  loginStatusContainer:
    isDelegated =>
    ({ palette }) => ({
      display: isDelegated ? 'flex' : 'none',
      marginTop: '1rem',
      height: '2.75rem',
      width: '100%',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
      padding: '.5rem .5rem .5rem 1rem',
      borderRadius: '2.345rem',
      backgroundColor: isLoggedIn
        ? palette.components.oauthStatus.background.loginSuccess
        : palette.components.oauthStatus.background.logout,
      border: `0.0625rem solid ${isLoggedIn ? palette.components.oauthStatus.border.loginSuccess : palette.components.oauthStatus.border.logout}`,
      justifyContent: 'space-between',
    }),
});

SharepointOAuthStatus.displayName = 'SharepointOAuthStatus';

export default SharepointOAuthStatus;

import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Button, Typography } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp/ui';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint/lib/hooks/useResolvedSharepointConfig.hooks';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';
import OnlineIcon from '@/assets/online-icon.svg?react';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const SharepointOAuthStatus = memo(() => {
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const spConfigRef = values?.settings?.sharepoint_configuration;
  const { spConfig, oauthEndpoint, oauthTokenKey, connectionTokenKey } = useResolvedSharepointConfig(
    spConfigRef,
    projectId,
  );

  const { isLoggedIn: isOAuthLoggedIn } = useMcpTokenChange({ serverUrl: connectionTokenKey });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: spConfig?.client_id,
      client_secret: spConfig?.client_secret,
      scopes: spConfig?.scopes,
    },
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
    runCheck(configOAuth.handleConfigAuthRequired, oauthTokenKey);
  }, [runCheck, configOAuth.handleConfigAuthRequired, oauthTokenKey]);

  const onLogout = useCallback(() => setShowLogoutModal(true), []);

  const onConfirmLogout = useCallback(() => {
    McpAuthHelpers.logout(oauthTokenKey);
    setShowLogoutModal(false);
    toastSuccess('You have successfully logged out!');
  }, [oauthTokenKey, toastSuccess]);

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
        <Button
          onClick={isOAuthLoggedIn ? onLogout : onLogin}
          disabled={isRunning}
          variant="secondary"
        >
          {isOAuthLoggedIn ? 'Logout' : isRunning ? 'Logging in...' : 'Login'}
        </Button>
      </Box>
      <McpAuthModal {...authModalProps} />
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
    color: isLoggedIn ? palette.icon.fill.success : palette.icon.fill.attention,
  }),
  loginStatusText: ({ palette }) => ({
    color: isLoggedIn ? palette.text.mcp.loginSuccess : palette.text.mcp.logout,
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
      backgroundColor: isLoggedIn ? palette.background.mcp.loginSuccess : palette.background.mcp.logout,
      border: `0.0625rem solid ${isLoggedIn ? palette.border.mcp.loginSuccess : palette.border.mcp.logout}`,
      justifyContent: 'space-between',
    }),
});

SharepointOAuthStatus.displayName = 'SharepointOAuthStatus';

export default SharepointOAuthStatus;

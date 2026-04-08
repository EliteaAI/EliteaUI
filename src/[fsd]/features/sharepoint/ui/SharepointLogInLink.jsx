import { memo, useCallback, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp/ui';
import { getSharepointConnectionTokenKey } from '@/[fsd]/features/sharepoint/lib/helpers';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';
import useToast from '@/hooks/useToast';

const SharepointLogInLink = memo(props => {
  const { projectId, spConfig } = props;
  const { toastSuccess } = useToast();

  const oauthEndpoint = spConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = spConfig?.configuration_uuid || spConfig?.id;
  const siteUrl = spConfig?.site_url ?? '';
  const connectionTokenKey = useMemo(
    () => getSharepointConnectionTokenKey({ oauthEndpoint, configUuid, siteUrl }),
    [oauthEndpoint, configUuid, siteUrl],
  );

  const { isLoggedIn } = useMcpTokenChange({ serverUrl: connectionTokenKey });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: spConfig?.client_id,
      client_secret: spConfig?.client_secret,
      scopes: spConfig?.scopes,
    },
  });

  const authModalProps = useMemo(() => configOAuth.getModalProps(), [configOAuth]);

  const onNonDelegatedSuccess = useCallback(() => {
    if (connectionTokenKey) McpAuthHelpers.setConnectionVerified(connectionTokenKey);
  }, [connectionTokenKey]);

  const { runCheck, isRunning } = useSharepointCheckConnection({
    projectId,
    spConfig,
    onSuccess: !oauthEndpoint ? onNonDelegatedSuccess : undefined,
  });

  const onLogin = useCallback(
    e => {
      e.stopPropagation();
      runCheck(configOAuth.handleConfigAuthRequired, connectionTokenKey);
    },
    [runCheck, configOAuth.handleConfigAuthRequired, connectionTokenKey],
  );

  const onLogout = useCallback(e => {
    e.stopPropagation();
    setShowLogoutModal(true);
  }, []);

  const onConfirmLogout = useCallback(() => {
    McpAuthHelpers.logout(connectionTokenKey);
    setShowLogoutModal(false);
    toastSuccess('You have successfully logged out!');
  }, [connectionTokenKey, toastSuccess]);

  const stopPropagation = useCallback(e => e.stopPropagation(), []);

  return (
    <>
      <Typography
        variant="bodySmall"
        onClick={isLoggedIn ? onLogout : onLogin}
        onMouseDown={stopPropagation}
        onMouseEnter={stopPropagation}
        onMouseLeave={stopPropagation}
        disabled={isRunning}
        sx={styles.linkText}
      >
        {isLoggedIn ? 'Log out.' : isRunning ? 'Logging in...' : 'Log in.'}
      </Typography>
      <McpAuthModal {...authModalProps} />
      <McpLogoutModal
        serverUrl={connectionTokenKey}
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

/** @type {MuiSx} */
const styles = {
  linkText: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'primary.main',
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    display: 'inline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
};

SharepointLogInLink.displayName = 'SharepointLogInLink';

export default SharepointLogInLink;

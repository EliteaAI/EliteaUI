import { memo, useCallback, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import {
  McpAuthHelpers,
  McpAuthModal,
  McpLogoutModal,
  useConfigOAuthModal,
  useMcpTokenChange,
} from '@/[fsd]/features/mcp';
import { useOpenApiCheckConnection } from '@/[fsd]/features/openapi/lib/hooks';
import useToast from '@/hooks/useToast';

const OpenApiLogInLink = memo(props => {
  const { projectId, openApiConfig, toolkitId } = props;
  const { toastSuccess } = useToast();

  const oauthEndpoint = openApiConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = openApiConfig?.configuration_uuid || openApiConfig?.id;
  const connectionTokenKey = useMemo(
    () => (configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint),
    [configUuid, oauthEndpoint],
  );

  const { isLoggedIn } = useMcpTokenChange({ serverUrl: connectionTokenKey });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: openApiConfig?.client_id,
      client_secret: openApiConfig?.client_secret,
      scopes: openApiConfig?.scope,
    },
    toolkitId,
  });

  const { runCheck, isRunning } = useOpenApiCheckConnection({
    projectId,
    settings: openApiConfig,
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
      <McpAuthModal {...configOAuth.getModalProps()} />
      <McpLogoutModal
        serverUrl={connectionTokenKey}
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

OpenApiLogInLink.displayName = 'OpenApiLogInLink';

/** @type {MuiSx} */
const openApiLogInLinkStyles = () => ({
  linkText: ({ palette }) => ({
    textDecoration: 'underline',
    cursor: 'pointer',
    color: palette.primary.main,
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    display: 'inline',
    '&:hover': {
      color: 'primary.dark',
    },
  }),
});

const styles = openApiLogInLinkStyles();

export default OpenApiLogInLink;

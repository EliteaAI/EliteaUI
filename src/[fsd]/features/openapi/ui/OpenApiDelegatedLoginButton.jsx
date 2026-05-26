import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import { useOpenApiCheckConnection } from '@/[fsd]/features/openapi/lib/hooks';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';

const OpenApiDelegatedLoginButton = memo(props => {
  const { projectId, openApiConfig, toolName, toolkitId } = props;
  const oauthEndpoint = openApiConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = openApiConfig?.configuration_uuid || openApiConfig?.id;
  const tokenKey = useMemo(
    () => (configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint),
    [configUuid, oauthEndpoint],
  );

  const { isLoggedIn: isOAuthLoggedIn } = useMcpTokenChange({ serverUrl: tokenKey });

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: openApiConfig?.client_id,
      client_secret: openApiConfig?.client_secret,
      scopes: openApiConfig?.scope,
    },
    toolkitId,
  });

  const { runCheck, isRunning } = useOpenApiCheckConnection({ projectId, settings: openApiConfig });

  const onLogin = useCallback(() => {
    runCheck(configOAuth.handleConfigAuthRequired, tokenKey);
  }, [runCheck, configOAuth.handleConfigAuthRequired, tokenKey]);

  const statusTip = isOAuthLoggedIn
    ? `${toolName || 'OpenAPI'} is connected`
    : `${toolName || 'OpenAPI'} is not connected. Log in to use.`;

  return (
    <>
      <Tooltip
        title={statusTip}
        placement="top"
      >
        <Box sx={styles.statusIconBox(isOAuthLoggedIn)}>
          {!isOAuthLoggedIn && (
            <BaseBtn
              variant="tertiary"
              size="small"
              onClick={onLogin}
              disabled={isRunning}
              sx={styles.loginText}
            >
              Log in
            </BaseBtn>
          )}
          {isOAuthLoggedIn ? (
            <OnlineIcon style={styles.statusIcon} />
          ) : (
            <OfflineIcon style={styles.statusIcon} />
          )}
        </Box>
      </Tooltip>
      <McpAuthModal {...configOAuth.getModalProps()} />
    </>
  );
});

OpenApiDelegatedLoginButton.displayName = 'OpenApiDelegatedLoginButton';

/** @type {Object} */
const styles = {
  statusIconBox:
    online =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      marginLeft: '0.25rem',
      color: online ? palette.icon.fill.default : palette.icon.fill.attention,
      gap: '0.5rem',
    }),
  statusIcon: {
    width: '1rem',
    height: '1rem',
  },
  loginText: {
    color: 'primary.main',
    '&:hover': {
      color: 'primary.dark',
    },
  },
};

export default OpenApiDelegatedLoginButton;

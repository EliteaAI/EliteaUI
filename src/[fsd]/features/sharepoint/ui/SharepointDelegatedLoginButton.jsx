import { memo, useCallback, useMemo } from 'react';

import { Box, Button, Tooltip } from '@mui/material';

import { useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';

const SharepointDelegatedLoginButton = memo(props => {
  const { projectId, spConfig, toolName } = props;
  const oauthEndpoint = spConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = spConfig?.configuration_uuid || spConfig?.id;
  const oauthTokenKey = useMemo(
    () => (configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint),
    [configUuid, oauthEndpoint],
  );

  const { isLoggedIn: isOAuthLoggedIn } = useMcpTokenChange({ serverUrl: oauthTokenKey });

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: spConfig?.client_id,
      client_secret: spConfig?.client_secret,
      scopes: spConfig?.scopes,
    },
  });

  const { runCheck, isRunning } = useSharepointCheckConnection({ projectId, spConfig });

  const onLogin = useCallback(() => {
    runCheck(configOAuth.handleConfigAuthRequired, oauthTokenKey);
  }, [runCheck, configOAuth.handleConfigAuthRequired, oauthTokenKey]);

  const statusTip = isOAuthLoggedIn
    ? `${toolName || 'SharePoint'} is connected`
    : `${toolName || 'SharePoint'} is not connected. Log in to use.`;

  return (
    <>
      <Tooltip
        title={statusTip}
        placement="top"
      >
        <Box sx={styles.statusIconBox(isOAuthLoggedIn)}>
          {!isOAuthLoggedIn && (
            <Button
              variant="elitea"
              color="tertiary"
              size="small"
              onClick={onLogin}
              disabled={isRunning}
              sx={styles.loginText}
            >
              Log in
            </Button>
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

SharepointDelegatedLoginButton.displayName = 'SharepointDelegatedLoginButton';

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

export default SharepointDelegatedLoginButton;

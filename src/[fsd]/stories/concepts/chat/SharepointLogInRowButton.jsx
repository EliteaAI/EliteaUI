// Chat concept: the row's «Log in» of a SharePoint toolkit; the same sign-in as the «Log in» part of
// src/[fsd]/features/sharepoint/ui/SharepointLogInLink.jsx
import { memo, useCallback, useMemo } from 'react';

import { McpAuthHelpers, McpAuthModal, useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp';
import { getSharepointConnectionTokenKey } from '@/[fsd]/features/sharepoint/lib/helpers';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';

import LogInButton from './LogInButton';

const SharepointLogInRowButton = memo(props => {
  const { projectId, spConfig, toolkitId, disabled } = props;
  const oauthEndpoint = spConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = spConfig?.configuration_uuid || spConfig?.id;
  const siteUrl = spConfig?.site_url ?? '';
  const connectionTokenKey = useMemo(
    () => getSharepointConnectionTokenKey({ oauthEndpoint, configUuid, siteUrl }),
    [oauthEndpoint, configUuid, siteUrl],
  );
  const { isLoggedIn } = useMcpTokenChange({ serverUrl: connectionTokenKey });

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: spConfig?.client_id,
      client_secret: spConfig?.client_secret,
      scopes: spConfig?.scopes,
      oauth_app_id: spConfig?.oauth_app_id,
      credential_type: 'sharepoint',
    },
    toolkitId,
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

  if (isLoggedIn) return null;
  return (
    <>
      <LogInButton
        onClick={onLogin}
        isRunning={isRunning}
        disabled={disabled}
      />
      <McpAuthModal {...authModalProps} />
    </>
  );
});

SharepointLogInRowButton.displayName = 'SharepointLogInRowButton';

export default SharepointLogInRowButton;

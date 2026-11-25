// Chat concept: the row's «Log in» of an OpenAPI toolkit; the same sign-in as the «Log in» part of
// src/[fsd]/features/openapi/ui/OpenApiLogInLink.jsx
import { memo, useCallback, useMemo } from 'react';

import { McpAuthModal, useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp';
import { useOpenApiCheckConnection } from '@/[fsd]/features/openapi/lib/hooks';

import LogInButton from './LogInButton';

const OpenApiLogInRowButton = memo(props => {
  const { projectId, openApiConfig, toolkitId, disabled } = props;
  const oauthEndpoint = openApiConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = openApiConfig?.configuration_uuid || openApiConfig?.id;
  const connectionTokenKey = useMemo(
    () => (configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint),
    [configUuid, oauthEndpoint],
  );
  const { isLoggedIn } = useMcpTokenChange({ serverUrl: connectionTokenKey });

  const configOAuth = useConfigOAuthModal({
    credentials: {
      client_id: openApiConfig?.client_id,
      client_secret: openApiConfig?.client_secret,
      scopes: openApiConfig?.scope,
    },
    toolkitId,
  });
  const { runCheck, isRunning } = useOpenApiCheckConnection({ projectId, settings: openApiConfig });

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
      <McpAuthModal {...configOAuth.getModalProps()} />
    </>
  );
});

OpenApiLogInRowButton.displayName = 'OpenApiLogInRowButton';

export default OpenApiLogInRowButton;

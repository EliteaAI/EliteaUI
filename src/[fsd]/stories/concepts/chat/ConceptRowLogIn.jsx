// Piece 3 of the chat concept: «Log in» as a button on a row of the «who answers» list, in the place and look of «Fix»
// (owner 2026-11-24: every row with a problem has its action in one place, on the right). On dev the same sign-in is a
// link «Log in.» in the row's warning line; each button below copies the «Log in» part of that link and starts the same
// sign-in:
// - MCP: src/[fsd]/features/mcp/ui/McpLogInLink.jsx;
// - SharePoint: src/[fsd]/features/sharepoint/ui/SharepointLogInLink.jsx;
// - OpenAPI: src/[fsd]/features/openapi/ui/OpenApiLogInLink.jsx.
// The links' «Log out.» is left out: a row shows its warning only while the user is logged out.
import { memo, useCallback, useMemo } from 'react';

import {
  McpAuthHelpers,
  McpAuthModal,
  useConfigOAuthModal,
  useMcpLogin,
  useMcpTokenChange,
} from '@/[fsd]/features/mcp';
import { useOpenApiCheckConnection } from '@/[fsd]/features/openapi/lib/hooks';
import { getSharepointConnectionTokenKey } from '@/[fsd]/features/sharepoint/lib/helpers';
import { useSharepointCheckConnection } from '@/[fsd]/features/sharepoint/lib/hooks/useSharepointCheckConnection.hooks';
import { Button } from '@/[fsd]/shared/ui';

// Which sign-in a row asks for — exactly when the team's warning line would end with its «Log in.» link, so the same
// order of checks as ParticipantWarning: a row never has both «Fix» and «Log in». Read by ParticipantWarning.swap.
export const logInOnRow = status => {
  const before =
    status.isSkippedContainer ||
    status.isPublishedAgentGone ||
    status.isVersionUnavailable ||
    status.isSkillGone ||
    status.isSkillVersionUnavailable ||
    status.hasMisconfigurationErrors ||
    status.shouldDisableThisItem ||
    status.mcpIsDisconnected ||
    status.blockedToolkitNames?.length ||
    status.someToolsAreUnavailable;
  if (before) return null;
  if (status.remoteMcpLoggedOut) return 'mcp';
  if (status.spOAuthLoggedOut) return 'sharepoint';
  if (status.openApiOAuthLoggedOut) return 'openapi';
  return null;
};

// The warning line of such a row: dev's text without the link
export const LOG_IN_TEXT = {
  mcp: 'Server is disconnected! Reconnect it to use.',
  sharepoint: 'SharePoint requires authorization.',
  openapi: 'OpenAPI requires authorization.',
};

const LogInButton = ({ onClick, isRunning, disabled }) => (
  <Button.BaseBtn
    variant="elitea"
    color="secondary"
    onClick={onClick}
    disabled={disabled || isRunning}
    data-testid="who-answers-log-in"
  >
    {isRunning ? 'Logging in...' : 'Log in'}
  </Button.BaseBtn>
);

const McpLogInRowButton = memo(({ values, disabled }) => {
  const { isLoggedIn, isRunning, onLogin, modalProps } = useMcpLogin({ values });
  if (isLoggedIn) return null;
  return (
    <>
      <LogInButton
        onClick={onLogin}
        isRunning={isRunning}
        disabled={disabled}
      />
      <McpAuthModal {...modalProps} />
    </>
  );
});

McpLogInRowButton.displayName = 'McpLogInRowButton';

const SharepointLogInRowButton = memo(({ projectId, spConfig, toolkitId, disabled }) => {
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

const OpenApiLogInRowButton = memo(({ projectId, openApiConfig, toolkitId, disabled }) => {
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

// The row's «Log in» for the sign-in logInOnRow named
const ConceptRowLogIn = memo(({ kind, participant, status, details, disabled }) => {
  const projectId = participant.entity_meta?.project_id;
  const toolkitId = participant.entity_meta?.id;
  if (kind === 'mcp')
    return (
      <McpLogInRowButton
        values={details}
        disabled={disabled}
      />
    );
  if (kind === 'sharepoint')
    return (
      <SharepointLogInRowButton
        projectId={projectId}
        spConfig={status.spConfig}
        toolkitId={toolkitId}
        disabled={disabled}
      />
    );
  if (kind === 'openapi')
    return (
      <OpenApiLogInRowButton
        projectId={projectId}
        openApiConfig={status.openApiConfig}
        toolkitId={toolkitId}
        disabled={disabled}
      />
    );
  return null;
});

ConceptRowLogIn.displayName = 'ConceptRowLogIn';

export default ConceptRowLogIn;

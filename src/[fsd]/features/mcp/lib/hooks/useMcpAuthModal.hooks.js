import { useCallback, useMemo, useState } from 'react';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Extract MCP auth metadata from various sources.
 * Supports:
 * - message.response_metadata.resource_metadata (from streaming responses)
 * - authRequiredAction.toolMeta.resource_metadata (from toolActions)
 * @param {Object} source - Message object or authRequiredAction object
 */
export const extractMcpAuthMetadata = source => {
  // Support both message.response_metadata and authRequiredAction.toolMeta paths
  const responseMetadata = source?.response_metadata || {};
  const toolMeta = source?.toolMeta || {};
  const toolOutputs = source?.toolOutputs || {};

  const resourceMetadata = responseMetadata?.resource_metadata || toolMeta?.resource_metadata || {};
  const oauthServer = resourceMetadata?.oauth_authorization_server;

  // Extract provided_settings from backend (client_id, client_secret, scopes for pre-built MCPs)
  // provided_settings is directly under response_metadata, not under resource_metadata
  const providedSettings = responseMetadata?.provided_settings || resourceMetadata?.provided_settings || {};

  return {
    authServers:
      resourceMetadata?.authorization_servers ||
      responseMetadata?.authorization_servers ||
      toolOutputs?.authorization_servers,
    oauthAuthorizationServer: oauthServer,
    oauthMetadata: oauthServer
      ? {
          token_endpoint: oauthServer.token_endpoint,
          authorization_endpoint: oauthServer.authorization_endpoint,
          revocation_endpoint: oauthServer.revocation_endpoint,
          registration_endpoint: oauthServer.registration_endpoint,
          issuer: oauthServer.issuer,
          grant_types_supported: oauthServer.grant_types_supported,
          code_challenge_methods_supported: oauthServer.code_challenge_methods_supported,
        }
      : null,
    // Include provided settings from backend for pre-built MCPs
    providedSettings,
    // Resource-level scopes (from resource_metadata.scopes_supported).
    // These are the scopes the MCP resource itself requires (e.g. "ea9ffc3e-.../.default").
    // They must be included in the authorization request so the issued token has the correct audience.
    resourceScopes: resourceMetadata?.scopes_supported,
    // Configuration UUID for credential-scoped token storage key isolation.
    // When present, tokens should be stored under "{configUuid}:{oauth_endpoint}" so that
    // two credentials sharing the same Azure AD tenant stay isolated.
    configurationUuid: resourceMetadata?.configuration_uuid,
  };
};

/**
 * Extract auth metadata from configuration check_connection 401 response.
 * Maps BE auth_metadata (server_url, resource_metadata_url, resource_metadata) to the same
 * shape McpAuthModal expects (authServers, oauthAuthorizationServer, oauthMetadata).
 * @param {Object} authMetadata - auth_metadata from check_connection 401 response
 * @returns {Object} Same shape as extractMcpAuthMetadata for use with McpAuthModal
 */
export const extractConfigAuthMetadata = authMetadata => {
  if (!authMetadata) return null;
  const resourceMetadata = authMetadata?.resource_metadata || {};
  const oauthServer = resourceMetadata?.oauth_authorization_server;
  return {
    authServers: resourceMetadata?.authorization_servers || authMetadata?.authorization_servers || [],
    oauthAuthorizationServer: oauthServer,
    oauthMetadata: oauthServer
      ? {
          token_endpoint: oauthServer.token_endpoint,
          authorization_endpoint: oauthServer.authorization_endpoint,
          revocation_endpoint: oauthServer.revocation_endpoint,
          registration_endpoint: oauthServer.registration_endpoint,
          issuer: oauthServer.issuer,
          grant_types_supported: oauthServer.grant_types_supported,
          code_challenge_methods_supported: oauthServer.code_challenge_methods_supported,
        }
      : null,
    providedSettings: resourceMetadata?.provided_settings || {},
    resourceScopes: resourceMetadata?.scopes_supported,
  };
};

export const useMcpAuthModal = (options = {}) => {
  const { onSuccess, showSuccessToast = true, values } = options;
  const {
    id: toolkitId,
    type: toolkitType,
    settings: { url, client_id, client_secret, scopes } = {},
  } = values ?? {
    settings: {},
  };
  const projectId = useSelectedProjectId();

  const { toastSuccess } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [mcpAuthMetadata, setMcpAuthMetadata] = useState(null);
  // server_url extracted from the incoming McpAuthorizationRequired message.
  // Used as serverUrl fallback for toolkits (e.g. SharePoint) that have no settings.url.
  const [runtimeServerUrl, setRuntimeServerUrl] = useState('');
  // For SharePoint: token must be stored under oauth_discovery_endpoint (authServers[0])
  // so get_toolkit() can find it. Undefined for other toolkits (they use serverUrl as key).
  const [runtimeTokenStorageKey, setRuntimeTokenStorageKey] = useState('');

  // Check if this is a pre-built MCP type (e.g., mcp_github)
  const isPrebuildMcp = useMemo(() => McpAuthHelpers.isPrebuildMcpType(toolkitType), [toolkitType]);

  /**
   * Handler for when MCP auth is required.
   * Pass this to useMcpAuthCheck or useToolkitChat's onMcpAuthRequired callback.
   */
  const handleMcpAuthRequired = useCallback(message => {
    const metadata = extractMcpAuthMetadata(message);
    setMcpAuthMetadata(metadata);
    const serverUrl = message?.response_metadata?.server_url || '';
    setRuntimeServerUrl(serverUrl);
    // Determine the correct token storage key so the backend can find it.
    // Priority:
    // 1. Composite "{configUuid}:{oauthEndpoint}" when configuration_uuid is present
    //    (e.g. SharePoint with credential-scoped isolation).
    // 2. Plain oauthEndpoint when it differs from server_url
    //    (e.g. SharePoint without configUuid: site_url ≠ azure AD endpoint).
    // 3. Empty string — falls back to serverUrl (regular MCP where server_url = oauth endpoint).
    const configUuid = metadata?.configurationUuid;
    const oauthEndpoint = metadata?.authServers?.[0];
    if (configUuid && oauthEndpoint) {
      setRuntimeTokenStorageKey(`${configUuid}:${oauthEndpoint}`);
    } else if (oauthEndpoint && oauthEndpoint !== serverUrl) {
      setRuntimeTokenStorageKey(oauthEndpoint);
    }
    setShowModal(true);
  }, []);

  /**
   * Handler for when the modal closes (either success or cancel).
   * @param {boolean} success - Whether the login was successful
   */
  const handleCloseModal = useCallback(
    success => {
      setShowModal(false);
      setMcpAuthMetadata(null);
      setRuntimeServerUrl('');
      setRuntimeTokenStorageKey('');

      if (success) {
        if (showSuccessToast) {
          toastSuccess('Successful authentication!');
        }
        onSuccess?.();
      }
    },
    [showSuccessToast, toastSuccess, onSuccess],
  );

  /**
   * Handler for when the modal is cancelled (without completing login).
   */
  const handleCancelModal = useCallback(() => {
    setShowModal(false);
    setMcpAuthMetadata(null);
    setRuntimeServerUrl('');
    setRuntimeTokenStorageKey('');
  }, []);

  /**
   * Manually open the modal with specific metadata.
   * Useful when auth data comes from a different source (e.g., toolActions).
   */
  const openModal = useCallback(metadata => {
    setMcpAuthMetadata(metadata);
    setShowModal(true);
  }, []);

  /**
   * Get props to spread on McpAuthModal.
   * @returns {Object} Props for McpAuthModal
   */
  const getModalProps = useCallback(
    () => ({
      open: showModal && mcpAuthMetadata !== null,
      // runtimeServerUrl is extracted from the McpAuthorizationRequired socket message.
      // It provides the server URL for toolkits that have no settings.url (e.g. SharePoint).
      serverUrl: url || runtimeServerUrl,
      // runtimeTokenStorageKey overrides the default serverUrl-based key for toolkits
      // (e.g. SharePoint) where the backend stores/retrieves tokens under a different URL.
      tokenStorageKey: runtimeTokenStorageKey || undefined,
      mcpAuthMetadata,
      formClientId: client_id,
      formClientSecret: client_secret,
      formScopes: scopes,
      projectId,
      toolkitId,
      // Pass toolkitType for pre-built MCPs so tokens are stored under toolkitType key
      toolkitType: isPrebuildMcp ? toolkitType : undefined,
      onClose: handleCloseModal,
      onCancel: handleCancelModal,
    }),
    [
      showModal,
      mcpAuthMetadata,
      url,
      runtimeServerUrl,
      runtimeTokenStorageKey,
      client_id,
      client_secret,
      scopes,
      projectId,
      toolkitId,
      toolkitType,
      isPrebuildMcp,
      handleCloseModal,
      handleCancelModal,
    ],
  );

  return {
    // State
    showModal,
    mcpAuthMetadata,

    // Handlers
    handleMcpAuthRequired,
    handleCloseModal,
    handleCancelModal,
    openModal,

    // Helper
    getModalProps,
  };
};

/**
 * Hook for config/credentials OAuth modal when check_connection returns requires_authorization.
 * Holds state and exposes handleConfigAuthRequired(errorData, serverUrlOverride) and getModalProps()
 * for use with McpAuthModal. Tokens are stored per serverUrl (oauth_discovery_endpoint IS the serverUrl).
 * @param {Object} options
 * @param {Function} [options.onSuccess] - Called when user completes OAuth (e.g. to retry test connection)
 * @param {Object} [options.credentials] - Pre-fill values for the auth modal inputs
 * @param {string} [options.credentials.client_id] - OAuth client ID from credential settings
 * @param {string} [options.credentials.client_secret] - OAuth client secret from credential settings
 * @param {string|string[]} [options.credentials.scopes] - OAuth scopes from credential settings
 */
export const useConfigOAuthModal = (options = {}) => {
  const { onSuccess, credentials } = options;
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [mcpAuthMetadata, setMcpAuthMetadata] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  // Credential-scoped token storage key (e.g. "<uuid>:<oauth_discovery_endpoint>").
  // Kept separate from serverUrl so the modal can display a human-readable URL
  // while still storing/looking up the token under the per-credential key.
  const [tokenStorageKey, setTokenStorageKey] = useState('');

  const handleConfigAuthRequired = useCallback((errorData, serverUrlOverride, tokenStorageKeyOverride) => {
    const authMetadata = errorData?.auth_metadata;
    if (!authMetadata) return;
    const metadata = extractConfigAuthMetadata(authMetadata);
    if (!metadata) return;
    setMcpAuthMetadata(metadata);
    setServerUrl(serverUrlOverride ?? authMetadata?.server_url ?? '');
    // If a credential-scoped storage key is provided use it, otherwise fall back
    // to the display URL so legacy callers continue to work unchanged.
    setTokenStorageKey(tokenStorageKeyOverride ?? serverUrlOverride ?? authMetadata?.server_url ?? '');
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(
    success => {
      setShowModal(false);
      setMcpAuthMetadata(null);
      setServerUrl('');
      setTokenStorageKey('');
      if (success) {
        toastSuccess('Successful authentication!');
        onSuccess?.();
      }
    },
    [toastSuccess, onSuccess],
  );

  const handleCancelModal = useCallback(() => {
    setShowModal(false);
    setMcpAuthMetadata(null);
    setServerUrl('');
    setTokenStorageKey('');
  }, []);

  const getModalProps = useCallback(
    () => ({
      open: showModal && mcpAuthMetadata !== null,
      serverUrl,
      tokenStorageKey,
      mcpAuthMetadata,
      formClientId: credentials?.client_id || '',
      formClientSecret: credentials?.client_secret || '',
      formScopes: credentials?.scopes,
      projectId,
      toolkitId: undefined,
      toolkitType: undefined,
      title: 'Configuration OAuth',
      onClose: handleCloseModal,
      onCancel: handleCancelModal,
    }),
    [
      showModal,
      mcpAuthMetadata,
      serverUrl,
      tokenStorageKey,
      credentials?.client_id,
      credentials?.client_secret,
      credentials?.scopes,
      projectId,
      handleCloseModal,
      handleCancelModal,
    ],
  );

  return {
    showModal,
    handleConfigAuthRequired,
    getModalProps,
    handleCloseModal,
    handleCancelModal,
  };
};

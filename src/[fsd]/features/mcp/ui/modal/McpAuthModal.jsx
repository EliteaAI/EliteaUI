import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from '@mui/material';

import { McpAuthFlowHelpers, McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import CloseIcon from '@/components/Icons/CloseIcon';

import OAuthFormFields from './OAuthFormFields';

const convertScopes = scopes => {
  if (Array.isArray(scopes)) return scopes.join(' ').trim();
  if (typeof scopes === 'string') return scopes;
  // Prevent objects or other non-string values from rendering as [object Object]
  return '';
};

const McpAuthModal = memo(props => {
  const {
    serverUrl,
    // Credential-scoped token storage key ("<uuid>:<oauth_discovery_endpoint>").
    // When provided, token storage/lookup uses this key instead of serverUrl so
    // two credentials sharing the same oauth_discovery_endpoint stay isolated.
    // Falls back to serverUrl when absent (remote MCPs, pre-built MCP flows).
    tokenStorageKey,
    mcpAuthMetadata,
    formClientId = '',
    formClientSecret = '',
    formScopes,
    projectId,
    toolkitId,
    toolkitType, // Pre-built MCP type (e.g., 'mcp_github') - used as storage key
    title, // Optional modal title override (e.g. 'Configuration OAuth')
    open,
    onClose,
    onCancel,
  } = props;

  // The key used for token storage: prefer credential-scoped key when available.
  const storageKey = tokenStorageKey || serverUrl;

  // Derive values from mcpAuthMetadata
  const authServers = mcpAuthMetadata?.authServers;
  const oauthAuthorizationServer = mcpAuthMetadata?.oauthAuthorizationServer;
  const oauthMetadata = mcpAuthMetadata?.oauthMetadata;
  const providedSettings = mcpAuthMetadata?.providedSettings;
  const resourceScopes = mcpAuthMetadata?.resourceScopes;

  // Use provided settings from backend if available, otherwise use form values
  const client_id = providedSettings?.mcp_client_id || formClientId;
  const client_secret = providedSettings?.mcp_client_secret || formClientSecret;
  const scopes = providedSettings?.scopes || formScopes;

  // Flags to indicate if credentials are provided by backend (don't show inputs)
  const hasBackendClientId = Boolean(providedSettings?.mcp_client_id);
  const hasBackendClientSecret = Boolean(providedSettings?.mcp_client_secret);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scope, setScope] = useState(convertScopes(scopes) || convertScopes(resourceScopes));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const authWindowRef = useRef(null);

  // Check if this is a pre-built MCP
  const isPrebuildMcp = useMemo(() => McpAuthHelpers.isPrebuildMcpType(toolkitType), [toolkitType]);

  // Load saved credentials when modal opens
  useEffect(() => {
    if (open && (storageKey || isPrebuildMcp)) {
      const savedCreds = McpAuthHelpers.getSavedCredentials(storageKey, toolkitType);
      if (savedCreds) {
        setClientId(savedCreds.client_id || '');
        setClientSecret(savedCreds.client_secret || '');
        setSaveCredentials(true);
      } else {
        setClientId('');
        setClientSecret('');
        setSaveCredentials(false);
      }
      setScope(convertScopes(scopes) || convertScopes(resourceScopes));
      setAuthError('');
      setAuthSuccess(false);
    }
  }, [open, storageKey, isPrebuildMcp, toolkitType, scopes, resourceScopes]);

  const availableScopes = useMemo(() => {
    // Prefer resource-level scopes — these are what the MCP resource actually requires.
    // Fall back to auth server scopes, then to form-provided scopes.
    if (resourceScopes?.length > 0) return resourceScopes;
    if (oauthAuthorizationServer?.scopes_supported?.length > 0) {
      return oauthAuthorizationServer.scopes_supported;
    }
    return Array.isArray(scopes) ? scopes : [];
  }, [resourceScopes, oauthAuthorizationServer, scopes]);

  const styles = useMemo(() => {
    const modalStyles = getModalStyles();
    return {
      ...modalStyles,
      description: {
        marginBottom: '1rem',
      },
    };
  }, []);

  // Compute metadata information from provided metadata (from mcp_authorization_required)
  const serverMetadata = useMemo(() => {
    const metadata = oauthAuthorizationServer || {};

    // OIDC detection for user login flows:
    // Must have userinfo_endpoint - this indicates the server supports fetching user info
    // which is the key differentiator for OIDC user authentication flows.
    // Note: GitHub has issuer and id_token in response_types, but that's for GitHub Actions OIDC
    // (machine-to-machine workload identity), NOT for user OAuth login.
    // Without userinfo_endpoint, we treat it as standard OAuth, requiring client_secret.
    const isActuallyOIDC = Boolean(metadata.userinfo_endpoint);

    // Check token endpoint auth methods
    // If server only supports client_secret_basic or client_secret_post (not "none"),
    // then DCR won't help because we'd still need a pre-registered client with a secret
    // HOWEVER: If the server supports PKCE (S256), it implicitly supports public clients
    // per OAuth 2.0 best practices, even if it doesn't explicitly advertise "none"
    const authMethods = metadata.token_endpoint_auth_methods_supported || [];
    const supportsPKCE = metadata.code_challenge_methods_supported?.includes('S256') ?? false;
    const supportsPublicClients = authMethods.length === 0 || authMethods.includes('none') || supportsPKCE; // PKCE support implies public client support
    const requiresClientSecret = authMethods.length > 0 && !authMethods.includes('none') && !supportsPKCE;

    // DCR is useful if the server supports public clients (via "none" or PKCE)
    // With PKCE + DCR, we can auto-register and use PKCE without needing pre-registered credentials
    const hasDCREndpoint = Boolean(metadata.registration_endpoint);
    const canUseDCR = hasDCREndpoint && supportsPublicClients;

    return {
      issuer: metadata.issuer,
      supportsPKCE: metadata.code_challenge_methods_supported?.includes('S256') ?? false,
      supportsDCR: canUseDCR,
      hasDCREndpoint, // Server has DCR but may require secret
      requiresClientSecret, // Server requires client_secret for token endpoint
      supportsRefreshToken: metadata.grant_types_supported?.includes('refresh_token') ?? false,
      authEndpoint: metadata.authorization_endpoint,
      tokenEndpoint: metadata.token_endpoint,
      isOIDC: isActuallyOIDC,
      grantTypes: metadata.grant_types_supported || ['authorization_code'],
      responseTypes: metadata.response_types_supported || ['code'],
      tokenAuthMethods: authMethods,
    };
  }, [oauthAuthorizationServer]);

  // Determine authentication flow based on server capabilities (priority order)
  const authFlow = useMemo(() => {
    // DCR has highest priority - but only if server supports public clients
    if (serverMetadata.supportsDCR) return 'dcr';
    if (serverMetadata.isOIDC) return 'oidc';
    if (serverMetadata.supportsPKCE) return 'pkce';
    return 'standard';
  }, [serverMetadata.supportsDCR, serverMetadata.isOIDC, serverMetadata.supportsPKCE]);

  // Determine if we need to show client_id input
  // Don't show if: DCR flow, or backend already provides it
  const needClientId = useMemo(() => {
    // If backend provides client_id, don't show input
    if (hasBackendClientId) return false;
    if (authFlow === 'dcr') return false;
    return !client_id?.trim();
  }, [authFlow, client_id, hasBackendClientId]);

  // Determine if we need to show client_secret input
  // Don't show if: backend already provides it, or flow doesn't require it
  const needsClientSecret = useMemo(() => {
    // If backend provides client_secret, don't show input
    if (hasBackendClientSecret) return false;
    // If server explicitly requires client_secret (only supports client_secret_basic/post)
    // then we always need it, regardless of flow
    if (serverMetadata.requiresClientSecret) {
      return !client_secret?.trim();
    }
    // DCR and OIDC flows don't need client secret
    if (authFlow === 'oidc' || authFlow === 'dcr') return false;
    // PKCE flow can work without client secret (public client)
    // But only if the server actually supports PKCE
    if (authFlow === 'pkce' && serverMetadata.supportsPKCE) return false;
    // Standard flow or fallback: need client secret if not already provided
    return !client_secret?.trim();
  }, [
    authFlow,
    client_secret,
    hasBackendClientSecret,
    serverMetadata.supportsPKCE,
    serverMetadata.requiresClientSecret,
  ]);
  // No frontend discovery - metadata must come from mcp_authorization_required message

  const isAuthorizeDisabled = useMemo(() => {
    if (authLoading || authSuccess) return true;

    // For pre-built MCPs, storageKey may not be required (backend manages it)
    if (!storageKey && !isPrebuildMcp) return true;

    // Metadata must be provided by backend
    const hasMetadata = oauthAuthorizationServer || (authServers && authServers.length > 0);
    if (!hasMetadata) return true;

    // Check if required credentials are provided
    if (needClientId && !clientId?.trim()) return true;
    return !!(needsClientSecret && !clientSecret?.trim());
  }, [
    authLoading,
    authSuccess,
    storageKey,
    isPrebuildMcp,
    needClientId,
    needsClientSecret,
    clientId,
    clientSecret,
    oauthAuthorizationServer,
    authServers,
  ]);

  const handleCancel = useCallback(() => {
    // Close auth popup window if it's still open
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
    }
    authWindowRef.current = null;
    setAuthLoading(false);
    setAuthError('');
    setAuthSuccess(false);
    onCancel?.();
  }, [onCancel]);

  const onAuthorize = useCallback(async () => {
    // For pre-built MCPs, serverUrl may not be available (managed by backend)
    if (!storageKey && !isPrebuildMcp) return;

    // Open popup immediately to prevent browser blocking
    const authWindow = window.open('about:blank', '_blank', 'width=500,height=700');
    if (!authWindow) {
      setAuthError('Popup blocked. Please allow popups for this site and try again.');
      return;
    }
    // Store reference so we can close it if user cancels
    authWindowRef.current = authWindow;

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess(false);
    try {
      // Use metadata from mcp_authorization_required message (no frontend discovery)
      if (!authServers || !authServers.length) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('No authorization servers available');
      }

      await McpAuthFlowHelpers.startMcpAuthFlow({
        serverUrl: storageKey,
        resourceMetadata: {
          authorization_servers: authServers,
          oauth_authorization_server: oauthAuthorizationServer,
        },
        // Pass OAuth metadata for storage (from mcp_authorization_required message)
        oauthMetadata: oauthMetadata || {
          token_endpoint: oauthAuthorizationServer?.token_endpoint,
          grant_types_supported: oauthAuthorizationServer?.grant_types_supported,
        },
        // Use props if provided, otherwise use user input from state
        clientId: client_id?.trim() || clientId,
        clientSecret: client_secret?.trim() || clientSecret,
        scope,
        authWindow, // Pass the pre-opened window
        projectId,
        toolkitId,
        // Pass toolkitType for pre-built MCPs so tokens are stored under toolkitType key
        toolkitType: isPrebuildMcp ? toolkitType : undefined,
      });

      // Save credentials if checkbox is checked and user provided them
      const finalClientId = client_id?.trim() || clientId;
      const finalClientSecret = client_secret?.trim() || clientSecret;
      if (saveCredentials && (finalClientId || finalClientSecret)) {
        McpAuthHelpers.setSavedCredentials({
          serverUrl: storageKey,
          clientId: finalClientId,
          clientSecret: finalClientSecret,
          toolkitType,
        });
      } else if (!saveCredentials) {
        // Remove saved credentials if checkbox is unchecked
        McpAuthHelpers.removeSavedCredentials(storageKey, toolkitType);
      }

      authWindowRef.current = null;
      setAuthSuccess(true);
      let timer = setTimeout(() => {
        timer = -1;
        onClose?.(true);
      }, 1500);
      return () => {
        if (timer !== -1) {
          clearTimeout(timer);
        }
      };
    } catch (error) {
      setAuthError(error.message || 'Authorization failed');
      // Close the popup if it's still open
      if (authWindowRef.current && !authWindowRef.current.closed) {
        // authWindowRef.current.close();
      }
      authWindowRef.current = null;
    } finally {
      setAuthLoading(false);
    }
  }, [
    storageKey,
    authServers,
    oauthAuthorizationServer,
    oauthMetadata,
    client_id,
    client_secret,
    clientId,
    clientSecret,
    scope,
    onClose,
    projectId,
    toolkitId,
    toolkitType,
    isPrebuildMcp,
    saveCredentials,
  ]);

  const onClientIdChange = useCallback(e => {
    setClientId(e.target.value);
  }, []);

  const onClientSecretChange = useCallback(e => {
    setClientSecret(e.target.value);
  }, []);

  const onScopeChange = useCallback(e => {
    setScope(e.target.value);
  }, []);

  const onSaveCredentialsChange = useCallback(e => {
    setSaveCredentials(e.target.checked);
  }, []);

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !isAuthorizeDisabled) {
      event.preventDefault();
      onAuthorize();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  return (
    <Dialog
      open={open}
      keepMounted
      onKeyDown={handleKeyDown}
      slotProps={{
        paper: {
          sx: styles.dialogPaper,
        },
      }}
    >
      <DialogTitle
        variant="headingMedium"
        color="text.secondary"
        sx={styles.dialogTitle}
      >
        {title || 'MCP Authorization'}
        <IconButton
          variant="elitea"
          color="tertiary"
          aria-label="close"
          onClick={handleCancel}
          sx={styles.closeButton}
        >
          <CloseIcon sx={styles.closeButtonIcon} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography
          variant="bodyMedium"
          component={'div'}
          sx={styles.description}
        >
          {`This MCP server requires OAuth authorization to access its tools. ${
            serverMetadata.requiresClientSecret
              ? 'This server requires a pre-registered OAuth application. Please provide your client credentials.'
              : authFlow === 'oidc'
                ? 'Using OIDC flow.'
                : authFlow === 'dcr'
                  ? 'Supports automatic client registration.'
                  : authFlow === 'pkce'
                    ? 'Using PKCE flow for enhanced security.'
                    : ''
          }`}
        </Typography>
        <Typography
          variant="headingSmall"
          component={'div'}
          sx={styles.serverUrl}
        >
          {'Server: '}
          <Typography
            variant="bodyMedium"
            component={'span'}
          >
            <Link
              href={serverUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={styles.link}
            >
              {serverUrl}
            </Link>
          </Typography>
        </Typography>
        <OAuthFormFields
          clientId={clientId}
          clientSecret={clientSecret}
          scope={scope}
          onClientIdChange={onClientIdChange}
          onClientSecretChange={onClientSecretChange}
          onScopeChange={onScopeChange}
          availableScopes={availableScopes}
          needSecret={needsClientSecret}
          needClientId={needClientId}
          autoFocus={true}
          saveCredentials={saveCredentials}
          onSaveCredentialsChange={onSaveCredentialsChange}
          showSaveCredentials={needClientId || needsClientSecret}
        />
        {authError && (
          <Typography
            component={'div'}
            variant="bodyMedium"
            sx={styles.errorText}
          >
            {authError}
            {authError.includes('Popup blocked') && (
              <>
                <br />
                💡 Please check your browser settings to allow popups for this site, then try again.
              </>
            )}
          </Typography>
        )}
        {authSuccess && (
          <Typography
            variant="bodyMedium"
            component={'div'}
            sx={styles.successText}
          >
            ✓ Authorization successful! Your credentials and session have been saved. Please send your message
            again to use the authorized MCP server.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          variant="elitea"
          color="secondary"
          onClick={handleCancel}
          disabled={authSuccess}
          disableRipple
        >
          Cancel
        </Button>
        <Button
          variant="elitea"
          color="primary"
          onClick={onAuthorize}
          disabled={isAuthorizeDisabled}
          disableRipple
        >
          {authLoading ? 'Authorizing…' : 'Authorize'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

/** @type {MuiSx} */
const getModalStyles = () => ({
  dialogPaper: ({ palette, spacing }) => ({
    background: palette.background.tabPanel,
    borderRadius: spacing(2),
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    marginTop: 0,
    maxWidth: '35rem',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  }),
  dialogTitle: ({ palette, spacing }) => ({
    height: spacing(7.5),
    padding: spacing(2, 2.5, 2, 3),
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  closeButton: ({ spacing }) => ({
    position: 'absolute',
    right: spacing(2),
    top: spacing(2),
  }),
  closeButtonIcon: {
    fontSize: '1rem',
  },
  dialogContent: ({ palette, spacing }) => ({
    padding: spacing(3),
    paddingTop: `${spacing(3)} !important`,
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  dialogActions: ({ palette, spacing }) => ({
    padding: spacing(2, 3),
    backgroundColor: palette.background.tabPanel,
    justifyContent: 'flex-end',
    gap: spacing(1),
  }),
  serverUrl: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  errorText: ({ palette }) => ({
    color: palette.status.rejected,
    marginTop: '1rem',
  }),
  successText: ({ palette }) => ({
    color: palette.status.published,
    marginTop: '1rem',
  }),
  link: {
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
});

McpAuthModal.displayName = 'McpAuthModal';

export default McpAuthModal;

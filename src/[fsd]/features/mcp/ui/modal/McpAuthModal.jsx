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

import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';
import {
  McpAuthFlowHelpers,
  McpAuthHelpers,
  McpAuthWindowHelpers,
  McpClientRegistrationHelpers,
} from '@/[fsd]/features/mcp/lib/helpers';
import CloseIcon from '@/components/Icons/CloseIcon';

import OAuthFormFields from './OAuthFormFields';

const { MCP_OAUTH_FLOWS, MCP_OAUTH_ERRORS } = McpAuthFlowConstants;

const PRE_REGISTERED_APPLICATION_NOTICE = 'This server requires a pre-registered OAuth application.';

const describeRequestedCredentials = ({ needClientId, needsClientSecret, mustEnterClientSecret }) => {
  if (needClientId && mustEnterClientSecret) return 'Please provide your client credentials.';
  if (needClientId && needsClientSecret) {
    return 'Please provide its Client ID, and its Client Secret if the application has one.';
  }
  if (needClientId) return 'Please provide its Client ID.';
  if (mustEnterClientSecret) return 'Please provide its Client Secret.';
  return 'Provide its Client Secret if the application has one.';
};

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
  const protectedResource = mcpAuthMetadata?.protectedResource;

  // Use provided settings from backend if available, otherwise use form values
  const client_id = providedSettings?.mcp_client_id || formClientId;
  const client_secret = providedSettings?.mcp_client_secret || formClientSecret;
  const scopes = providedSettings?.scopes || formScopes;

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scope, setScope] = useState(convertScopes(resourceScopes) || convertScopes(scopes));
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
      setScope(convertScopes(resourceScopes) || convertScopes(scopes));
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

  const clientRequirements = useMemo(
    () => McpClientRegistrationHelpers.getOAuthClientRequirements(oauthAuthorizationServer, providedSettings),
    [oauthAuthorizationServer, providedSettings],
  );
  const hasAuthServerMetadata = Boolean(
    oauthAuthorizationServer?.authorization_endpoint &&
    oauthAuthorizationServer?.token_endpoint &&
    authServers?.length,
  );
  const { authFlow, requiresClientSecret, isClientSecretMandatory } = clientRequirements;
  const needClientId = hasAuthServerMetadata && clientRequirements.needClientId && !client_id?.trim();
  const needsClientSecret =
    hasAuthServerMetadata && clientRequirements.needClientSecret && !client_secret?.trim();
  const mustEnterClientSecret = needsClientSecret && isClientSecretMandatory;
  const showsCredentialFields = needClientId || needsClientSecret;

  const descriptionText = useMemo(() => {
    if (providedSettings?.has_pat) {
      return 'The pre-configured access token for this MCP server appears to be expired or invalid. Please update the token in the toolkit settings, or complete OAuth authorization below to use a different authentication method.';
    }
    const AUTH_FLOW_MESSAGES = {
      [MCP_OAUTH_FLOWS.OIDC]: 'Using OIDC flow.',
      [MCP_OAUTH_FLOWS.DCR]: 'Supports automatic client registration.',
      [MCP_OAUTH_FLOWS.PKCE]: 'Using PKCE flow for enhanced security.',
    };
    const selectFlowSuffix = () => {
      if (!hasAuthServerMetadata) return '';
      if (!showsCredentialFields || !requiresClientSecret) return AUTH_FLOW_MESSAGES[authFlow] || '';
      const requestedCredentials = describeRequestedCredentials({
        needClientId,
        needsClientSecret,
        mustEnterClientSecret,
      });
      return `${PRE_REGISTERED_APPLICATION_NOTICE} ${requestedCredentials}`;
    };
    const flowSuffix = selectFlowSuffix();
    return `This MCP server requires OAuth authorization to access its tools.${flowSuffix ? ` ${flowSuffix}` : ''}`;
  }, [
    providedSettings?.has_pat,
    hasAuthServerMetadata,
    showsCredentialFields,
    requiresClientSecret,
    needClientId,
    needsClientSecret,
    mustEnterClientSecret,
    authFlow,
  ]);

  const isAuthorizeDisabled = useMemo(() => {
    if (authLoading || authSuccess) return true;

    // For pre-built MCPs, storageKey may not be required (backend manages it)
    if (!storageKey && !isPrebuildMcp) return true;

    if (!hasAuthServerMetadata) return true;

    if (needClientId && !clientId?.trim()) return true;
    return !!(mustEnterClientSecret && !clientSecret?.trim());
  }, [
    authLoading,
    authSuccess,
    storageKey,
    isPrebuildMcp,
    needClientId,
    mustEnterClientSecret,
    clientId,
    clientSecret,
    hasAuthServerMetadata,
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
      await McpAuthFlowHelpers.startMcpAuthFlow({
        serverUrl: storageKey,
        resourceMetadata: {
          authorization_servers: authServers,
          oauth_authorization_server: oauthAuthorizationServer,
          resource: protectedResource,
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
      McpAuthWindowHelpers.closeUnusedAuthPopup(authWindowRef.current);
      authWindowRef.current = null;
    } finally {
      setAuthLoading(false);
    }
  }, [
    storageKey,
    authServers,
    oauthAuthorizationServer,
    protectedResource,
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
          {descriptionText}
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
        {hasAuthServerMetadata ? (
          <OAuthFormFields
            clientId={clientId}
            clientSecret={clientSecret}
            scope={scope}
            onClientIdChange={onClientIdChange}
            onClientSecretChange={onClientSecretChange}
            onScopeChange={onScopeChange}
            availableScopes={availableScopes}
            needSecret={needsClientSecret}
            isSecretRequired={mustEnterClientSecret}
            needClientId={needClientId}
            autoFocus={true}
            saveCredentials={saveCredentials}
            onSaveCredentialsChange={onSaveCredentialsChange}
            showSaveCredentials={showsCredentialFields}
          />
        ) : (
          <Typography
            component={'div'}
            variant="bodyMedium"
            sx={styles.errorText}
            data-testid="mcp-auth-metadata-unavailable"
          >
            {MCP_OAUTH_ERRORS.AUTH_SERVER_METADATA_UNAVAILABLE}
          </Typography>
        )}
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
    background: palette.background.default.tertiary,
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
    backgroundColor: palette.background.default.tertiary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  dialogActions: ({ palette, spacing }) => ({
    padding: spacing(2, 3),
    backgroundColor: palette.background.default.tertiary,
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

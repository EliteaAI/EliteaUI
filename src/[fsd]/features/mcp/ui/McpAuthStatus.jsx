import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Button, Typography } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useMcpAuthCheck, useMcpAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp/ui';
import OnlineIcon from '@/assets/online-icon.svg?react';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const McpAuthStatus = memo(({ authConfig } = {}) => {
  const { values } = useFormikContext();
  const { id, type: toolkitType, settings: { url, client_id, client_secret, scopes } = {} } = values ?? {};
  const { values: formValues } = useFormikContext();
  const projectId = useSelectedProjectId();

  const isFromCreateMcp = useIsFrom(RouteDefinitions.CreateMCP);
  const { toastSuccess } = useToast();

  // Check if this is a pre-built MCP (e.g., mcp_github)
  const isPrebuildMcp = useMemo(() => McpAuthHelpers.isPrebuildMcpType(toolkitType), [toolkitType]);

  // Use the token change hook to monitor login status.
  // authConfig.tokenOptions overrides the default derivation for non-MCP toolkits (e.g. SharePoint).
  const tokenOptions = useMemo(
    () => authConfig?.tokenOptions ?? (isPrebuildMcp ? { toolkitType } : { serverUrl: url }),
    [authConfig, isPrebuildMcp, toolkitType, url],
  );
  const { isLoggedIn: hasLoggedInToMcp } = useMcpTokenChange(tokenOptions);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { showModal, mcpAuthMetadata, handleMcpAuthRequired, handleCloseModal, handleCancelModal } =
    useMcpAuthModal({
      values,
    });

  // Handle successful connection test (for header-based auth servers without OAuth)
  const handleConnectionSuccess = useCallback(() => {
    if (isPrebuildMcp) {
      McpAuthHelpers.setConnectionVerified(null, toolkitType);
    } else if (url) {
      // Mark server as "connection verified" so UI updates
      McpAuthHelpers.setConnectionVerified(url);
    }
  }, [isPrebuildMcp, toolkitType, url]);

  // Use lightweight MCP auth check hook
  const { runAuthCheck, isRunning } = useMcpAuthCheck({
    toolkitId: id,
    values: formValues,
    onMcpAuthRequired: handleMcpAuthRequired,
    onSuccess: handleConnectionSuccess,
  });

  const styles = getStyles(hasLoggedInToMcp);

  const onConfirmLogout = useCallback(() => {
    const logoutKey = authConfig?.tokenStorageKey ?? authConfig?.serverUrl;
    if (logoutKey) {
      McpAuthHelpers.logout(logoutKey);
    } else if (isPrebuildMcp) {
      McpAuthHelpers.logout(null, toolkitType);
    } else if (url) {
      McpAuthHelpers.logout(url);
    }
    setShowLogoutModal(false);
    toastSuccess('You have successfully logged out!');
  }, [authConfig, isPrebuildMcp, toolkitType, url, toastSuccess]);

  const onLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const onLogin = useCallback(() => {
    if (authConfig?.onLogin) {
      // Delegate to the injected handler (e.g. SharePoint HTTP check_connection).
      // Pass handleMcpAuthRequired so the handler can open the OAuth modal on 401.
      authConfig.onLogin(handleMcpAuthRequired);
      return;
    }
    runAuthCheck('list_tools');
  }, [authConfig, handleMcpAuthRequired, runAuthCheck]);

  const onCloseLogout = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  // For pre-built MCPs, we don't require URL to show the auth status.
  // authConfig implies an external flow (e.g. SharePoint) that is always capable of login.
  const canLogin = !!(authConfig || isPrebuildMcp || url);

  // For injected auth flows (authConfig), always render regardless of id/create-mode,
  // since the parent (e.g. SharepointOAuthStatus) already gates rendering on OAuth mode.
  const shouldRender = authConfig ? true : hasLoggedInToMcp || (!isFromCreateMcp && id);

  return shouldRender ? (
    <>
      <Box sx={styles.loginStatusContainer}>
        <Box sx={styles.statusContent}>
          <OnlineIcon style={styles.statusIconOnline} />
          <Typography
            variant="bodySmall"
            sx={styles.loginStatusText}
          >
            {hasLoggedInToMcp ? 'Connected!' : 'Not Connected'}
          </Typography>
        </Box>
        <Button
          onClick={hasLoggedInToMcp ? onLogout : onLogin}
          disabled={!canLogin || isRunning || authConfig?.isRunning}
          variant="secondary"
        >
          {hasLoggedInToMcp ? 'Logout' : isRunning ? 'Logging in...' : 'Login'}
        </Button>
      </Box>
      {showModal && (
        <McpAuthModal
          serverUrl={authConfig?.serverUrl ?? url}
          tokenStorageKey={authConfig?.tokenStorageKey}
          mcpAuthMetadata={mcpAuthMetadata}
          formClientId={client_id}
          formClientSecret={client_secret}
          formScopes={scopes}
          projectId={projectId}
          toolkitId={id}
          toolkitType={isPrebuildMcp ? toolkitType : undefined}
          open={showModal}
          onClose={handleCloseModal}
          onCancel={handleCancelModal}
        />
      )}
      <McpLogoutModal
        serverUrl={authConfig?.tokenStorageKey ?? authConfig?.serverUrl ?? url}
        toolkitType={isPrebuildMcp ? toolkitType : undefined}
        open={showLogoutModal}
        onClose={onCloseLogout}
        onConfirm={onConfirmLogout}
      />
    </>
  ) : null;
});

/** @type {MuiSx} */
const getStyles = hasLoggedInToMcp => ({
  statusIconOnline: {
    width: '.875rem',
    height: '.875rem',
  },
  statusContent: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: hasLoggedInToMcp ? palette.icon.fill.success : palette.icon.fill.attention,
  }),
  loginStatusText: ({ palette }) => ({
    color: hasLoggedInToMcp ? palette.text.mcp.loginSuccess : palette.text.mcp.logout,
  }),
  loginStatusContainer: ({ palette }) => ({
    marginTop: '1rem',
    height: '2.75rem',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '.5rem .5rem .5rem 1rem',
    borderRadius: '2.345rem',
    backgroundColor: hasLoggedInToMcp ? palette.background.mcp.loginSuccess : palette.background.mcp.logout,
    border: `0.0625rem solid ${hasLoggedInToMcp ? palette.border.mcp.loginSuccess : palette.border.mcp.logout}`,
    justifyContent: 'space-between',
  }),
});

McpAuthStatus.displayName = 'McpAuthStatus';

export default McpAuthStatus;

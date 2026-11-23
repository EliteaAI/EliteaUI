import { memo, useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Tooltip, Typography } from '@mui/material';

import { useMcpSavedLogin } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp/ui/modal';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import OnlineIcon from '@/assets/online-icon.svg?react';

const LOCKED_CONNECTED = 'Login managed by a project admin';
const LOCKED_DISCONNECTED = 'Not connected, ask a project admin to log in';

// #7643 bar on an MCP toolkit with a saved login: one admin sign-in serves schedules, webhooks and chats
const McpSavedLoginStatus = memo(props => {
  const { onLoginChange } = props;
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const {
    hasLoginRef,
    isLoading,
    credential,
    account,
    matchesServer,
    isConnected,
    isBusy,
    canManageLogin,
    login,
    logout,
    modalProps,
  } = useMcpSavedLogin({ values, projectId, onLoginChange });

  const onOpenLogout = useCallback(() => setShowLogoutModal(true), []);
  const onCloseLogout = useCallback(() => setShowLogoutModal(false), []);
  const onConfirmLogout = useCallback(() => {
    setShowLogoutModal(false);
    logout();
  }, [logout]);

  if (!hasLoginRef) return null;
  if (!credential) {
    // Still loading, or the linked login was deleted / is not visible to this user: say so, never show nothing
    return (
      <Box sx={mcpSavedLoginStatusStyles(false).container}>
        <Typography
          variant="bodySmall"
          data-testid="mcp-saved-login-missing"
        >
          {isLoading
            ? 'Checking saved login…'
            : 'The linked MCP login was not found. Pick another one or Browser only.'}
        </Typography>
      </Box>
    );
  }

  const statusText = !matchesServer
    ? 'This saved login is for a different MCP server'
    : isConnected
      ? `Connected${account ? ` as ${account}` : ''}`
      : 'Not connected';
  const lockHint = canManageLogin ? '' : isConnected ? LOCKED_CONNECTED : LOCKED_DISCONNECTED;
  const styles = mcpSavedLoginStatusStyles(isConnected);

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.statusContent}>
          <OnlineIcon style={styles.statusIcon} />
          <Typography
            variant="bodySmall"
            sx={styles.statusText}
            data-testid="mcp-saved-login-status"
          >
            {statusText}
          </Typography>
        </Box>
        <Tooltip
          arrow
          title={lockHint}
        >
          <Box
            component="span"
            sx={styles.actions}
          >
            {isConnected && (
              <Button.BaseBtn
                onClick={login}
                disabled={isBusy || !canManageLogin}
                variant={BUTTON_VARIANTS.tertiary}
                data-testid="mcp-saved-login-relogin"
              >
                Re-login
              </Button.BaseBtn>
            )}
            <Button.BaseBtn
              onClick={isConnected ? onOpenLogout : login}
              disabled={isBusy || !canManageLogin || !matchesServer}
              variant={BUTTON_VARIANTS.secondary}
              data-testid="mcp-saved-login-button"
            >
              {isConnected ? 'Log out' : isBusy ? 'Logging in...' : 'Login'}
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
      <McpAuthModal {...modalProps} />
      <McpLogoutModal
        serverUrl={values?.settings?.url}
        toolkitType={values?.type}
        open={showLogoutModal}
        onClose={onCloseLogout}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

McpSavedLoginStatus.displayName = 'McpSavedLoginStatus';

/** @type {MuiSx} */
const mcpSavedLoginStatusStyles = isConnected => ({
  statusIcon: {
    width: '.875rem',
    height: '.875rem',
  },
  statusContent: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: isConnected ? palette.icon.success : palette.icon.attention,
  }),
  statusText: ({ palette }) => ({
    color: isConnected
      ? palette.components.oauthStatus.text.loginSuccess
      : palette.components.oauthStatus.text.logout,
  }),
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
    height: '2.75rem',
    marginBottom: '1rem',
    padding: '.5rem .5rem .5rem 1rem',
    borderRadius: '2.345rem',
    backgroundColor: isConnected
      ? palette.components.oauthStatus.background.loginSuccess
      : palette.components.oauthStatus.background.logout,
    border: `0.0625rem solid ${
      isConnected
        ? palette.components.oauthStatus.border.loginSuccess
        : palette.components.oauthStatus.border.logout
    }`,
  }),
});

export default McpSavedLoginStatus;

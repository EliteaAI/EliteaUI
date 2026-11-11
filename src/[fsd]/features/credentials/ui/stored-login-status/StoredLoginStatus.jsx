import { memo, useCallback, useContext, useState } from 'react';

import { FormikContext } from 'formik';

import { Box, Tooltip, Typography } from '@mui/material';

import { useStoredOAuthLogin } from '@/[fsd]/features/credentials/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import OnlineIcon from '@/assets/online-icon.svg?react';

const MANAGE_LOGIN_HINT = 'Only project admins can log in or out on a team credential';

// A toolkit-page "Connected / Login" bar for credentials that keep a Microsoft login in the vault.
// `credentialRef` ({ elitea_title, private }) lets it work outside the toolkit form, e.g. the Connections panel.
const StoredLoginStatus = memo(props => {
  const {
    configurationType,
    settingsKey,
    getAuthority,
    keepBrowserToken,
    loginExpired,
    onLoginChange,
    credentialRef,
    compact = false,
  } = props;
  const values = useContext(FormikContext)?.values;
  const projectId = useSelectedProjectId();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { hasCredential, credentialTitle, isConnected, isBusy, canManageLogin, login, logout, modalProps } =
    useStoredOAuthLogin({
      configurationType,
      credentialRef: credentialRef ?? values?.settings?.[settingsKey],
      projectId,
      getAuthority,
      keepBrowserToken,
      loginExpired,
      onLoginChange,
    });

  const onOpenLogout = useCallback(() => setShowLogoutModal(true), []);
  const onCloseLogout = useCallback(() => setShowLogoutModal(false), []);
  const onConfirmLogout = useCallback(() => {
    setShowLogoutModal(false);
    logout();
  }, [logout]);

  const styles = storedLoginStatusStyles(isConnected, compact);

  if (!hasCredential) return null;

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.statusContent}>
          <OnlineIcon style={styles.statusIcon} />
          <Typography
            variant="bodySmall"
            sx={styles.statusText}
            data-testid="stored-login-status"
          >
            {isConnected ? 'Connected!' : 'Not Connected'}
          </Typography>
        </Box>
        <Tooltip
          arrow
          title={canManageLogin ? '' : MANAGE_LOGIN_HINT}
        >
          <Box component="span">
            <Button.BaseBtn
              onClick={isConnected ? onOpenLogout : login}
              disabled={isBusy || !canManageLogin}
              variant={BUTTON_VARIANTS.secondary}
              data-testid="stored-login-button"
            >
              {isConnected ? 'Logout' : isBusy ? 'Logging in...' : 'Login'}
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
      <McpAuthModal {...modalProps} />
      <McpLogoutModal
        serverUrl={credentialTitle}
        open={showLogoutModal}
        onClose={onCloseLogout}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

StoredLoginStatus.displayName = 'StoredLoginStatus';

/** @type {MuiSx} */
const storedLoginStatusStyles = (isConnected, compact) => ({
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
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
    height: compact ? '2.25rem' : '2.75rem',
    marginTop: compact ? 0 : '1rem',
    marginBottom: compact ? 0 : '1rem',
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

export default StoredLoginStatus;

import { memo, useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useDataverseLogin } from '@/[fsd]/features/dataverse/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import OnlineIcon from '@/assets/online-icon.svg?react';

const DataverseLoginStatus = memo(props => {
  const { onLoginChange } = props;
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { hasCredential, credentialTitle, isConnected, isBusy, login, logout, modalProps } =
    useDataverseLogin({
      credentialRef: values?.settings?.dataverse_configuration,
      projectId,
      // Re-runs toolkit validation so the stale "Sign in" warning under the credential goes away
      onLoginChange,
    });

  const onOpenLogout = useCallback(() => setShowLogoutModal(true), []);
  const onCloseLogout = useCallback(() => setShowLogoutModal(false), []);
  const onConfirmLogout = useCallback(() => {
    setShowLogoutModal(false);
    logout();
  }, [logout]);

  const styles = dataverseLoginStatusStyles(isConnected);

  if (!hasCredential) return null;

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.statusContent}>
          <OnlineIcon style={styles.statusIcon} />
          <Typography
            variant="bodySmall"
            sx={styles.statusText}
            data-testid="dataverse-connection-status"
          >
            {isConnected ? 'Connected!' : 'Not Connected'}
          </Typography>
        </Box>
        <Button.BaseBtn
          onClick={isConnected ? onOpenLogout : login}
          disabled={isBusy}
          variant={BUTTON_VARIANTS.secondary}
          data-testid="dataverse-connection-button"
        >
          {isConnected ? 'Logout' : isBusy ? 'Logging in...' : 'Login'}
        </Button.BaseBtn>
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

DataverseLoginStatus.displayName = 'DataverseLoginStatus';

/** @type {MuiSx} */
const dataverseLoginStatusStyles = isConnected => ({
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
    height: '2.75rem',
    marginTop: '1rem',
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

export default DataverseLoginStatus;

import { memo } from 'react';

import { Button } from '@mui/material';

import { useMcpLogin } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';

const McpLogInButton = memo(props => {
  const { values, onSuccess, sx, title = 'Log in', authConfig } = props;
  const styles = getStyles();

  const { isLoggedIn, isRunning, onLogin, modalProps } = useMcpLogin({ values, onSuccess, authConfig });

  if (isLoggedIn) {
    return null;
  }

  return (
    <>
      <Button
        color="tertiary"
        variant="elitea"
        onClick={onLogin}
        disabled={isRunning}
        sx={[styles.loginText, sx]}
      >
        {isRunning ? 'Logging in...' : title}
      </Button>
      <McpAuthModal {...modalProps} />
    </>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  loginText: {
    color: 'primary.main',
    '&:hover': {
      color: 'primary.dark',
    },
  },
});

McpLogInButton.displayName = 'McpLogInButton';

export default McpLogInButton;

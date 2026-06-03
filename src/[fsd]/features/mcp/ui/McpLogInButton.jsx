import { memo } from 'react';

import { Button } from '@/[fsd]/shared/ui';

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
      <Button.BaseBtn
        color="tertiary"
        variant="elitea"
        onClick={onLogin}
        disabled={isRunning}
        sx={[styles.loginText, sx]}
      >
        {isRunning ? 'Logging in...' : title}
      </Button.BaseBtn>
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

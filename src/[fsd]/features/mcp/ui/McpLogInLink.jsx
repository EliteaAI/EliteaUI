import { memo } from 'react';

import { Typography } from '@mui/material';

import { useMcpLogin } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';

const McpLogInLink = memo(props => {
  const { values, onSuccess, sx, title = 'Log in.' } = props;
  const styles = getStyles();

  const { isLoggedIn, isRunning, onLogin, stopPropagation, modalProps } = useMcpLogin({ values, onSuccess });

  if (isLoggedIn) {
    return null;
  }

  return (
    <>
      <Typography
        variant="bodySmall"
        onClick={onLogin}
        onMouseDown={stopPropagation}
        onMouseEnter={stopPropagation}
        onMouseLeave={stopPropagation}
        disabled={isRunning}
        sx={[styles.loginText, sx]}
      >
        {isRunning ? 'Logging in...' : title}
      </Typography>
      <McpAuthModal {...modalProps} />
    </>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  loginText: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'primary.main',
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    display: 'inline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
});

McpLogInLink.displayName = 'McpLogInLink';

export default McpLogInLink;

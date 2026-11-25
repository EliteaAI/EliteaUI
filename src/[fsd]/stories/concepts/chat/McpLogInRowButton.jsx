// Chat concept: the row's «Log in» of a remote MCP server; the same sign-in as the «Log in» part of
// src/[fsd]/features/mcp/ui/McpLogInLink.jsx
import { memo } from 'react';

import { McpAuthModal, useMcpLogin } from '@/[fsd]/features/mcp';

import LogInButton from './LogInButton';

const McpLogInRowButton = memo(props => {
  const { values, disabled } = props;
  const { isLoggedIn, isRunning, onLogin, modalProps } = useMcpLogin({ values });
  if (isLoggedIn) return null;
  return (
    <>
      <LogInButton
        onClick={onLogin}
        isRunning={isRunning}
        disabled={disabled}
      />
      <McpAuthModal {...modalProps} />
    </>
  );
});

McpLogInRowButton.displayName = 'McpLogInRowButton';

export default McpLogInRowButton;

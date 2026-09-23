// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

import McpAuthStatus from '../McpAuthStatus';

const mocks = vi.hoisted(() => ({
  handleMcpAuthRequired: vi.fn(),
  runAuthCheck: vi.fn(),
  authCheckOptions: null,
  setConnectionVerified: vi.fn(),
  claimAutomaticHeaderCheck: vi.fn(),
  getAccessToken: vi.fn(),
  isVerifying: false,
  values: { id: 924, type: 'mcp_Epam Delivery Central', settings: {} },
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: mocks.values,
  }),
}));

vi.mock('@mui/material', () => ({
  Box: ({ children }) => children,
  Tooltip: ({ children }) => children,
  Typography: ({ children }) => children,
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({
  MCP_TOUR_TARGET_IDS: { connectionStatus: 'mcp-connection-status' },
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    isPrebuildMcpType: type => type?.startsWith('mcp_') && type !== 'mcp',
    setConnectionVerified: mocks.setConnectionVerified,
    claimAutomaticHeaderCheck: mocks.claimAutomaticHeaderCheck,
    getAccessToken: mocks.getAccessToken,
    logout: vi.fn(),
  },
}));

vi.mock('@/[fsd]/features/mcp/lib/hooks', async () => ({
  useAutoVerifyMcpConnection: (
    await vi.importActual('@/[fsd]/features/mcp/lib/hooks/useAutoVerifyMcpConnection.hooks')
  ).useAutoVerifyMcpConnection,
  useInternalMcpPatStatus: () => ({ patInvalid: false }),
  useMcpTokenChange: () => ({ isLoggedIn: false }),
  useMcpAuthModal: () => ({
    showModal: false,
    mcpAuthMetadata: null,
    runtimeServerUrl: '',
    handleMcpAuthRequired: mocks.handleMcpAuthRequired,
    handleCloseModal: vi.fn(),
    handleCancelModal: vi.fn(),
  }),
  useMcpAuthCheck: options => {
    mocks.authCheckOptions = options;
    return { runAuthCheck: mocks.runAuthCheck, isRunning: false, isVerifying: mocks.isVerifying };
  },
}));

vi.mock('@/[fsd]/features/mcp/ui', () => ({
  McpAuthModal: () => null,
  McpLogoutModal: () => null,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: ({ children, disabled, onClick, 'data-testid': testId }) => (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        data-testid={testId}
      >
        {children}
      </button>
    ),
  },
}));

vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({
  BUTTON_VARIANTS: { secondary: 'secondary' },
}));

vi.mock('@/hooks/useIsFromSpecificPageHooks', () => ({
  useIsFrom: () => false,
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 30,
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn() }),
}));

vi.mock('@/routes', () => ({
  default: { CreateMCP: '/app/mcps/create/:type' },
  PathSessionMap: {},
}));

describe('McpAuthStatus existing toolkit login', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.handleMcpAuthRequired.mockReset();
    mocks.runAuthCheck.mockReset();
    mocks.authCheckOptions = null;
    mocks.setConnectionVerified.mockReset();
    mocks.claimAutomaticHeaderCheck.mockReset().mockReturnValue(true);
    mocks.getAccessToken.mockReset().mockReturnValue(null);
    mocks.isVerifying = false;
    mocks.values = { id: 924, type: 'mcp_Epam Delivery Central', settings: {} };
  });

  it('starts the normal auth flow once for an existing preconfigured MCP', async () => {
    render(<McpAuthStatus />);

    await waitFor(() => expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith());

    const message = { type: 'mcp_authorization_required' };
    act(() => mocks.authCheckOptions.onMcpAuthRequired(message));

    expect(mocks.handleMcpAuthRequired).toHaveBeenCalledWith(message);
  });

  it('verifies a saved remote MCP with configured headers and marks only a successful check', async () => {
    mocks.values = {
      id: 925,
      type: 'mcp',
      settings: { url: 'https://example.com/mcp', headers: { Authorization: 'secret-reference' } },
    };

    render(<McpAuthStatus />);

    await waitFor(() => expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith({ silent: true }));
    expect(mocks.authCheckOptions.values).toBe(mocks.values);
    expect(mocks.setConnectionVerified).not.toHaveBeenCalled();
    act(() => mocks.authCheckOptions.onSuccess());
    expect(mocks.setConnectionVerified).toHaveBeenCalledWith('https://example.com/mcp');
  });

  it('does not automatically test a remote MCP without configured headers', () => {
    mocks.values = { id: 926, type: 'mcp', settings: { url: 'https://example.com/mcp' } };

    render(<McpAuthStatus />);

    expect(mocks.runAuthCheck).not.toHaveBeenCalled();
  });

  it('does not bypass an injected login flow for a header MCP', () => {
    mocks.values = {
      id: 925,
      type: 'mcp',
      settings: { url: 'https://example.com/mcp', headers: { Authorization: 'secret-reference' } },
    };

    render(<McpAuthStatus authConfig={{ onLogin: vi.fn() }} />);

    expect(mocks.runAuthCheck).not.toHaveBeenCalled();
    expect(mocks.claimAutomaticHeaderCheck).not.toHaveBeenCalled();
  });

  it('keeps the Login button visible and enabled during background verification', () => {
    mocks.values = {
      id: 925,
      type: 'mcp',
      settings: { url: 'https://example.com/mcp', headers: { Authorization: 'secret-reference' } },
    };
    mocks.isVerifying = true;

    render(<McpAuthStatus />);

    const button = screen.getByTestId('toolkit-connection-login-button');
    expect(button.textContent).toBe('Login');
    expect(button.disabled).toBe(false);
  });
});

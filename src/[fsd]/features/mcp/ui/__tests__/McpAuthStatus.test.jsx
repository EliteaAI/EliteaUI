// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, render, waitFor } from '@testing-library/react';

import McpAuthStatus from '../McpAuthStatus';

const mocks = vi.hoisted(() => ({
  handleMcpAuthRequired: vi.fn(),
  runAuthCheck: vi.fn(),
  authCheckOptions: null,
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { id: 924, type: 'mcp_Epam Delivery Central', settings: {} },
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
    setConnectionVerified: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
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
    return { runAuthCheck: mocks.runAuthCheck, isRunning: false };
  },
}));

vi.mock('@/[fsd]/features/mcp/ui', () => ({
  McpAuthModal: () => null,
  McpLogoutModal: () => null,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: { BaseBtn: () => null },
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
  beforeEach(() => {
    mocks.handleMcpAuthRequired.mockReset();
    mocks.runAuthCheck.mockReset();
    mocks.authCheckOptions = null;
  });

  it('starts the normal auth flow once for an existing preconfigured MCP', async () => {
    render(<McpAuthStatus />);

    await waitFor(() => expect(mocks.runAuthCheck).toHaveBeenCalledTimes(1));

    const message = { type: 'mcp_authorization_required' };
    act(() => mocks.authCheckOptions.onMcpAuthRequired(message));

    expect(mocks.handleMcpAuthRequired).toHaveBeenCalledWith(message);
  });
});

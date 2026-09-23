// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useGetRemoteMcpTools } from '../useGetRemoteMcpTools.hooks';

const { mcpSyncTools, toasts } = vi.hoisted(() => ({
  mcpSyncTools: vi.fn(),
  toasts: { toastError: vi.fn(), toastSuccess: vi.fn(), toastWarning: vi.fn(), toastInfo: vi.fn() },
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    getAllTokens: () => ({}),
    isPrebuildMcpType: () => false,
    setConnectionVerified: vi.fn(),
  },
}));

vi.mock('@/[fsd]/features/mcp/lib/hooks/useMcpAuthModal.hooks', () => ({
  useMcpAuthModal: () => ({ handleMcpAuthRequired: vi.fn(), getModalProps: () => ({}) }),
}));

vi.mock('@/api/toolkits', () => ({
  useMcpSyncToolsMutation: () => [mcpSyncTools],
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 2,
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => toasts,
}));

const VALUES = { type: 'mcp', settings: { url: 'https://mcp.example.test/mcp' } };

const respondWith = result => {
  mcpSyncTools.mockReturnValue({ unwrap: () => Promise.resolve(result) });
};

describe('useGetRemoteMcpTools Load Tools result handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the success toast and passes the tools on', async () => {
    respondWith({ success: true, tools: [{ name: 'echo' }] });
    const onToolsFetched = vi.fn();
    const { result } = renderHook(() => useGetRemoteMcpTools({ values: VALUES, onToolsFetched }));

    await act(async () => {
      await result.current.fetchTools();
    });

    expect(onToolsFetched).toHaveBeenCalledWith([{ name: 'echo' }], undefined);
    expect(toasts.toastSuccess).toHaveBeenCalledWith('Successfully fetched 1 tools');
    expect(toasts.toastWarning).not.toHaveBeenCalled();
  });

  it('folds a partial refresh into a single warning toast, since only one toast can show', async () => {
    const warning = 'Tools were fetched, but cached tool lists could not be retired.';
    respondWith({ success: true, tools: [{ name: 'echo' }], warning });
    const onToolsFetched = vi.fn();
    const { result } = renderHook(() => useGetRemoteMcpTools({ values: VALUES, onToolsFetched }));

    await act(async () => {
      await result.current.fetchTools();
    });

    expect(onToolsFetched).toHaveBeenCalledWith([{ name: 'echo' }], undefined);
    expect(toasts.toastWarning).toHaveBeenCalledWith(`Fetched 1 tools. ${warning}`);
    expect(toasts.toastSuccess).not.toHaveBeenCalled();
  });

  it('keeps a failure as an error toast', async () => {
    respondWith({ success: false, error: 'Failed to sync MCP tools: boom' });
    const { result } = renderHook(() => useGetRemoteMcpTools({ values: VALUES, onToolsFetched: vi.fn() }));

    await act(async () => {
      await result.current.fetchTools();
    });

    expect(toasts.toastError).toHaveBeenCalledWith('Failed to sync MCP tools: boom');
    expect(toasts.toastWarning).not.toHaveBeenCalled();
  });
});

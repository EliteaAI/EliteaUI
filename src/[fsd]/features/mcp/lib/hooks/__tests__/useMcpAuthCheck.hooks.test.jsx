// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMcpAuthCheck } from '../useMcpAuthCheck.hooks';

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  toastError: vi.fn(),
  onMessage: null,
}));

vi.mock('@/common/constants', () => ({
  SocketMessageType: {
    McpAuthorizationRequired: 'mcp_authorization_required',
    AgentToolEnd: 'agent_tool_end',
    AgentResponse: 'agent_response',
    AgentMessage: 'agent_message',
    ToolResponseComplete: 'tool_response_complete',
    FullMessage: 'full_message',
    AgentToolError: 'agent_tool_error',
    Error: 'error',
    AgentException: 'agent_exception',
  },
  sioEvents: { test_mcp_connection: 'test_mcp_connection' },
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: { getAllTokens: () => ({}) },
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 30,
}));

vi.mock('@/hooks/useSocket', () => ({
  useManualSocket: (_, onMessage) => {
    mocks.onMessage = onMessage;
    return { emit: mocks.emit, subscribe: mocks.subscribe, unsubscribe: mocks.unsubscribe };
  },
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: mocks.toastError }),
}));

const values = { id: 925, type: 'mcp', settings: { url: 'https://example.com/mcp' } };

describe('useMcpAuthCheck silent automatic verification', () => {
  beforeEach(() => {
    mocks.emit.mockReset();
    mocks.subscribe.mockReset();
    mocks.unsubscribe.mockReset();
    mocks.toastError.mockReset();
    mocks.onMessage = null;
  });

  it('suppresses the OAuth prompt for a silent check', async () => {
    const onMcpAuthRequired = vi.fn();
    const { result } = renderHook(() => useMcpAuthCheck({ toolkitId: 925, values, onMcpAuthRequired }));

    await act(async () => result.current.runAuthCheck({ silent: true }));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isVerifying).toBe(true);
    act(() =>
      mocks.onMessage({
        type: 'mcp_authorization_required',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );

    expect(onMcpAuthRequired).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();

    act(() =>
      mocks.onMessage({
        type: 'error',
        content: 'late error',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );
    expect(mocks.toastError).not.toHaveBeenCalled();

    await act(async () => result.current.runAuthCheck());
    act(() =>
      mocks.onMessage({
        type: 'mcp_authorization_required',
        stream_id: mocks.emit.mock.calls[1][0].stream_id,
      }),
    );
    expect(onMcpAuthRequired).toHaveBeenCalledTimes(1);
  });

  it('keeps the login button available and adopts an in-flight silent check after a click', async () => {
    const { result } = renderHook(() => useMcpAuthCheck({ toolkitId: 925, values }));

    await act(async () => result.current.runAuthCheck({ silent: true }));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isVerifying).toBe(true);

    await act(async () => result.current.runAuthCheck());
    expect(mocks.emit).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isVerifying).toBe(false);

    act(() =>
      mocks.onMessage({
        type: 'error',
        content: 'unauthorized',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith('unauthorized');
    expect(result.current.isRunning).toBe(false);
  });

  it('does not mark an edited header config from an older silent response', async () => {
    const onSuccess = vi.fn();
    const savedConfig = {
      ...values,
      settings: { ...values.settings, headers: { Authorization: 'saved-header' } },
    };
    const { result, rerender } = renderHook(
      ({ config }) => useMcpAuthCheck({ toolkitId: 925, values: config, onSuccess }),
      { initialProps: { config: savedConfig } },
    );

    await act(async () => result.current.runAuthCheck({ silent: true }));
    rerender({
      config: {
        ...savedConfig,
        settings: { ...savedConfig.settings, headers: { Authorization: 'unsaved-edit' } },
      },
    });
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );

    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.isVerifying).toBe(false);
  });

  it('restarts an in-flight silent check when a card switches toolkits', async () => {
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }) => useMcpAuthCheck({ toolkitId: config.id, values: config, onSuccess }),
      { initialProps: { config: values } },
    );

    await act(async () => result.current.runAuthCheck({ silent: true }));
    const oldStreamId = mocks.emit.mock.calls[0][0].stream_id;
    rerender({
      config: { id: 926, type: 'mcp', settings: { url: 'https://other.example.com/mcp' } },
    });
    await act(async () => result.current.runAuthCheck({ silent: true }));

    expect(mocks.emit).toHaveBeenCalledTimes(2);
    expect(mocks.emit.mock.calls[1][0].toolkit_config.toolkit_id).toBe(926);
    act(() => mocks.onMessage({ type: 'agent_tool_end', stream_id: oldStreamId }));
    expect(onSuccess).not.toHaveBeenCalled();
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[1][0].stream_id,
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not apply a manual result to a different toolkit after card reuse', async () => {
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }) => useMcpAuthCheck({ toolkitId: config.id, values: config, onSuccess }),
      { initialProps: { config: values } },
    );

    await act(async () => result.current.runAuthCheck());
    expect(result.current.isRunning).toBe(true);
    const oldStreamId = mocks.emit.mock.calls[0][0].stream_id;
    rerender({
      config: { id: 926, type: 'mcp', settings: { url: 'https://other.example.com/mcp' } },
    });
    expect(result.current.isRunning).toBe(false);
    await act(async () => result.current.runAuthCheck({ silent: true }));

    expect(mocks.emit).toHaveBeenCalledTimes(2);
    act(() => mocks.onMessage({ type: 'agent_tool_end', stream_id: oldStreamId }));
    expect(onSuccess).not.toHaveBeenCalled();
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[1][0].stream_id,
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('ignores a manual authorization challenge from a toolkit the card no longer shows', async () => {
    const onMcpAuthRequired = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }) => useMcpAuthCheck({ toolkitId: config.id, values: config, onMcpAuthRequired }),
      { initialProps: { config: values } },
    );

    await act(async () => result.current.runAuthCheck());
    const oldStreamId = mocks.emit.mock.calls[0][0].stream_id;
    rerender({
      config: { id: 926, type: 'mcp', settings: { url: 'https://other.example.com/mcp' } },
    });
    act(() => mocks.onMessage({ type: 'mcp_authorization_required', stream_id: oldStreamId }));

    expect(onMcpAuthRequired).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });

  it('checks edited headers with a new request when Login is clicked during verification', async () => {
    const onSuccess = vi.fn();
    const savedConfig = {
      ...values,
      settings: { ...values.settings, headers: { Authorization: 'saved-header' } },
    };
    const { result, rerender } = renderHook(
      ({ config }) => useMcpAuthCheck({ toolkitId: 925, values: config, onSuccess }),
      { initialProps: { config: savedConfig } },
    );

    await act(async () => result.current.runAuthCheck({ silent: true }));
    rerender({
      config: {
        ...savedConfig,
        settings: { ...savedConfig.settings, headers: { Authorization: 'unsaved-edit' } },
      },
    });
    await act(async () => result.current.runAuthCheck());

    expect(mocks.emit).toHaveBeenCalledTimes(2);
    expect(mocks.emit.mock.calls[1][0].toolkit_config.settings.headers.Authorization).toBe('unsaved-edit');
    expect(result.current.isRunning).toBe(true);
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[1][0].stream_id,
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('suppresses an automatic error but reports a manual error', async () => {
    const { result } = renderHook(() => useMcpAuthCheck({ toolkitId: 925, values }));

    await act(async () => result.current.runAuthCheck({ silent: true }));
    act(() =>
      mocks.onMessage({
        type: 'error',
        content: 'unauthorized',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );
    expect(mocks.toastError).not.toHaveBeenCalled();

    await act(async () => result.current.runAuthCheck());
    act(() =>
      mocks.onMessage({
        type: 'error',
        content: 'unauthorized',
        stream_id: mocks.emit.mock.calls[1][0].stream_id,
      }),
    );
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith('unauthorized');
  });

  it('still reports success from a silent check', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useMcpAuthCheck({ toolkitId: 925, values, onSuccess }));

    await act(async () => result.current.runAuthCheck({ silent: true }));
    act(() =>
      mocks.onMessage({
        type: 'agent_tool_end',
        stream_id: mocks.emit.mock.calls[0][0].stream_id,
      }),
    );

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});

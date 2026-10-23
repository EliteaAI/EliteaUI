// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

const toastError = vi.fn();
const pending = [];
const updateContextStrategy = vi.fn(() => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  pending.push({ resolve, reject });
  return { unwrap: () => promise };
});

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 1,
  useToast: () => ({ toastError }),
}));

vi.mock('@/api', () => ({
  useUpdateContextStrategyMutation: () => [updateContextStrategy, { isLoading: false }],
}));

const { useContextWindowSwitch } = await import('../useContextWindowSwitch.hooks');

const setup = () => {
  let conversation = { meta: { context_strategy: { context_window_mode: 'balanced' } } };
  const setActiveConversation = vi.fn(updater => {
    conversation = updater(conversation);
  });
  const hook = renderHook(() =>
    useContextWindowSwitch({
      conversationId: 7,
      contextStrategy: conversation.meta.context_strategy,
      setActiveConversation,
    }),
  );
  return { hook, getMode: () => conversation.meta.context_strategy.context_window_mode };
};

describe('useContextWindowSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pending.length = 0;
  });

  it('applies the switch optimistically and keeps it on success', async () => {
    const { hook, getMode } = setup();
    let call;
    act(() => {
      call = hook.result.current.switchMode('full');
    });
    expect(getMode()).toBe('full');
    await act(async () => {
      pending[0].resolve({ updated_strategy: { context_window_mode: 'full' } });
      await call;
    });
    expect(getMode()).toBe('full');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('rolls back to the original strategy when the latest of rapid switches fails', async () => {
    const { hook, getMode } = setup();
    let first;
    let second;
    act(() => {
      first = hook.result.current.switchMode('full');
    });
    act(() => {
      second = hook.result.current.switchMode('balanced');
    });
    let third;
    act(() => {
      third = hook.result.current.switchMode('full');
    });
    expect(getMode()).toBe('full');

    await act(async () => {
      pending[0].reject({ data: { error: 'first failed' } });
      pending[1].resolve({ updated_strategy: { context_window_mode: 'balanced' } });
      await Promise.allSettled([first, second]);
    });
    // Stale requests do not touch the state
    expect(getMode()).toBe('full');
    expect(toastError).not.toHaveBeenCalled();

    await act(async () => {
      pending[2].reject({ data: { error: 'boom' } });
      await third;
    });
    expect(getMode()).toBe('balanced');
    expect(toastError).toHaveBeenCalledWith('boom');
  });

  it('ignores a stale failure when the latest switch succeeds', async () => {
    const { hook, getMode } = setup();
    let first;
    let second;
    act(() => {
      first = hook.result.current.switchMode('full');
    });
    act(() => {
      second = hook.result.current.switchMode('full');
    });
    await act(async () => {
      pending[1].resolve({ updated_strategy: { context_window_mode: 'full' } });
      pending[0].reject({ data: { error: 'stale' } });
      await Promise.allSettled([first, second]);
    });
    expect(getMode()).toBe('full');
    expect(toastError).not.toHaveBeenCalled();
  });
});

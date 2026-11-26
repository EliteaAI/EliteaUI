// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useToastAutoClose } from '../useToastAutoClose.hooks';

const DURATIONS = { error: 1000, warning: 1000, success: 1000, info: 1000 };

const makeToast = (id, severity = 'info') => ({ id, severity, message: `Toast ${id}`, open: true });

const renderAutoClose = initialProps => {
  const onAutoClose = vi.fn();
  const hook = renderHook(
    ({ paused, ...props }) =>
      useToastAutoClose({ durations: DURATIONS, onAutoClose, isPaused: () => paused, ...props }),
    { initialProps: { toasts: [], paused: false, ...initialProps } },
  );
  return { ...hook, onAutoClose };
};

describe('useToastAutoClose', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('closes a toast once its duration has passed', () => {
    const { onAutoClose } = renderAutoClose({ toasts: [makeToast(1)] });

    act(() => vi.advanceTimersByTime(900));
    expect(onAutoClose).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onAutoClose).toHaveBeenCalledTimes(1);
    expect(onAutoClose).toHaveBeenCalledWith(1);
  });

  it('closes toasts that are due one at a time, oldest first, with a gap between them', () => {
    const { onAutoClose } = renderAutoClose({ toasts: [makeToast(1), makeToast(2), makeToast(3)] });

    act(() => vi.advanceTimersByTime(1200));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1]);

    act(() => vi.advanceTimersByTime(1000));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1]);

    act(() => vi.advanceTimersByTime(600));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1, 2]);

    act(() => vi.advanceTimersByTime(1600));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1, 2, 3]);
  });

  it('does not count time while paused and continues when resumed', () => {
    const toasts = [makeToast(1)];
    const { onAutoClose, rerender } = renderAutoClose({ toasts });

    act(() => vi.advanceTimersByTime(600));
    rerender({ toasts, paused: true });

    act(() => vi.advanceTimersByTime(5000));
    expect(onAutoClose).not.toHaveBeenCalled();

    rerender({ toasts, paused: false });

    act(() => vi.advanceTimersByTime(200));
    expect(onAutoClose).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(400));
    expect(onAutoClose).toHaveBeenCalledWith(1);
  });

  it('resumes by itself when isPaused stops returning true, without any rerender', () => {
    // For example the focused toast was closed, so its blur event never arrived.
    let paused = true;
    const onAutoClose = vi.fn();
    renderHook(() =>
      useToastAutoClose({
        toasts: [makeToast(1)],
        durations: DURATIONS,
        onAutoClose,
        isPaused: () => paused,
      }),
    );

    act(() => vi.advanceTimersByTime(5000));
    expect(onAutoClose).not.toHaveBeenCalled();

    paused = false;

    act(() => vi.advanceTimersByTime(1200));
    expect(onAutoClose).toHaveBeenCalledWith(1);
  });

  it('gives a toast added later its full duration', () => {
    const { onAutoClose, rerender } = renderAutoClose({ toasts: [makeToast(1)] });

    act(() => vi.advanceTimersByTime(600));
    rerender({ toasts: [makeToast(1), makeToast(2)], paused: false });

    act(() => vi.advanceTimersByTime(600));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1]);

    // Toast 2 is due at 1600 ms, but it waits for the gap after toast 1 (closed at about 1000 ms).
    act(() => vi.advanceTimersByTime(800));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1]);

    act(() => vi.advanceTimersByTime(600));
    expect(onAutoClose.mock.calls.map(([id]) => id)).toEqual([1, 2]);
  });

  it('ignores toasts that are already closing', () => {
    const { onAutoClose } = renderAutoClose({ toasts: [{ ...makeToast(1), open: false }] });

    act(() => vi.advanceTimersByTime(5000));
    expect(onAutoClose).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { useContext } from 'react';

import { afterEach, describe, expect, it } from 'vitest';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import { act, cleanup, renderHook } from '@testing-library/react';

import ToastProvider from '../ToastProvider';

const { MAX_TOASTS } = ToastConstants;

const renderProvider = () =>
  renderHook(() => useContext(ToastContext), {
    wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
  });

describe('ToastProvider', () => {
  afterEach(() => cleanup());

  it('keeps every toast in the order it was opened', () => {
    const { result } = renderProvider();

    act(() => {
      result.current.toastHandlers.toastInfo('A');
      result.current.toastHandlers.toastError('B');
    });

    expect(result.current.toasts.map(({ message, severity }) => [message, severity])).toEqual([
      ['A', 'info'],
      ['B', 'error'],
    ]);
  });

  it('keeps at most MAX_TOASTS toasts and drops the oldest', () => {
    const { result } = renderProvider();

    act(() => {
      for (let index = 1; index <= MAX_TOASTS + 1; index += 1) {
        result.current.toastHandlers.toastInfo(`Toast ${index}`);
      }
    });

    expect(result.current.toasts).toHaveLength(MAX_TOASTS);
    expect(result.current.toasts[0].message).toBe('Toast 2');
    expect(result.current.toasts.at(-1).message).toBe(`Toast ${MAX_TOASTS + 1}`);
  });

  it('closeToast only marks the toast as closing and keeps it listed', () => {
    const { result } = renderProvider();

    act(() => {
      result.current.toastHandlers.toastInfo('A');
      result.current.toastHandlers.toastInfo('B');
    });
    act(() => result.current.closeToast(result.current.toasts[0].id));

    expect(result.current.toasts.map(toast => toast.open)).toEqual([false, true]);
  });

  it('clearToast removes one toast by id, or all toasts without an id', () => {
    const { result } = renderProvider();

    act(() => {
      result.current.toastHandlers.toastInfo('A');
      result.current.toastHandlers.toastInfo('B');
      result.current.toastHandlers.toastInfo('C');
    });
    act(() => result.current.clearToast(result.current.toasts[1].id));

    expect(result.current.toasts.map(toast => toast.message)).toEqual(['A', 'C']);

    act(() => result.current.clearToast());

    expect(result.current.toasts).toEqual([]);
  });
});

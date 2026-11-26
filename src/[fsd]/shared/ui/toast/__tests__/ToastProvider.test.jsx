// @vitest-environment jsdom
import { useContext } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import { act, cleanup, renderHook } from '@testing-library/react';

import ToastProvider from '../ToastProvider';

const { MAX_TOASTS } = ToastConstants;

const renderProvider = () =>
  renderHook(() => useContext(ToastContext), {
    wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
  });

describe('ToastProvider onCloseToast', () => {
  afterEach(() => cleanup());

  it('runs only the callback of the toast that is closed', () => {
    const { result } = renderProvider();
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();

    act(() => {
      result.current.setOnCloseToast(onCloseA);
      result.current.toastHandlers.toastSuccess('A');
      result.current.setOnCloseToast(onCloseB);
      result.current.toastHandlers.toastSuccess('B');
    });

    const [first] = result.current.toasts;
    act(() => result.current.clearToast(first.id));

    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).not.toHaveBeenCalled();
    expect(result.current.toasts.map(toast => toast.message)).toEqual(['B']);
  });

  it('does not run a callback for a toast that was created without one', () => {
    const { result } = renderProvider();
    const onClose = vi.fn();

    act(() => {
      result.current.toastHandlers.toastInfo('Plain');
      result.current.setOnCloseToast(onClose);
      result.current.toastHandlers.toastSuccess('With callback');
    });

    const [plain] = result.current.toasts;
    act(() => result.current.clearToast(plain.id));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('gives a toast the callback set just before it, in the same batch of effects', () => {
    const { result } = renderProvider();
    const stale = vi.fn();
    const latest = vi.fn();

    act(() => {
      result.current.setOnCloseToast(stale);
      result.current.setOnCloseToast(latest);
      result.current.toastHandlers.toastSuccess('Deleted');
    });

    act(() => result.current.clearToast(result.current.toasts[0].id));

    expect(latest).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });

  it('runs every pending callback once when all toasts are cleared', () => {
    const { result } = renderProvider();
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();

    act(() => {
      result.current.setOnCloseToast(onCloseA);
      result.current.toastHandlers.toastInfo('A');
      result.current.setOnCloseToast(onCloseB);
      result.current.toastHandlers.toastInfo('B');
    });

    act(() => result.current.clearToast());
    act(() => result.current.clearToast());

    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).toHaveBeenCalledTimes(1);
    expect(result.current.toasts).toEqual([]);
  });

  it('drops the callbacks of pending toasts, also older versions, when the page that set them unmounts', () => {
    const { result } = renderProvider();
    const onCloseV1 = vi.fn();
    const onCloseV2 = vi.fn();

    act(() => {
      result.current.setOnCloseToast(onCloseV1);
      result.current.toastHandlers.toastSuccess('First');
      result.current.setOnCloseToast(onCloseV2);
      result.current.toastHandlers.toastSuccess('Second');
      // What useToast does when the page unmounts.
      result.current.setOnCloseToast(undefined);
    });

    act(() => result.current.clearToast());

    expect(onCloseV1).not.toHaveBeenCalled();
    expect(onCloseV2).not.toHaveBeenCalled();
  });

  it('keeps at most MAX_TOASTS toasts and drops the oldest, running its callback once', () => {
    const { result } = renderProvider();
    const onClose = vi.fn();

    act(() => {
      result.current.setOnCloseToast(onClose);
      for (let index = 1; index <= MAX_TOASTS + 1; index += 1) {
        result.current.toastHandlers.toastInfo(`Toast ${index}`);
      }
    });

    expect(result.current.toasts).toHaveLength(MAX_TOASTS);
    expect(result.current.toasts[0].message).toBe('Toast 2');
    expect(result.current.toasts.at(-1).message).toBe(`Toast ${MAX_TOASTS + 1}`);
    expect(onClose).toHaveBeenCalledTimes(1);
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
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import { cleanup, renderHook } from '@testing-library/react';

import { useToastHandlers } from '../useToastHandlers.hooks';

const makeContext = () => ({
  toastHandlers: { toastError: vi.fn(), toastSuccess: vi.fn(), toastInfo: vi.fn(), toastWarning: vi.fn() },
  setTopPosition: vi.fn(),
  setIcon: vi.fn(),
});

describe('useToastHandlers', () => {
  afterEach(() => cleanup());

  it('returns the toast functions without touching the page toast position, also when unmounted', () => {
    const context = makeContext();
    const wrapper = ({ children }) => (
      <ToastContext.Provider value={context}>{children}</ToastContext.Provider>
    );

    const { result, unmount } = renderHook(() => useToastHandlers(), { wrapper });
    result.current.toastError('Failed');
    unmount();

    expect(result.current).toBe(context.toastHandlers);
    expect(context.toastHandlers.toastError).toHaveBeenCalledWith('Failed');
    expect(context.setTopPosition).not.toHaveBeenCalled();
    expect(context.setIcon).not.toHaveBeenCalled();
  });
});

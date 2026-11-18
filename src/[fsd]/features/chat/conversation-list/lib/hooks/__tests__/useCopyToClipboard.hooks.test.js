// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useCopyToClipboard } from '../useCopyToClipboard.hooks';

const toastInfo = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastInfo, toastError }),
}));

const writeText = vi.fn();

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  it('reports the copy only after the clipboard took it', async () => {
    writeText.mockResolvedValue();
    const { result } = renderHook(() => useCopyToClipboard());
    await act(() => result.current('secret123', 'Password copied'));
    expect(writeText).toHaveBeenCalledWith('secret123');
    expect(toastInfo).toHaveBeenCalledWith('Password copied');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('reports a failure when the clipboard refuses', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useCopyToClipboard());
    await act(() => result.current('secret123', 'Password copied'));
    expect(toastInfo).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('Failed to copy to the clipboard.');
  });
});

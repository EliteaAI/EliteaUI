// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useNow } from '../useNow.hooks';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time and renews it every minute', () => {
    const { result } = renderHook(() => useNow());
    const start = result.current;
    expect(start).toBe(Date.now());

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe(start + 60_000);
  });

  it('stops the timer when the component unmounts', () => {
    const { unmount } = renderHook(() => useNow());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

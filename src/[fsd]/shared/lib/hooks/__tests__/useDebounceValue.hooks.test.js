// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useDebounceValue } from '../useDebounceValue.hooks.js';

const DELAY = 500;

const renderDebounce = initialProps =>
  renderHook(({ value, isImmediate }) => useDebounceValue(value, DELAY, { isImmediate }), { initialProps });

describe('useDebounceValue', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('returns a new value only after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounceValue(value, DELAY), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(DELAY - 1));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('returns the live value at once while it is immediate', () => {
    const { result, rerender } = renderDebounce({ value: 'a', isImmediate: false });

    rerender({ value: 'ab', isImmediate: true });

    expect(result.current).toBe('ab');
  });

  it('starts from the value it had while immediate once debouncing resumes', () => {
    const { result, rerender } = renderDebounce({ value: 'a', isImmediate: false });
    rerender({ value: 'ab', isImmediate: false });
    rerender({ value: 'ab', isImmediate: true });

    rerender({ value: 'ab', isImmediate: false });
    expect(result.current).toBe('ab');

    rerender({ value: 'abc', isImmediate: false });
    expect(result.current).toBe('ab');
    act(() => vi.advanceTimersByTime(DELAY));
    expect(result.current).toBe('abc');
  });
});

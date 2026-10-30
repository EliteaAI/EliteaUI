// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useCheckViewScrollHorizontally } from '../useCheckViewScrollHorizontally.hooks';

let resizeObserverCallback;
let observeMock;
let disconnectMock;

beforeEach(() => {
  vi.useFakeTimers();
  observeMock = vi.fn();
  disconnectMock = vi.fn();
  class MockResizeObserver {
    constructor(callback) {
      resizeObserverCallback = callback;
    }
    observe = observeMock;
    disconnect = disconnectMock;
  }
  window.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const attachRef = (result, overrides = {}) => {
  const node = {
    scrollWidth: 100,
    clientWidth: 100,
    ...overrides,
  };
  act(() => result.current.viewRef(node));
  return node;
};

describe('useCheckViewScrollHorizontally', () => {
  it('returns isScrollable false before ref is assigned', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    expect(result.current.isScrollable).toBe(false);
  });

  it('returns isScrollable false when content fits', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    attachRef(result, { scrollWidth: 80, clientWidth: 100 });
    expect(result.current.isScrollable).toBe(false);
  });

  it('returns isScrollable true when content overflows', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    attachRef(result, { scrollWidth: 150, clientWidth: 100 });
    expect(result.current.isScrollable).toBe(true);
  });

  it('updates isScrollable when the element resizes from fitting to overflowing', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    const node = attachRef(result, { scrollWidth: 80, clientWidth: 100 });
    expect(result.current.isScrollable).toBe(false);

    node.scrollWidth = 150;
    act(() => {
      resizeObserverCallback();
      vi.runAllTimers();
    });

    expect(result.current.isScrollable).toBe(true);
  });

  it('updates isScrollable when the element resizes from overflowing to fitting', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    const node = attachRef(result, { scrollWidth: 150, clientWidth: 100 });
    expect(result.current.isScrollable).toBe(true);

    node.scrollWidth = 80;
    act(() => {
      resizeObserverCallback();
      vi.runAllTimers();
    });

    expect(result.current.isScrollable).toBe(false);
  });

  it('updates isScrollable on window resize', () => {
    const { result } = renderHook(() => useCheckViewScrollHorizontally());
    const node = attachRef(result, { scrollWidth: 80, clientWidth: 100 });
    expect(result.current.isScrollable).toBe(false);

    node.scrollWidth = 150;
    act(() => window.dispatchEvent(new Event('resize')));

    expect(result.current.isScrollable).toBe(true);
  });

  it('does not set up the observer before ref is assigned', () => {
    renderHook(() => useCheckViewScrollHorizontally());
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('disconnects the observer and removes the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useCheckViewScrollHorizontally());
    attachRef(result, { scrollWidth: 80, clientWidth: 100 });

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

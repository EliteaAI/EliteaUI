// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useCanvasMinimapPref } from '../useCanvasMinimapPref.hooks';

const STORAGE_KEY = 'elitea_ui.pipeline.minimap';

describe('useCanvasMinimapPref', () => {
  beforeEach(() => {
    // Node 22+ experimental Web Storage defines localStorage as undefined when
    // --localstorage-file is not provided, shadowing jsdom's implementation.
    vi.stubGlobal('localStorage', {
      store: {},
      getItem(key) {
        return this.store[key] ?? null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
      removeItem(key) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    });
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hides the minimap by default', () => {
    const { result } = renderHook(() => useCanvasMinimapPref());

    expect(result.current.isMinimapVisible).toBe(false);
  });

  it('remembers the choice for the next canvas', () => {
    const { result } = renderHook(() => useCanvasMinimapPref());

    act(() => result.current.toggleMinimap());

    expect(result.current.isMinimapVisible).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    expect(renderHook(() => useCanvasMinimapPref()).result.current.isMinimapVisible).toBe(true);
  });
});

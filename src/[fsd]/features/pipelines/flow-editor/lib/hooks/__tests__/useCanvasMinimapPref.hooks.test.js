// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useCanvasMinimapPref } from '../useCanvasMinimapPref.hooks';

const STORAGE_KEY = 'elitea_ui.pipeline.minimap';

describe('useCanvasMinimapPref', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

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

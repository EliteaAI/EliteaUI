// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 7 } }),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/hooks', async () => {
  const { useResizableDrawer } =
    await import('@/[fsd]/features/pipelines/flow-editor/lib/hooks/useResizableDrawer.hooks');
  return { useResizableDrawer };
});

const { getTestPanelMaxWidth, useTestPanelWidth } = await import('../useTestPanelWidth.hooks');
const { TEST_PANEL_STORAGE_KEY, TEST_PANEL_WIDTH } = await import('../../constants/testPanel.constants');

const STORAGE_KEY = `${TEST_PANEL_STORAGE_KEY}:7`;

const renderWidthHook = (workspaceWidth = 1600, onResized = vi.fn()) => {
  const workspaceRef = { current: { clientWidth: workspaceWidth } };
  const hook = renderHook(() => useTestPanelWidth({ workspaceRef, onResized }));
  hook.result.current.containerRef.current = document.createElement('div');
  return { ...hook, onResized };
};

const drag = (result, fromX, toX) => {
  act(() => {
    result.current.handleResizeStart({ preventDefault: vi.fn(), clientX: fromX });
  });
  act(() => {
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: toX }));
  });
  act(() => {
    document.dispatchEvent(new MouseEvent('mouseup'));
  });
};

describe('useTestPanelWidth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Node 22 experimental Web Storage defines localStorage as undefined when
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

  it('starts at the default width', () => {
    const { result } = renderWidthHook();
    expect(result.current.width).toBe(TEST_PANEL_WIDTH.DEFAULT);
  });

  it('restores the width stored for this user', () => {
    localStorage.setItem(STORAGE_KEY, '450');
    const { result } = renderWidthHook();
    expect(result.current.width).toBe(450);
  });

  it('ignores a stored width below the minimum', () => {
    localStorage.setItem(STORAGE_KEY, '100');
    const { result } = renderWidthHook();
    expect(result.current.width).toBe(TEST_PANEL_WIDTH.DEFAULT);
  });

  it('clamps a stored width to half of the current editor', () => {
    localStorage.setItem(STORAGE_KEY, '900');
    const { result } = renderWidthHook(1000);
    expect(result.current.width).toBe(500);
  });

  it('drops the inline drag width once the drag ends', () => {
    const { result } = renderWidthHook(1600);

    drag(result, 1000, 900);

    expect(result.current.containerRef.current.style.width).toBe('');
  });

  it('persists the width and re-fits the canvas when a drag ends', () => {
    const { result, onResized } = renderWidthHook(1600);

    // Dragging left widens the panel
    drag(result, 1000, 900);

    expect(result.current.width).toBe(TEST_PANEL_WIDTH.DEFAULT + 100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(TEST_PANEL_WIDTH.DEFAULT + 100));
    expect(onResized).toHaveBeenCalledTimes(1);
  });

  it('clamps the width between the minimum and half of the workspace', () => {
    const { result } = renderWidthHook(1000);

    drag(result, 1000, 0);
    expect(result.current.width).toBe(500);

    drag(result, 0, 2000);
    expect(result.current.width).toBe(TEST_PANEL_WIDTH.MIN);
  });

  it('works when localStorage throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderWidthHook();
    expect(result.current.width).toBe(TEST_PANEL_WIDTH.DEFAULT);
    expect(() => drag(result, 1000, 950)).not.toThrow();
  });
});

describe('getTestPanelMaxWidth', () => {
  it('is half of the workspace but never below the minimum', () => {
    expect(getTestPanelMaxWidth(1600)).toBe(800);
    expect(getTestPanelMaxWidth(400)).toBe(TEST_PANEL_WIDTH.MIN);
  });
});

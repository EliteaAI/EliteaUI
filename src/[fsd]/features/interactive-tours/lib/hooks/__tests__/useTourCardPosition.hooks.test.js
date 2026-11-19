// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { useTourCardPosition } from '../useTourCardPosition.hooks';

const VIEWPORT_HEIGHT = 860;

const mountTarget = rect => {
  const el = document.createElement('div');
  el.id = 'tour-target';
  el.getBoundingClientRect = () => ({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  });
  el.scrollIntoView = vi.fn();
  document.body.appendChild(el);
};

describe('useTourCardPosition — right placement', () => {
  beforeEach(() => {
    window.innerWidth = 1512;
    window.innerHeight = VIEWPORT_HEIGHT;
    vi.stubGlobal('requestAnimationFrame', fn => setTimeout(fn, 0));
    vi.stubGlobal('cancelAnimationFrame', id => clearTimeout(id));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('keeps a long card inside the window below a target that starts low (the menu chat list)', async () => {
    mountTarget({ top: 250, left: 8, width: 272, height: 560 });

    const { result } = renderHook(() => useTourCardPosition({ target: '#tour-target', placement: 'right' }));

    await waitFor(() => expect(result.current.targetInfo).not.toBeNull());
    expect(result.current.cardPositionSx).toEqual({ top: 250, left: 298 });
    // 860 - 250 - 16 margin - 136 card chrome
    expect(result.current.cardBodySx).toEqual({ maxHeight: '458px' });
  });

  it('bottom-aligns near the window bottom and still caps the body', async () => {
    mountTarget({ top: 700, left: 8, width: 272, height: 100 });

    const { result } = renderHook(() => useTourCardPosition({ target: '#tour-target', placement: 'right' }));

    await waitFor(() => expect(result.current.targetInfo).not.toBeNull());
    expect(result.current.cardPositionSx).toEqual({ bottom: 60, left: 298 });
    // 860 - 60 - 16 margin - 136 card chrome
    expect(result.current.cardBodySx).toEqual({ maxHeight: '648px' });
  });
});

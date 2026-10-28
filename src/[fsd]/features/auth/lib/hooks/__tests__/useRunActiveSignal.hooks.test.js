// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

const dispatch = vi.fn();

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));
vi.mock('@/slices/settings', () => ({
  actions: {
    runActiveStarted: () => ({ type: 'settings/runActiveStarted' }),
    runActiveEnded: () => ({ type: 'settings/runActiveEnded' }),
  },
}));

const { useRunActiveSignal } = await import('../useRunActiveSignal.hooks');

const types = () => dispatch.mock.calls.map(([action]) => action.type);

describe('useRunActiveSignal', () => {
  afterEach(() => {
    cleanup();
    dispatch.mockClear();
  });

  it('says nothing while no run is active', () => {
    renderHook(() => useRunActiveSignal(false));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('counts a run in while it is active and out when it ends', () => {
    const { rerender } = renderHook(({ active }) => useRunActiveSignal(active), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    expect(types()).toEqual(['settings/runActiveStarted']);

    rerender({ active: false });
    expect(types()).toEqual(['settings/runActiveStarted', 'settings/runActiveEnded']);
  });

  it('counts the run out when the surface goes away mid-run, so it cannot pin the socket', () => {
    const { unmount } = renderHook(() => useRunActiveSignal(true));

    unmount();

    expect(types()).toEqual(['settings/runActiveStarted', 'settings/runActiveEnded']);
  });

  it('does not count the same run twice across re-renders', () => {
    const { rerender } = renderHook(({ active }) => useRunActiveSignal(active), {
      initialProps: { active: true },
    });

    rerender({ active: true });
    rerender({ active: true });

    expect(types()).toEqual(['settings/runActiveStarted']);
  });
});

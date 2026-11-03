// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const location = { state: null };

vi.mock('react-router-dom', () => ({
  useLocation: () => location,
}));

const { useEntityTestPanel } = await import('../useEntityTestPanel.hooks');

describe('useEntityTestPanel', () => {
  beforeEach(() => {
    location.state = null;
  });
  afterEach(() => cleanup());

  it('starts closed', () => {
    const { result } = renderHook(() => useEntityTestPanel());

    expect(result.current.isOpen).toBe(false);
  });

  it('starts open when a Run History restore is pending', () => {
    location.state = { restoredConversationID: 42 };
    const { result } = renderHook(() => useEntityTestPanel());

    expect(result.current.isOpen).toBe(true);
  });

  it('opens and closes on demand', () => {
    const { result } = renderHook(() => useEntityTestPanel());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});

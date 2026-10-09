// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useFocusRunInput } from '../useFocusRunInput.hooks';

const buildContainer = () => {
  const container = document.createElement('div');
  const input = document.createElement('textarea');
  container.appendChild(input);
  document.body.appendChild(container);
  container.scrollIntoView = vi.fn();
  return { containerRef: { current: container }, input };
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('useFocusRunInput', () => {
  it('waits for the run input to exist before focusing it', () => {
    const { containerRef, input } = buildContainer();
    const onFocusHandled = vi.fn();
    const { rerender } = renderHook(props => useFocusRunInput(props), {
      initialProps: { containerRef, focusRequest: 1, isReady: false, onFocusHandled },
    });
    expect(onFocusHandled).not.toHaveBeenCalled();

    rerender({ containerRef, focusRequest: 1, isReady: true, onFocusHandled });

    expect(document.activeElement).toBe(input);
    expect(containerRef.current.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(onFocusHandled).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a pending request, so remounts do not scroll the page again', () => {
    const { containerRef } = buildContainer();
    const onFocusHandled = vi.fn();
    renderHook(() => useFocusRunInput({ containerRef, focusRequest: 0, isReady: true, onFocusHandled }));
    expect(containerRef.current.scrollIntoView).not.toHaveBeenCalled();
    expect(onFocusHandled).not.toHaveBeenCalled();
  });
});

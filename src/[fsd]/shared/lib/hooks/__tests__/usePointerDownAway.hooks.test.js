// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { usePointerDownAway } from '../usePointerDownAway.hooks';

describe('usePointerDownAway', () => {
  let anchor;
  let content;
  let outside;
  let dialogChild;

  beforeEach(() => {
    anchor = document.createElement('button');
    content = document.createElement('div');
    outside = document.createElement('button');
    const dialog = document.createElement('div');
    dialog.classList.add('MuiDialog-root');
    dialogChild = document.createElement('button');
    dialog.append(dialogChild);
    document.body.append(anchor, content, outside, dialog);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const renderAway = ({ open = true, onAway = vi.fn() } = {}) => {
    const contentRef = { current: content };
    renderHook(() => usePointerDownAway({ open, anchorEl: anchor, contentRef, onAway }));
    return onAway;
  };

  it('calls onAway for a press outside even when the click itself is stopped', () => {
    const onAway = renderAway();
    outside.addEventListener('click', event => event.stopPropagation());

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    outside.click();

    expect(onAway).toHaveBeenCalledTimes(1);
  });

  it('ignores presses inside the content, on the anchor, and inside a modal', () => {
    const onAway = renderAway();

    content.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    anchor.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    dialogChild.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onAway).not.toHaveBeenCalled();
  });

  it('does nothing while closed', () => {
    const onAway = renderAway({ open: false });

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onAway).not.toHaveBeenCalled();
  });

  it('stops listening once closed', () => {
    const onAway = vi.fn();
    const contentRef = { current: content };
    const { rerender } = renderHook(
      ({ open }) => usePointerDownAway({ open, anchorEl: anchor, contentRef, onAway }),
      { initialProps: { open: true } },
    );

    rerender({ open: false });
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onAway).not.toHaveBeenCalled();
  });
});

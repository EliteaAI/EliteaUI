// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useDropdownAwareModalClose } from '../useDropdownAwareModalClose.hooks.js';

// jsdom has no layout, so visibility is driven by stubbing getClientRects per element
const makeElement = (className, { visible = true } = {}) => {
  const element = document.createElement('div');
  element.className = className;
  element.getClientRects = () => (visible ? [{}] : []);
  return element;
};

const setup = ({ expanded = false, popperVisible = true } = {}) => {
  const scope = document.createElement('div');
  scope.appendChild(makeElement(`MuiAutocomplete-root${expanded ? ' Mui-expanded' : ''}`));
  document.body.appendChild(scope);
  // MUI portals the popper to body, outside the modal content
  document.body.appendChild(makeElement('MuiAutocomplete-popper', { visible: popperVisible }));

  const onClose = vi.fn();
  const { result } = renderHook(() => useDropdownAwareModalClose(true, onClose));
  result.current.scopeRef.current = scope;

  return { result, onClose };
};

const pressOutside = () => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

describe('useDropdownAwareModalClose', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('ignores the first backdrop click while the dropdown is open, then closes', () => {
    const { result, onClose } = setup({ expanded: true });

    pressOutside();
    result.current.handleClose({}, 'backdropClick');
    expect(onClose).not.toHaveBeenCalled();

    result.current.handleClose({}, 'backdropClick');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a backdrop click when no dropdown is open', () => {
    const { result, onClose } = setup({ expanded: false });

    pressOutside();
    result.current.handleClose({}, 'backdropClick');

    expect(onClose).toHaveBeenCalledWith({}, 'backdropClick');
  });

  it('closes when the expanded autocomplete has nothing visible to show', () => {
    const { result, onClose } = setup({ expanded: true, popperVisible: false });

    pressOutside();
    result.current.handleClose({}, 'backdropClick');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('always closes from the close button or Escape, even with the dropdown open', () => {
    const { result, onClose } = setup({ expanded: true });

    pressOutside();
    result.current.handleClose({}, 'escapeKeyDown');
    result.current.handleClose();

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

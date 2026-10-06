import { useCallback, useEffect, useRef } from 'react';

// MUI marks an Autocomplete root with `Mui-expanded` while its popup is open
const EXPANDED_AUTOCOMPLETE_SELECTOR = '.MuiAutocomplete-root.Mui-expanded';
const DROPDOWN_POPPER_SELECTOR = '.MuiAutocomplete-popper';

const isElementVisible = element => element.getClientRects().length > 0;

/**
 * Wraps a modal `onClose` so that a backdrop click made while an autocomplete dropdown is open
 * only collapses the dropdown and keeps the modal open. A second click outside closes the modal.
 *
 * Autocomplete closes on blur (mousedown), so by the time the backdrop "click" reaches the dialog
 * the dropdown is already gone — its state is therefore snapshotted on mousedown.
 *
 * Attach the returned `scopeRef` to the modal content: only autocompletes inside it count, so a
 * dropdown open elsewhere on the page never blocks this modal from closing. The popper itself is
 * portaled to `body`, so "open" also requires a visible popper — an expanded autocomplete with
 * nothing to show (e.g. a free-solo field with no matches) does not swallow the click.
 */
export const useDropdownAwareModalClose = (open, onClose) => {
  const scopeRef = useRef(null);
  const wasDropdownOpenOnMouseDownRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = () => {
      const hasExpandedAutocomplete = !!scopeRef.current?.querySelector(EXPANDED_AUTOCOMPLETE_SELECTOR);
      wasDropdownOpenOnMouseDownRef.current =
        hasExpandedAutocomplete &&
        Array.from(document.querySelectorAll(DROPDOWN_POPPER_SELECTOR)).some(isElementVisible);
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [open]);

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === 'backdropClick' && wasDropdownOpenOnMouseDownRef.current) {
        wasDropdownOpenOnMouseDownRef.current = false;
        return;
      }

      onClose?.(event, reason);
    },
    [onClose],
  );

  return { handleClose, scopeRef };
};

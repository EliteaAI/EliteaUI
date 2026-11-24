import { useEffect } from 'react';

import { isInsideModal } from '../helpers/popper.helpers';

/**
 * Closes a popper when a press lands outside it.
 *
 * Listens for pointerdown in the capture phase, which runs before any click handler. A click whose propagation is
 * stopped (such as a row's "⋮" menu) never reaches a click-away listener, so the popper would stay open above the
 * window that click opens. The anchor is ignored so its own click handler can toggle the popper, and presses inside
 * a modal are ignored so a dialog opened from the popper keeps working.
 *
 * `anchorEl` and `onAway` should be stable between renders, because they are re-subscribed when they change.
 */
export const usePointerDownAway = ({ open, anchorEl, contentRef, onAway }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = event => {
      const { target } = event;

      if (contentRef?.current?.contains(target) || anchorEl?.contains(target) || isInsideModal(target))
        return;

      onAway?.(event);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, anchorEl, contentRef, onAway]);
};

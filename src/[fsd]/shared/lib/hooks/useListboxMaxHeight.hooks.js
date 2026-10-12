import { useEffect, useState } from 'react';

import { getListboxMaxHeight } from '../helpers/autocomplete.helpers.js';

/**
 * Tracks the free viewport space below an anchor while its dropdown is open and returns the height
 * (px) the listbox can take. Returns `null` while the dropdown is closed or there is no anchor.
 * The anchor is passed as a ref and resolved when the dropdown opens.
 */
export const useListboxMaxHeight = (anchorRef, open) => {
  const [maxHeight, setMaxHeight] = useState(null);

  useEffect(() => {
    const anchorEl = anchorRef?.current;

    if (!open || !anchorEl) {
      setMaxHeight(null);
      return undefined;
    }

    const update = () => {
      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

      setMaxHeight(getListboxMaxHeight(anchorEl.getBoundingClientRect(), window.innerHeight, remPx));
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchorEl);
    window.addEventListener('resize', update);
    // Capture phase: also fires for scrolling of any ancestor container (e.g. the modal body)
    window.addEventListener('scroll', update, { capture: true, passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true });
    };
  }, [anchorRef, open]);

  return maxHeight;
};

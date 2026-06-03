import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const DEFAULT_POPOVER_POSITION = {
  anchorReference: 'anchorEl',
  anchorOrigin: {
    vertical: 'top',
    horizontal: 'right',
  },
  transformOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  anchorPosition: null,
};

const POPOVER_VIEWPORT_MARGIN = 16;

export const useNotificationPopoverPosition = anchorEl => {
  const [paperEl, setPaperEl] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(DEFAULT_POPOVER_POSITION);

  const popoverPaperRef = useCallback(el => setPaperEl(el), []);

  const updatePopoverPosition = useCallback(() => {
    if (!anchorEl || !paperEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const paperHeight = paperEl.offsetHeight;
    if (!paperHeight) return;

    const spaceAbove = anchorRect.top - POPOVER_VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - anchorRect.bottom - POPOVER_VIEWPORT_MARGIN;
    const fitsBelow = spaceBelow >= paperHeight;
    const fitsAbove = spaceAbove >= paperHeight;

    if (fitsBelow) {
      setPopoverPosition({
        anchorReference: 'anchorEl',
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
        anchorPosition: null,
      });
      return;
    }

    if (fitsAbove) {
      setPopoverPosition(DEFAULT_POPOVER_POSITION);
      return;
    }

    const paperTop = Math.round(Math.max(POPOVER_VIEWPORT_MARGIN, (window.innerHeight - paperHeight) / 2));

    setPopoverPosition({
      anchorReference: 'anchorPosition',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      anchorPosition: {
        top: paperTop,
        left: Math.round(anchorRect.right),
      },
      transformOrigin: {
        vertical: 'top',
        horizontal: 'left',
      },
    });
  }, [anchorEl, paperEl]);

  useEffect(() => {
    if (!anchorEl) {
      setPopoverPosition(DEFAULT_POPOVER_POSITION);
    }
  }, [anchorEl]);

  useLayoutEffect(() => {
    if (!anchorEl || !paperEl) return undefined;

    updatePopoverPosition();

    const frameId = window.requestAnimationFrame(() => {
      updatePopoverPosition();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [anchorEl, paperEl, updatePopoverPosition]);

  useEffect(() => {
    if (!anchorEl || !paperEl) return undefined;

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);

    const observer = new ResizeObserver(updatePopoverPosition);
    observer.observe(paperEl);

    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      observer.disconnect();
    };
  }, [anchorEl, paperEl, updatePopoverPosition]);

  return {
    popoverPaperRef,
    popoverPosition,
  };
};

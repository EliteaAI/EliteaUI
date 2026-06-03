import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

const POPOVER_VERTICAL_OFFSET = 120;
const POPOVER_VIEWPORT_MARGIN = 16;

export const useNotificationPopoverPosition = anchorEl => {
  const popoverPaperRef = useRef(null);
  const [popoverPosition, setPopoverPosition] = useState(DEFAULT_POPOVER_POSITION);

  const updatePopoverPosition = useCallback(() => {
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const paperHeight = popoverPaperRef.current?.offsetHeight ?? 0;
    const desiredHeight = paperHeight || Math.max(window.innerHeight - POPOVER_VERTICAL_OFFSET, 0);
    const spaceAbove = anchorRect.top - POPOVER_VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - anchorRect.bottom - POPOVER_VIEWPORT_MARGIN;
    const isShortPopover = paperHeight > 0 && paperHeight <= window.innerHeight / 2;

    if (isShortPopover) {
      if (spaceBelow >= paperHeight || spaceBelow > spaceAbove) {
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

      setPopoverPosition(DEFAULT_POPOVER_POSITION);
      return;
    }

    if (spaceBelow >= desiredHeight) {
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

    if (spaceAbove >= desiredHeight) {
      setPopoverPosition(DEFAULT_POPOVER_POSITION);
      return;
    }

    const viewportCenterTop = Math.round(window.innerHeight / 2);
    const minCenterTop = Math.round(desiredHeight / 2) + POPOVER_VIEWPORT_MARGIN;
    const maxCenterTop = Math.round(window.innerHeight - desiredHeight / 2) - POPOVER_VIEWPORT_MARGIN;
    const clampedTop = Math.min(
      Math.max(viewportCenterTop, minCenterTop),
      Math.max(minCenterTop, maxCenterTop),
    );

    setPopoverPosition({
      anchorReference: 'anchorPosition',
      anchorOrigin: {
        vertical: 'center',
        horizontal: 'right',
      },
      anchorPosition: {
        top: clampedTop,
        left: Math.round(anchorRect.right),
      },
      transformOrigin: {
        vertical: 'center',
        horizontal: 'left',
      },
    });
  }, [anchorEl]);

  useEffect(() => {
    if (!anchorEl) {
      setPopoverPosition(DEFAULT_POPOVER_POSITION);
      return;
    }

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);

    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [anchorEl, updatePopoverPosition]);

  useLayoutEffect(() => {
    if (!anchorEl) return undefined;

    updatePopoverPosition();

    const frameId = window.requestAnimationFrame(() => {
      updatePopoverPosition();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [anchorEl, updatePopoverPosition]);

  return {
    popoverPaperRef,
    popoverPosition,
  };
};

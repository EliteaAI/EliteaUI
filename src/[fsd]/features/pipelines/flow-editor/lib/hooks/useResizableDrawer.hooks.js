import { useCallback, useEffect, useRef, useState } from 'react';

import { StateDrawerConstants } from '../constants';

/**
 * Custom hook for handling drawer resize functionality
 */
export const useResizableDrawer = (
  minWidth = StateDrawerConstants.MIN_DRAWER_WIDTH,
  maxWidth = StateDrawerConstants.MAX_DRAWER_WIDTH,
  initialWidth = StateDrawerConstants.MIN_DRAWER_WIDTH,
) => {
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);
  const containerRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingWidthRef = useRef(null);

  const [drawerWidth, setDrawerWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  const handleResizeStart = useCallback(
    e => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = drawerWidth;
    },
    [drawerWidth],
  );

  // Handle resize move with RAF throttling
  const handleResizeMove = useCallback(
    e => {
      if (!isResizing || !containerRef.current) return;

      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + deltaX));

      // Update DOM directly for immediate visual feedback
      containerRef.current.style.width = `${newWidth}px`;

      // Store pending width for throttled state update
      pendingWidthRef.current = newWidth;

      // Throttle state updates using requestAnimationFrame to reduce re-renders
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (pendingWidthRef.current !== null) {
            setDrawerWidth(pendingWidthRef.current);
            pendingWidthRef.current = null;
          }
          rafIdRef.current = null;
        });
      }
    },
    [isResizing, minWidth, maxWidth],
  );

  const handleResizeEnd = useCallback(() => {
    // Cancel any pending RAF updates
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Set final width from DOM to ensure state matches visual state
    if (containerRef.current && pendingWidthRef.current !== null) {
      setDrawerWidth(pendingWidthRef.current);
      pendingWidthRef.current = null;
    }

    setIsResizing(false);
  }, []);

  // Add and remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    drawerWidth,
    isResizing,
    isHoveringHandle,
    setIsHoveringHandle,
    handleResizeStart,
  };
};

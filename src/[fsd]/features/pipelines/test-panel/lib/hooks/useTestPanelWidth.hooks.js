import { useCallback, useEffect, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { useResizableDrawer } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';

import { TEST_PANEL_STORAGE_KEY, TEST_PANEL_WIDTH } from '../constants/testPanel.constants';

const readStoredWidth = storageKey => {
  try {
    const stored = Number(localStorage.getItem(storageKey));
    return Number.isFinite(stored) && stored >= TEST_PANEL_WIDTH.MIN ? stored : TEST_PANEL_WIDTH.DEFAULT;
  } catch {
    return TEST_PANEL_WIDTH.DEFAULT;
  }
};

const writeStoredWidth = (storageKey, width) => {
  try {
    localStorage.setItem(storageKey, String(Math.round(width)));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the width just isn't remembered
  }
};

export const getTestPanelMaxWidth = containerWidth =>
  Math.max(TEST_PANEL_WIDTH.MIN, Math.floor((containerWidth || 0) * TEST_PANEL_WIDTH.MAX_RATIO));

/**
 * Resizable Test panel width, remembered per user in this browser.
 * `workspaceRef` is the element the 50% max is measured against.
 */
export const useTestPanelWidth = ({ workspaceRef, onResized } = {}) => {
  const userId = useSelector(state => state.user?.id);
  const storageKey = `${TEST_PANEL_STORAGE_KEY}:${userId ?? 'anonymous'}`;

  const [initialWidth] = useState(() => readStoredWidth(storageKey));
  const [maxWidth, setMaxWidth] = useState(() => getTestPanelMaxWidth(window.innerWidth));

  const {
    containerRef,
    drawerWidth,
    setDrawerWidth,
    isResizing,
    isHoveringHandle,
    setIsHoveringHandle,
    handleResizeStart,
  } = useResizableDrawer(TEST_PANEL_WIDTH.MIN, maxWidth, initialWidth);

  // Keep the width within 50% of the editor, so a width stored on a wider screen can't start a drag
  // from beyond the visible (CSS-capped) size
  const syncMaxWidth = useCallback(() => {
    const max = getTestPanelMaxWidth(workspaceRef?.current?.clientWidth || window.innerWidth);
    setMaxWidth(max);
    setDrawerWidth(width => Math.min(width, max));
  }, [setDrawerWidth, workspaceRef]);

  useEffect(() => {
    syncMaxWidth();
    const workspaceEl = workspaceRef?.current;
    if (typeof ResizeObserver === 'undefined' || !workspaceEl) {
      window.addEventListener('resize', syncMaxWidth);
      return () => window.removeEventListener('resize', syncMaxWidth);
    }
    const observer = new ResizeObserver(syncMaxWidth);
    observer.observe(workspaceEl);
    return () => observer.disconnect();
  }, [syncMaxWidth, workspaceRef]);

  const wasResizingRef = useRef(false);
  useEffect(() => {
    if (isResizing) {
      wasResizingRef.current = true;
      return;
    }
    if (wasResizingRef.current) {
      wasResizingRef.current = false;
      // The drag writes an inline px width; drop it so `sx` (incl. full width on small windows) applies again
      if (containerRef.current) containerRef.current.style.width = '';
      writeStoredWidth(storageKey, drawerWidth);
      onResized?.();
    }
  }, [isResizing, drawerWidth, storageKey, onResized, containerRef]);

  return {
    containerRef,
    width: drawerWidth,
    isResizing,
    isHoveringHandle,
    setIsHoveringHandle,
    handleResizeStart,
  };
};

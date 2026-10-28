import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'elitea_ui.pipeline.minimap';

const readStoredValue = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Minimap visibility, remembered per user (browser). Hidden by default. */
export const useCanvasMinimapPref = () => {
  const [isMinimapVisible, setIsMinimapVisible] = useState(readStoredValue);
  // Only a user toggle is stored; opening a canvas leaves the stored choice alone
  const hasToggledRef = useRef(false);

  useEffect(() => {
    if (!hasToggledRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isMinimapVisible));
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this session
    }
  }, [isMinimapVisible]);

  const toggleMinimap = useCallback(() => {
    hasToggledRef.current = true;
    setIsMinimapVisible(prev => !prev);
  }, []);

  return { isMinimapVisible, toggleMinimap };
};

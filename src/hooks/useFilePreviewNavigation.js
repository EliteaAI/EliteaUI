import { useCallback, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

/**
 * Hook to manage navigation warnings when file preview is active
 */
export const useFilePreviewNavigation = () => {
  const [isPreviewingFile, setIsPreviewingFile] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const navigate = useNavigate();
  const originalNavigateRef = useRef(navigate);

  // Store the pending navigation details
  const handleNavigationAttempt = useCallback(
    (navFunction, ...args) => {
      if (isPreviewingFile) {
        // Store the navigation details to execute later if confirmed
        setPendingNavigation({ navFunction, args });
        setShowNavigationWarning(true);
        return false; // Block navigation
      } else {
        // Allow navigation if not previewing
        navFunction(...args);
        return true;
      }
    },
    [isPreviewingFile],
  );

  // Handle cancelling navigation
  const handleCancelNavigation = useCallback(() => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  }, []);

  // Handle confirming navigation
  const handleConfirmNavigation = useCallback(() => {
    setShowNavigationWarning(false);

    // Close preview first
    setIsPreviewingFile(false);

    // Execute the pending navigation
    if (pendingNavigation) {
      const { navFunction, args } = pendingNavigation;
      setPendingNavigation(null);

      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        navFunction(...args);
      }, 0);
    }
  }, [pendingNavigation]);

  // Set preview state
  const setFilePreviewActive = useCallback(active => {
    setIsPreviewingFile(active);
  }, []);

  // Create an enhanced navigate function that checks preview state
  const enhancedNavigate = useCallback(
    (...args) => {
      return handleNavigationAttempt(originalNavigateRef.current, ...args);
    },
    [handleNavigationAttempt],
  );

  return {
    isPreviewingFile,
    showNavigationWarning,
    setFilePreviewActive,
    handleCancelNavigation,
    handleConfirmNavigation,
    enhancedNavigate,
    // Enhanced navigation function for components to use
    navigate: enhancedNavigate,
  };
};

export default useFilePreviewNavigation;

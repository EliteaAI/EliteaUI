import React, { createContext, useCallback, useContext, useState } from 'react';

import AlertDialog from '@/components/AlertDialog';

// Create the context
const FilePreviewNavigationContext = createContext();

// Provider component
export const FilePreviewNavigationProvider = ({ children }) => {
  const [isPreviewingFile, setIsPreviewingFile] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Set file preview state
  const setFilePreviewActive = useCallback(active => {
    setIsPreviewingFile(active);
  }, []);

  // Handle navigation attempt
  const checkNavigationAllowed = useCallback(
    navigationCallback => {
      if (isPreviewingFile) {
        // Store the navigation callback to execute later if confirmed
        setPendingNavigation(() => navigationCallback);
        setShowNavigationWarning(true);
        return false; // Block navigation
      } else {
        // Allow navigation if not previewing
        navigationCallback();
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

    // Close preview state
    setIsPreviewingFile(false);

    // Execute the pending navigation
    if (pendingNavigation) {
      const navigationCallback = pendingNavigation;
      setPendingNavigation(null);

      // Use setTimeout to ensure state updates are processed and preview is fully closed
      setTimeout(() => {
        navigationCallback();
      }, 150); // Increased timeout to ensure preview state is cleared
    }
  }, [pendingNavigation]);

  const contextValue = {
    isPreviewingFile,
    setFilePreviewActive,
    checkNavigationAllowed,
  };

  return (
    <FilePreviewNavigationContext.Provider value={contextValue}>
      {children}

      {/* Navigation Warning Dialog */}
      <AlertDialog
        title="Warning"
        alertContent="You are previewing file now. Are you sure you want to leave?"
        open={showNavigationWarning}
        onClose={handleCancelNavigation}
        onCancel={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        confirmButtonText="Confirm"
        alarm
      />
    </FilePreviewNavigationContext.Provider>
  );
};

// Hook to use the context
export const useFilePreviewNavigation = () => {
  const context = useContext(FilePreviewNavigationContext);
  if (!context) {
    throw new Error('useFilePreviewNavigation must be used within a FilePreviewNavigationProvider');
  }
  return context;
};

export default FilePreviewNavigationProvider;

import { memo, useCallback, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { FilePreviewNavigationContext } from '@/[fsd]/shared/lib/context/FilePreviewNavigationContext';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';

// Delay that lets the preview state clear before the postponed navigation runs
const PENDING_NAVIGATION_DELAY_MS = 150;

const FilePreviewNavigationProvider = memo(props => {
  const { children } = props;

  const [isPreviewingFile, setIsPreviewingFile] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const setFilePreviewActive = useCallback(active => {
    setIsPreviewingFile(active);
  }, []);

  // Runs the callback right away, or stores it and asks for confirmation while a file is previewed
  const checkNavigationAllowed = useCallback(
    navigationCallback => {
      if (isPreviewingFile) {
        setPendingNavigation(() => navigationCallback);
        setShowNavigationWarning(true);
        return false;
      }
      navigationCallback();
      return true;
    },
    [isPreviewingFile],
  );

  const handleCancelNavigation = useCallback(() => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  }, []);

  const handleConfirmNavigation = useCallback(() => {
    setShowNavigationWarning(false);
    setIsPreviewingFile(false);

    if (pendingNavigation) {
      const navigationCallback = pendingNavigation;
      setPendingNavigation(null);
      setTimeout(navigationCallback, PENDING_NAVIGATION_DELAY_MS);
    }
  }, [pendingNavigation]);

  const contextValue = useMemo(
    () => ({ isPreviewingFile, setFilePreviewActive, checkNavigationAllowed }),
    [isPreviewingFile, setFilePreviewActive, checkNavigationAllowed],
  );

  return (
    <FilePreviewNavigationContext.Provider value={contextValue}>
      {children}
      <BaseModal
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Warning"
        content={
          <Typography variant="bodyMedium">
            You are previewing file now. Are you sure you want to leave?
          </Typography>
        }
        open={showNavigationWarning}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        confirmButtonText="Confirm"
        alarm
        confirmButtonTestId="alert-dialog-confirm-button"
      />
    </FilePreviewNavigationContext.Provider>
  );
});

FilePreviewNavigationProvider.displayName = 'FilePreviewNavigationProvider';

export default FilePreviewNavigationProvider;

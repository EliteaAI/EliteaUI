import { useCallback, useState } from 'react';

import { CredentialWarningHelpers } from '@/[fsd]/entities/credential-warning/helpers';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';

export const useCredentialWarning = (props = {}) => {
  const {
    isCreating = false,
    editToolDetail,
    originalDetails,
    revertCredentialsRef,
    setEditToolDetail,
  } = props;
  const [showCredentialWarning, setShowCredentialWarning] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);

  const { isTeam: isTeamProject } = useProjectType();

  const onConfirmCredentialWarning = useCallback(() => {
    setShowCredentialWarning(false);
    if (pendingSaveAction) {
      pendingSaveAction();
      setPendingSaveAction(null);
    }
  }, [pendingSaveAction]);

  const onCloseCredentialWarning = useCallback(() => {
    setShowCredentialWarning(false);
    setPendingSaveAction(null);
  }, []);

  const onCancelCredentialWarning = useCallback(() => {
    setShowCredentialWarning(false);
    setPendingSaveAction(null);

    // Revert credentials in Formik values using ToolkitForm's revert function
    if (revertCredentialsRef?.current) {
      revertCredentialsRef.current();
    }

    // Also revert credential fields in editToolDetail state (for ToolkitEditor)
    if (setEditToolDetail && originalDetails && editToolDetail) {
      const reverted = CredentialWarningHelpers.revertCredentialFields(editToolDetail, originalDetails);
      setEditToolDetail(reverted);
    }
  }, [revertCredentialsRef, originalDetails, editToolDetail, setEditToolDetail]);

  const checkBeforeSave = useCallback(
    saveAction => {
      // Only check in edit mode (not creation) and for team projects
      if (
        !isCreating &&
        isTeamProject &&
        CredentialWarningHelpers.hasCredentialConfigChanged(editToolDetail, originalDetails)
      ) {
        setPendingSaveAction(() => saveAction);
        setShowCredentialWarning(true);
        return false; // Don't proceed yet, show warning first
      }
      return true; // Proceed immediately
    },
    [isCreating, isTeamProject, editToolDetail, originalDetails],
  );

  return {
    showWarning: showCredentialWarning,
    checkBeforeSave,
    handlers: {
      onConfirm: onConfirmCredentialWarning,
      onCancel: onCancelCredentialWarning,
      onClose: onCloseCredentialWarning,
    },
  };
};

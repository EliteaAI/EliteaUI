import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { hasCredentialConfigChanged, revertCredentialFields } from '../helpers/credentialWarning';

export const useCredentialWarning = ({
  isCreating = false,
  editToolDetail,
  originalDetails,
  revertCredentialsRef,
  setEditToolDetail,
} = {}) => {
  const [showCredentialWarning, setShowCredentialWarning] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);

  const { personal_project_id } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();

  // Check if this is a team project (not personal)
  const isTeamProject = useMemo(
    () =>
      personal_project_id != null && projectId != null && String(projectId) !== String(personal_project_id),
    [projectId, personal_project_id],
  );

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
      const reverted = revertCredentialFields(editToolDetail, originalDetails);
      setEditToolDetail(reverted);
    }
  }, [revertCredentialsRef, originalDetails, editToolDetail, setEditToolDetail]);

  const checkBeforeSave = useCallback(
    saveAction => {
      // Only check in edit mode (not creation) and for team projects
      if (!isCreating && isTeamProject && hasCredentialConfigChanged(editToolDetail, originalDetails)) {
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

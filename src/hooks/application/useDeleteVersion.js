import { useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useDeleteApplicationVersionMutation, useLazyCheckVersionInUseQuery } from '@/api/applications';
import { buildErrorMessage, replaceVersionInPath } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useReplaceVersionInPath = (versions, currentVersionId, defaultVersionID) => {
  const { pathname, search } = useLocation();
  const { agentId: applicationId, version } = useParams();
  const newVersionId = useMemo(() => {
    // First try to use the default version if it exists and is not being deleted
    if (defaultVersionID && defaultVersionID !== currentVersionId) {
      const defaultVersion = versions?.find(item => item.id === defaultVersionID);
      if (defaultVersion) return defaultVersion.id;
    }

    // If no default version or default version is being deleted, fall back to LATEST_VERSION_NAME
    const latestVersion = versions?.find(item => item.name === LATEST_VERSION_NAME);

    if (latestVersion && latestVersion.id !== currentVersionId) return latestVersion.id;

    // Fallback to any other version if both default and LATEST_VERSION_NAME don't exist or are being deleted
    const fallbackVersion = versions?.find(item => item.id !== currentVersionId);
    return fallbackVersion?.id;
  }, [currentVersionId, versions, defaultVersionID]);

  const newPath = useMemo(() => {
    return replaceVersionInPath(newVersionId, pathname, version, applicationId);
  }, [newVersionId, pathname, applicationId, version]);
  return { newPath, search };
};

/**
 * Simplified hook for version deletion with single-dialog flow:
 * 1. Check if version is in use before showing any dialog
 * 2. If in use: Show dialog with replacement version selector
 * 3. If not in use: Show simple delete confirmation
 * 4. Delete with optional replacement in a single call
 */
const useDeleteVersion = ({
  versionId,
  applicationId,
  toastError,
  toastInfo,
  toastSuccess,
  versions,
  defaultVersionID,
}) => {
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { state } = useLocation();

  // State for version in use check result
  const [versionInUseData, setVersionInUseData] = useState(null);
  const [isCheckingInUse, setIsCheckingInUse] = useState(false);

  const [deleteVersion, { isLoading: isDeletingVersion, reset: resetDeleteVersion }] =
    useDeleteApplicationVersionMutation();

  const [checkVersionInUse] = useLazyCheckVersionInUseQuery();

  const { newPath, search } = useReplaceVersionInPath(versions, versionId, defaultVersionID);

  const handleDeleteSuccess = useCallback(
    (updatedReferences = 0) => {
      // Add small delay to ensure cache invalidation completes
      setTimeout(() => {
        navigate(
          {
            pathname: newPath,
            search,
          },
          {
            state,
            replace: true,
          },
        );
      }, 200);

      resetDeleteVersion();
      setVersionInUseData(null);

      if (updatedReferences > 0) {
        toastSuccess(`Successfully updated ${updatedReferences} reference(s) and deleted the version.`);
      } else {
        toastInfo('Version has been deleted!');
      }
    },
    [navigate, newPath, resetDeleteVersion, search, state, toastInfo, toastSuccess],
  );

  /**
   * Check if version is in use before showing delete dialog.
   * Returns the check result to determine which dialog to show.
   */
  const doCheckVersionInUse = useCallback(async () => {
    setIsCheckingInUse(true);
    try {
      const result = await checkVersionInUse({ projectId, applicationId, versionId }).unwrap();
      setVersionInUseData(result);
      return result;
    } catch (error) {
      toastError(buildErrorMessage(error));
      return null;
    } finally {
      setIsCheckingInUse(false);
    }
  }, [projectId, applicationId, versionId, checkVersionInUse, toastError]);

  /**
   * Delete version with optional replacement.
   * @param {number|null} replacementVersionId - Version ID to replace references with (if version is in use)
   */
  const doDeleteVersion = useCallback(
    async (replacementVersionId = null) => {
      try {
        const result = await deleteVersion({
          applicationId,
          projectId,
          versionId,
          replacementVersionId,
        }).unwrap();

        if (result?.ok) {
          handleDeleteSuccess(result.updated_references || 0);
          return true;
        } else if (result?.error) {
          toastError(result.error);
          return false;
        }

        // Legacy success case (empty response meant success)
        handleDeleteSuccess(0);
        return true;
      } catch (error) {
        toastError(buildErrorMessage(error));
        resetDeleteVersion();
        return false;
      }
    },
    [versionId, deleteVersion, projectId, applicationId, toastError, handleDeleteSuccess, resetDeleteVersion],
  );

  /**
   * Reset the version in use data (e.g., when closing dialog)
   */
  const resetVersionInUseData = useCallback(() => {
    setVersionInUseData(null);
  }, []);

  return {
    // Check if version is in use
    doCheckVersionInUse,
    isCheckingInUse,
    versionInUseData,
    resetVersionInUseData,
    // Delete version (with optional replacement)
    doDeleteVersion,
    isDeletingVersion,
    resetDeleteVersion,
  };
};

export default useDeleteVersion;

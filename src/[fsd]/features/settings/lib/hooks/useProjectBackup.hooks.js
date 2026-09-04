import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useLazyDownloadProjectBackupQuery } from '@/[fsd]/features/settings/api';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useProjectBackup = () => {
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const { checkPermission } = useCheckPermission();
  const { toastError, toastInfo } = useToast();
  const [downloadBackup, { isFetching }] = useLazyDownloadProjectBackupQuery();

  // A private project makes its owner an editor, not an admin, so the restore
  // permission never reaches them there; owning the project stands in for it
  const isPersonalProject = useMemo(
    () => Boolean(personalProjectId) && String(projectId) === String(personalProjectId),
    [projectId, personalProjectId],
  );

  const canDownload = checkPermission(PERMISSIONS.projectBackup.download);
  const canRestore = checkPermission(PERMISSIONS.projectBackup.restore) || isPersonalProject;

  const doDownload = useCallback(async () => {
    if (!projectId) return;

    try {
      const { blob, filename } = await downloadBackup({ projectId }).unwrap();
      downloadBlobFile(blob, filename || `project-${projectId}-backup.sql`);
      toastInfo('Backup downloaded.');
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to download the project backup.');
    }
  }, [downloadBackup, projectId, toastError, toastInfo]);

  return { doDownload, isDownloading: isFetching, canDownload, canRestore, projectId };
};

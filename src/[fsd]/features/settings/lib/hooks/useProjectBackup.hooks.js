import { useCallback } from 'react';

import { useLazyDownloadProjectBackupQuery } from '@/[fsd]/features/settings/api';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useProjectBackup = () => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastInfo } = useToast();
  const [downloadBackup, { isFetching }] = useLazyDownloadProjectBackupQuery();

  const canDownload = checkPermission(PERMISSIONS.projectBackup.download);
  const canRestore = checkPermission(PERMISSIONS.projectBackup.restore);

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

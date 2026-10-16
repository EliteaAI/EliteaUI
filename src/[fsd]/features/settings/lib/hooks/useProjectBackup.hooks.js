import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useLazyDownloadProjectBackupQuery } from '@/[fsd]/features/settings/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useProjectBackup = () => {
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const { checkPermission } = useCheckPermission();
  const { toastError, toastInfo, toastWarning } = useToast();
  const [downloadBackup, { isFetching }] = useLazyDownloadProjectBackupQuery();

  // A private project makes its owner an editor, not an admin, so the restore
  // permission never reaches them there; owning the project stands in for it
  const isPersonalProject = useMemo(
    () => Boolean(personalProjectId) && String(projectId) === String(personalProjectId),
    [projectId, personalProjectId],
  );

  const canDownload = checkPermission(PERMISSIONS.projectBackup.download);
  const canRestore = checkPermission(PERMISSIONS.projectBackup.restore) || isPersonalProject;

  const doDownload = useCallback(
    async ({ chats, missingAttachments = 0 } = {}) => {
      if (!projectId) return false;

      try {
        const includeChats = chats && chats !== 'none' ? chats : undefined;
        const { blob, filename } = await downloadBackup({ projectId, includeChats }).unwrap();
        downloadBlobFile(blob, filename || `project-${projectId}-backup.sql.enc`);
        // Files that could not be read are left out of the archive and listed in its manifest
        if (includeChats === 'with_attachments' && missingAttachments) {
          toastWarning(`Backup created. ${missingAttachments} attachment file(s) could not be included.`);
        } else {
          toastInfo('Backup downloaded.');
        }
        return true;
      } catch (error) {
        toastError(buildErrorMessage(error) || 'Failed to download the project backup.');
        return false;
      }
    },
    [downloadBackup, projectId, toastError, toastInfo, toastWarning],
  );

  return { doDownload, isDownloading: isFetching, canDownload, canRestore, projectId };
};

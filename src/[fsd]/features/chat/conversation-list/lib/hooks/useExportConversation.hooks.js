import { useCallback, useEffect, useRef, useState } from 'react';

import { ENCRYPTED_FILE_SUFFIX } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  buildExportFileName,
  getConversationExportPath,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix, downloadBlobFile } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// Browser-managed download streams to disk instead of holding the archive in memory.
// DEV auth is a bearer header that a plain navigation cannot send, so DEV always uses fetch.
const startBrowserDownload = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const useExportConversation = () => {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess, toastWarning, toastInfo } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const startExport = useCallback(
    async ({ conversation, includeAttachments, streamToDisk = false }) => {
      if (abortControllerRef.current) return false;

      const fileName = buildExportFileName(conversation.name);
      const extension = includeAttachments ? 'zip' : 'json';
      const params = new URLSearchParams({
        include_attachments: includeAttachments ? 'true' : 'false',
        file_name: fileName,
      });
      const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}${getConversationExportPath(projectId, conversation.id)}?${params}`;

      if (streamToDisk && !DEV) {
        // Empty name: the browser takes it from Content-Disposition (the server may add the .enc suffix)
        startBrowserDownload(url, '');
        toastInfo('Export started. Your browser will download the archive.');
        return true;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsExporting(true);

      try {
        const response = await fetch(url, {
          headers: new Headers({ ...(DEV && { Authorization: `Bearer ${VITE_DEV_TOKEN}` }) }),
          signal: controller.signal,
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || contentType.startsWith('text/html')) throw new Error(`HTTP ${response.status}`);

        const isEncrypted = contentType.startsWith('application/octet-stream');
        const blob = await response.blob();
        downloadBlobFile(blob, `${fileName}.${extension}${isEncrypted ? ENCRYPTED_FILE_SUFFIX : ''}`);

        const missingCount = Number(response.headers.get('X-Export-Missing-Files') || 0);
        if (missingCount > 0) toastWarning(`Chat exported. ${missingCount} file(s) could not be included.`);
        else toastSuccess('Chat exported successfully');
        return true;
      } catch (error) {
        if (error.name === 'AbortError') toastInfo('Export cancelled');
        else toastError('Failed to export chat');
        return false;
      } finally {
        abortControllerRef.current = null;
        setIsExporting(false);
      }
    },
    [projectId, toastError, toastInfo, toastSuccess, toastWarning],
  );

  const cancelExport = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { isExporting, startExport, cancelExport };
};

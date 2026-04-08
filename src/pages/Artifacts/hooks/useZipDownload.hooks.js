import { useCallback, useRef, useState } from 'react';

import { downloadArtifactsAsZip } from '@/common/utils';
import useToast from '@/hooks/useToast';

export const useZipDownload = () => {
  const { toastError, toastSuccess, toastInfo } = useToast();
  const [zipDownloadProgress, setZipDownloadProgress] = useState({
    isOpen: false,
    current: 0,
    total: 0,
    filename: '',
  });
  const zipDownloadAbortControllerRef = useRef(null);

  const startZipDownload = useCallback(
    ({ projectId, bucket, filenames, bucketContents = [], currentPrefix = '' }) => {
      const abortController = new AbortController();
      zipDownloadAbortControllerRef.current = abortController;

      setZipDownloadProgress({ isOpen: true, current: 0, total: filenames.length, filename: '' });
      downloadArtifactsAsZip({
        projectId,
        bucket,
        filenames,
        bucketContents,
        currentPrefix,
        abortSignal: abortController.signal,
        handleError: err => {
          setZipDownloadProgress({ isOpen: false, current: 0, total: 0, filename: '' });
          zipDownloadAbortControllerRef.current = null;
          toastError('ZIP download error: ' + err.message);
        },
        onCancel: () => {
          setZipDownloadProgress({ isOpen: false, current: 0, total: 0, filename: '' });
          zipDownloadAbortControllerRef.current = null;
          toastInfo('Download cancelled');
        },
        onProgress: ({ current, total, filename }) => {
          setZipDownloadProgress({ isOpen: true, current, total, filename });
          // Close dialog when complete
          if (current === total) {
            setTimeout(() => {
              setZipDownloadProgress({ isOpen: false, current: 0, total: 0, filename: '' });
              zipDownloadAbortControllerRef.current = null;
              toastSuccess('ZIP downloaded successfully');
            }, 500);
          }
        },
      });
    },
    [toastError, toastInfo, toastSuccess],
  );

  const cancelZipDownload = useCallback(() => {
    if (zipDownloadAbortControllerRef.current) {
      zipDownloadAbortControllerRef.current.abort();
      zipDownloadAbortControllerRef.current = null;
    }
    setZipDownloadProgress({ isOpen: false, current: 0, total: 0, filename: '' });
  }, []);

  return {
    zipDownloadProgress,
    startZipDownload,
    cancelZipDownload,
  };
};

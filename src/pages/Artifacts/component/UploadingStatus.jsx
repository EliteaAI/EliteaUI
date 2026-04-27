import { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { FORBIDDEN_FILENAME_HINT } from '@/[fsd]/features/artifacts/lib/helpers/pathValidation.helpers';
import { alitaApi } from '@/api/alitaApi';
import useToast from '@/hooks/useToast';
import { setIsUploading, setSkippedFiles, setUploadFinished } from '@/slices/upload';

export default function UploadingStatus() {
  const dispatch = useDispatch();
  const { uploadFinished, fileStatuses, skippedFiles } = useSelector(state => state.upload);
  const { toastSuccess, toastError } = useToast();
  const hasFileFailed = useMemo(() => !!fileStatuses.find(item => item.failed), [fileStatuses]);

  useEffect(() => {
    if (uploadFinished) {
      const hasSkippedFiles = skippedFiles.length > 0;

      if (hasFileFailed) {
        toastError('Some files failed to upload');
      } else if (hasSkippedFiles) {
        // Skipped files take priority over success — show the most important info
        toastError(
          `The following files were skipped (restricted characters): ${skippedFiles.join(', ')}. ${FORBIDDEN_FILENAME_HINT}`,
        );
      } else {
        toastSuccess('Your file(s) have been successfully uploaded!');
      }

      // Invalidate cache regardless — the valid files were still uploaded
      if (!hasFileFailed) {
        dispatch(alitaApi.util.invalidateTags(['TAG_ARTIFACTS', 'TAG_BUCKETS']));
      }

      if (hasSkippedFiles) {
        dispatch(setSkippedFiles([]));
      }

      // Clear upload state
      dispatch(setUploadFinished(false));
      dispatch(setIsUploading(false));
    }
  }, [dispatch, hasFileFailed, uploadFinished, skippedFiles, toastSuccess, toastError]);

  // Don't render any UI - just handle the upload completion logic
  return null;
}

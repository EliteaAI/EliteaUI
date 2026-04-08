import { useCallback, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useTrackEvent } from '@/GA';
import { PathValidationHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { FORBIDDEN_FILENAME_HINT } from '@/[fsd]/features/artifacts/lib/helpers/pathValidation.helpers';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { artifactsApi, useArtifactListQuery } from '@/api/artifacts';
import useToast from '@/hooks/useToast';
import { setSkippedFiles, uploadFile } from '@/slices/upload';

/**
 * Unified hook to handle all bucket upload flows:
 * - Bucket sidebar menu upload
 * - Table toolbar upload
 * - Table drag-and-drop upload
 */
export const useFileUpload = props => {
  const {
    selectedProjectId,
    allBuckets,
    queryParams,
    onSelectBucket,
    handlePrefixChange,
    currentPrefix = '',
  } = props;

  const bucketUploadFileInputRef = useRef(null);

  const dispatch = useDispatch();
  const { toastError } = useToast();
  const trackEvent = useTrackEvent();

  // Use the same cached RTK Query data that ArtifactTable already fetches
  const selectedBucketName = queryParams.selectedBucket?.name;

  const { data: bucketData } = useArtifactListQuery(
    { projectId: selectedProjectId, bucket: selectedBucketName },
    { skip: !selectedProjectId || !selectedBucketName },
  );

  const [pendingUploadBucket, setPendingUploadBucket] = useState(null);
  const [pendingUploadFiles, setPendingUploadFiles] = useState(null);
  const [pendingFolderPath, setPendingFolderPath] = useState(null);
  const [pendingOnSelectFolder, setPendingOnSelectFolder] = useState(null);
  const [showUploadPathDialog, setShowUploadPathDialog] = useState(false);

  // Duplicate detection state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateFilenames, setDuplicateFilenames] = useState([]);

  // Internal: calculate full path from the entered folder path with security validation
  const computeFullPath = useCallback(
    folderPath => {
      try {
        // Use the secure path computation which includes validation
        return PathValidationHelpers.computeSecurePath(folderPath, currentPrefix);
      } catch (error) {
        toastError(`Invalid path: ${error.message}`);
        return currentPrefix ? currentPrefix.replace(/\/+$/, '') : '';
      }
    },
    [currentPrefix, toastError],
  );

  // Internal: perform the actual upload (called after all checks pass)
  const executeUpload = useCallback(
    (files, bucketName, folderPath, onSelectFolder) => {
      const validationError = PathValidationHelpers.validateFolderPath(folderPath, currentPrefix);
      if (validationError) {
        toastError(`Upload blocked: ${validationError}`);
        return;
      }

      const filesArray = Array.isArray(files) ? files : Array.from(files);
      const validFileNames = filesArray.filter(file => !PathValidationHelpers.validateFileName(file.name));
      const invalidFileNames = filesArray
        .filter(file => PathValidationHelpers.validateFileName(file.name))
        .map(file => file.name);

      if (invalidFileNames.length > 0) {
        dispatch(setSkippedFiles(invalidFileNames));
      } else {
        dispatch(setSkippedFiles([]));
      }

      if (validFileNames.length === 0) {
        // No upload will happen, so UploadingStatus won't fire — show the warning immediately
        toastError(
          `Upload blocked: The following files contain restricted characters: ${invalidFileNames.join(', ')}. ${FORBIDDEN_FILENAME_HINT}`,
        );
        return;
      }

      const bucketToSelect = allBuckets.find(b => b.name === bucketName);

      if (bucketToSelect && (!queryParams.selectedBucket || queryParams.selectedBucket.name !== bucketName))
        onSelectBucket(bucketToSelect);

      const fullPath = computeFullPath(folderPath);

      if (fullPath === null) {
        toastError('Upload blocked: Invalid path computed');
        return;
      }

      Array.isArray(validFileNames)
        ? validFileNames
        : Array.from(validFileNames).forEach(file => {
            trackEvent(GA_EVENT_NAMES.ATTACHMENT_UPLOADED, {
              [GA_EVENT_PARAMS.ATTACHMENT_TYPE]: file.type.toLowerCase() || 'uknown',
              [GA_EVENT_PARAMS.UPLOAD_SOURCE]: 'artifacts',
              [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
            });
          });
      dispatch(
        uploadFile({
          files: validFileNames,
          url: `/artifacts/s3/${bucketName}`,
          projectId: selectedProjectId,
          folderPath: fullPath,
        }),
      );

      dispatch(
        artifactsApi.util.invalidateTags([
          { type: 'Artifacts', id: 'LIST' },
          { type: 'Buckets', id: 'LIST' },
        ]),
      );

      if (fullPath) {
        handlePrefixChange(fullPath);

        if (onSelectFolder && bucketToSelect) onSelectFolder(fullPath, bucketToSelect);
      } else if (folderPath === '') {
        const targetPath = currentPrefix || '';

        handlePrefixChange(targetPath);
      }

      setPendingUploadFiles(null);
      setPendingUploadBucket(null);
      setPendingFolderPath(null);
      setPendingOnSelectFolder(null);
    },
    [
      currentPrefix,
      allBuckets,
      queryParams.selectedBucket,
      onSelectBucket,
      computeFullPath,
      dispatch,
      selectedProjectId,
      toastError,
      trackEvent,
      handlePrefixChange,
    ],
  );

  // Handle bucket upload - triggered from bucket menu
  const onBucketUpload = useCallback(bucketName => {
    setPendingUploadBucket(bucketName);

    if (bucketUploadFileInputRef.current) bucketUploadFileInputRef.current.click();
  }, []);

  const handleBucketFileChange = useCallback(
    event => {
      const files = event.target.files;
      if (files && files.length > 0 && pendingUploadBucket) {
        setPendingUploadFiles(Array.from(files));
        setShowUploadPathDialog(true);
      } else if (!pendingUploadBucket) toastError('No bucket selected for upload');
      else if (!selectedProjectId) toastError('Project ID is required for upload');

      event.target.value = '';
    },
    [pendingUploadBucket, selectedProjectId, toastError],
  );

  const handlePathDialogClose = useCallback(() => {
    setShowUploadPathDialog(false);
    setPendingUploadFiles(null);
    setPendingUploadBucket(null);
  }, []);

  // Table upload (toolbar button / drag-drop) - go straight to path dialog
  const handleTableUploadRequest = useCallback(
    files => {
      if (queryParams.selectedBucket && selectedProjectId) {
        setPendingUploadBucket(queryParams.selectedBucket.name);
        setPendingUploadFiles(files);
        setShowUploadPathDialog(true);
      }
    },
    [queryParams.selectedBucket, selectedProjectId],
  );

  const checkForDuplicateFiles = useCallback((files, contents, targetPrefix = '') => {
    const existingKeys = new Set(contents.map(item => item.key));

    return files.reduce((acc, file) => {
      if (existingKeys.has(`${targetPrefix}${file.name}`)) acc.push(file.name);

      return acc;
    }, []);
  }, []);

  // Path dialog confirmed → check duplicates in the TARGET folder, then upload or warn
  const handlePathConfirm = useCallback(
    (folderPath, onSelectFolder) => {
      if (!pendingUploadFiles || !pendingUploadBucket || !selectedProjectId) return;

      setShowUploadPathDialog(false);

      // Check duplicates: build full key per file and match against bucket contents
      const fullPath = computeFullPath(folderPath);
      const targetPrefix = fullPath ? `${fullPath}/` : '';
      const isCurrentBucket = selectedBucketName === pendingUploadBucket;

      if (isCurrentBucket && bucketData?.contents?.length) {
        const duplicates = checkForDuplicateFiles(pendingUploadFiles, bucketData.contents, targetPrefix);

        if (duplicates.length > 0) {
          setPendingFolderPath(folderPath);
          setPendingOnSelectFolder(() => onSelectFolder);
          setDuplicateFilenames(duplicates);
          setShowDuplicateWarning(true);
          return;
        }
      }

      executeUpload(pendingUploadFiles, pendingUploadBucket, folderPath, onSelectFolder);
    },
    [
      pendingUploadFiles,
      pendingUploadBucket,
      selectedProjectId,
      computeFullPath,
      selectedBucketName,
      bucketData?.contents,
      executeUpload,
      checkForDuplicateFiles,
    ],
  );

  // Duplicate dialog: cancel
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateWarning(false);
    setDuplicateFilenames([]);
    setPendingUploadFiles(null);
    setPendingUploadBucket(null);
    setPendingFolderPath(null);
    setPendingOnSelectFolder(null);
  }, []);

  // Duplicate dialog: confirm override → proceed with upload
  const handleConfirmDuplicate = useCallback(() => {
    setShowDuplicateWarning(false);
    setDuplicateFilenames([]);

    if (pendingUploadFiles && pendingUploadBucket && pendingFolderPath !== null)
      executeUpload(pendingUploadFiles, pendingUploadBucket, pendingFolderPath, pendingOnSelectFolder);
  }, [pendingUploadFiles, pendingUploadBucket, pendingFolderPath, pendingOnSelectFolder, executeUpload]);

  return {
    // Ref for file input
    bucketUploadFileInputRef,
    // Dialog state
    showUploadPathDialog,
    pendingUploadBucket,
    // Duplicate dialog state
    showDuplicateWarning,
    setShowDuplicateWarning,
    duplicateFilenames,
    // Handlers
    onBucketUpload,
    handleBucketFileChange,
    handlePathDialogClose,
    handlePathConfirm,
    handleTableUploadRequest,
    handleCancelDuplicate,
    handleConfirmDuplicate,
  };
};

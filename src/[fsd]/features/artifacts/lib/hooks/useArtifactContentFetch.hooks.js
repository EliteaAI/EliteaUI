import { useCallback, useRef, useState } from 'react';

import { AvailableFormatsEnum } from '@/[fsd]/features/artifacts/lib/constants/filePreviewCanvas.constants';
import { PathValidationHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { isImageFile } from '@/utils/filePreview';

/**
 * Custom hook for fetching artifact file content
 * Handles both text and image files with appropriate state management
 *
 */
export const useArtifactContentFetch = ({
  bucket,
  file,
  projectId,
  hasRequiredParams,
  canPreview,
  onError,
}) => {
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [imageBlobUrl, setImageBlobUrl] = useState('');
  const [documentBuffer, setDocumentBuffer] = useState('');

  // Tracks which file was last fetched. If fetchFileContent is called again for the same
  // resource before resetContent() clears this (e.g. React Strict Mode double-invoke),
  // the duplicate call exits immediately without making a second HTTP request.
  const fetchedForKeyRef = useRef(null);

  const fetchFileContent = useCallback(async () => {
    if (!hasRequiredParams || !canPreview) return;

    let filePath = file.key || file.name;

    // Remove leading slash if present
    filePath = filePath.replace(/^\/+/, '');

    // Validate the filename component before making any HTTP request
    const fileName = (file.name || filePath).split('/').pop();

    const fileNameError = PathValidationHelpers.validateFileName(fileName);
    if (fileNameError) {
      const errorMessage = `Cannot preview file: ${fileNameError}`;
      setLoadError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Note: Removed defensive bucket name removal logic as it was incorrectly handling
    // legitimate cases where subfolders have the same name as the bucket.
    // The file path should be used as-is since it represents the correct relative path
    // within the bucket structure.
    // if (filePath.startsWith(`${bucket}/`)) {
    //   filePath = filePath.substring(bucket.length + 1);
    // }

    const fetchKey = `${projectId}:${bucket}:${filePath}`;
    if (fetchedForKeyRef.current === fetchKey) return;
    fetchedForKeyRef.current = fetchKey;

    setIsLoading(true);
    setLoadError('');
    setFileContent('');
    setImageBlobUrl('');

    try {
      // Use the same artifact content endpoint as the download button.
      // encodeURIComponent encodes slashes in subfolder paths (e.g. myfolder/file.txt → myfolder%2Ffile.txt)
      const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}/artifacts/artifact/default/${projectId}/${encodeURIComponent(bucket)}/${encodeURIComponent(filePath)}`;

      const headers = new Headers();

      if (DEV && VITE_DEV_TOKEN) {
        headers.set('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
        headers.set('Cache-Control', 'no-cache');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);

      if (isImageFile(file)) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setImageBlobUrl(blobUrl);
        setFileContent('IMAGE_LOADED');

        return;
      }

      const isDocxFile =
        file && [AvailableFormatsEnum.DOCX].some(f => file.name.toLowerCase().endsWith(`.${f}`));

      if (isDocxFile) {
        const arrayBuffer = await response.arrayBuffer();
        setDocumentBuffer(arrayBuffer);
      } else {
        const content = await response.text();
        setFileContent(content);
      }
    } catch (error) {
      // On error clear the key so the user can retry
      fetchedForKeyRef.current = null;
      const errorMessage = error.message || 'Failed to load file content';
      setLoadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [bucket, file, projectId, hasRequiredParams, canPreview, onError]);

  const resetContent = useCallback(() => {
    // Clear the fetch key so the same file can be fetched again when the panel is re-opened
    fetchedForKeyRef.current = null;
    setFileContent('');
    setLoadError('');
    setIsLoading(false);
    setImageBlobUrl('');
  }, []);

  return {
    fileContent,
    isLoading,
    loadError,
    imageBlobUrl,
    fetchFileContent,
    resetContent,
    setFileContent,
    setImageBlobUrl,
    documentBuffer,
  };
};

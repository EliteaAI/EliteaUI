import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useGetDocumentLoadersQuery } from '@/api/applications';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import {
  clearError,
  selectAllowedExtensions,
  selectAllowedFileTypes,
  selectAllowedMimeTypes,
  selectDocumentLoaders,
  selectFileTypesError,
  selectFileTypesLoading,
  setDocumentLoaders,
  setError,
  setLoading,
} from '@/slices/fileTypes';

/**
 * Hook to manage and provide file types data
 * Fetches document loaders from API and combines with static image types
 *
 * @returns {Object} Object containing:
 *   - allowedFileTypes: Object with MIME type as key and array of extensions as value
 *   - allowedExtensions: Flat array of all allowed extensions
 *   - allowedMimeTypes: Array of all allowed MIME types
 *   - documentLoaders: Raw document loaders data from API
 *   - isLoading: Boolean indicating if data is being fetched
 *   - error: Error object if fetch failed
 *   - refetch: Function to manually refetch document loaders
 */
export const useFileTypes = () => {
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();

  // Selectors
  const allowedFileTypes = useSelector(selectAllowedFileTypes);
  const allowedExtensions = useSelector(selectAllowedExtensions);
  const allowedMimeTypes = useSelector(selectAllowedMimeTypes);
  const documentLoaders = useSelector(selectDocumentLoaders);
  const isLoading = useSelector(selectFileTypesLoading);
  const error = useSelector(selectFileTypesError);

  // API query
  const {
    data: documentLoadersData,
    isLoading: isApiLoading,
    error: apiError,
    refetch,
  } = useGetDocumentLoadersQuery(
    { projectId },
    {
      skip: !projectId,
      refetchOnMountOrArgChange: true,
    },
  );

  // Update loading state
  useEffect(() => {
    dispatch(setLoading(isApiLoading));
  }, [dispatch, isApiLoading]);

  // Handle API data
  useEffect(() => {
    if (documentLoadersData) {
      dispatch(setDocumentLoaders(documentLoadersData));
      dispatch(clearError());
    }
  }, [dispatch, documentLoadersData]);

  // Handle API error
  useEffect(() => {
    if (apiError) {
      dispatch(setError(apiError.message || 'Failed to fetch document loaders'));
    }
  }, [dispatch, apiError]);

  return {
    allowedFileTypes,
    allowedExtensions,
    allowedMimeTypes,
    documentLoaders,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get only the allowed file types (for components that just need the data)
 *
 * @returns {Object} Object with MIME type as key and array of extensions as value
 */
export const useAllowedFileTypes = () => {
  const { allowedFileTypes } = useFileTypes();
  return allowedFileTypes || {};
};

/**
 * Hook to get only the allowed extensions (flat array)
 *
 * @returns {Array} Array of allowed file extensions (e.g., ['.jpg', '.png', '.pdf'])
 */
export const useAllowedExtensions = () => {
  const { allowedExtensions } = useFileTypes();
  return allowedExtensions || [];
};

/**
 * Hook to get only the allowed MIME types
 *
 * @returns {Array} Array of allowed MIME types (e.g., ['image/jpeg', 'application/pdf'])
 */
export const useAllowedMimeTypes = () => {
  const { allowedMimeTypes } = useFileTypes();
  return allowedMimeTypes || [];
};

/**
 * Hook to get only document types (excluding images)
 *
 * @returns {Object} Object with document extension -> mime_type mapping
 */
export const useDocumentTypes = () => {
  const { documentLoaders } = useFileTypes();
  return documentLoaders?.document_types || {};
};

/**
 * Hook to get only image types
 *
 * @returns {Object} Object with image extension -> mime_type mapping
 */
export const useImageTypes = () => {
  const { documentLoaders } = useFileTypes();
  return documentLoaders?.image_types || {};
};

/**
 * Hook to get only code types
 *
 * @returns {Object} Object with code extension -> mime_type mapping
 */
export const useCodeTypes = () => {
  const { documentLoaders } = useFileTypes();
  return documentLoaders?.code_types || {};
};

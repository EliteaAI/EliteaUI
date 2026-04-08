import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBucketListQuery, useDeleteBucketMutation } from '@/api/artifacts';
import { isSystemBucket } from '@/common/artifactConstants';
import { sortBucketsByRecent } from '@/common/bucketSortingUtils';
import { ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { actions } from '@/slices/artifact';

import { transformStorageResponse } from '../utils/transformStorageResponse';
import BucketsPanel from './BucketsPanel';

/**
 * Buckets Container Component
 * Handles all data fetching, mutations, and business logic for bucket management.
 * Delegates UI rendering to BucketsPanel.
 */
const Buckets = memo(props => {
  const {
    projectId,
    configurationTitle,
    storageConfigurations,
    onSelectBucket,
    selectedBucket,
    selectedFile,
    currentPrefix,
    collapsed,
    onCollapsed,
    onCreateBucket,
    onStorageChange,
    onBucketsDataChange, // Callback to provide bucket data to parent
    onUpload, // Callback to handle upload from bucket menu
    onSelectFile, // Callback to handle file selection
    onSelectFolder, // Callback to handle folder selection (navigates table)
  } = props;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { routeStack = [] } = useMemo(() => locationState || { routeStack: [] }, [locationState]);
  const { toastError, toastInfo } = useToast();

  const [deletingBucket, setDeletingBucket] = useState(null);

  const shouldSkipQueries =
    !projectId || !configurationTitle || projectId === 'null' || projectId === 'undefined';

  // Fetch buckets data
  const {
    data,
    isError,
    error,
    isLoading: isLoadingBuckets,
    refetch,
  } = useBucketListQuery(
    {
      projectId,
      configuration_title: configurationTitle,
      is_local: true,
    },
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      skip: shouldSkipQueries,
      refetchOnReconnect: true,
      // Add more aggressive refetching to pick up bucket timestamp updates
      refetchOnWindowFocus: true,
    },
  );

  // Delete bucket mutation
  const [deleteBucket, { isError: isDeleteError, isSuccess: isDeleteSuccess, error: deleteError }] =
    useDeleteBucketMutation();

  const currentStorageUsage = useMemo(() => {
    return transformStorageResponse(data);
  }, [data]);

  // Process and filter buckets
  const buckets = useMemo(() => {
    if (shouldSkipQueries) return [];
    if (isLoadingBuckets && !data) return [];
    return isError ? [] : (data?.buckets ?? []).filter(bucket => !isSystemBucket(bucket.name));
  }, [data, isError, shouldSkipQueries, isLoadingBuckets]);

  // Provide bucket data to parent component
  useEffect(() => {
    if (onBucketsDataChange) {
      onBucketsDataChange(buckets, refetch);
    }
    // eslint-disable-next-line no-console
    console.info('[Buckets] query state:', {
      isLoadingBuckets,
      isError,
      bucketsCount: buckets?.length || 0,
      dataPresent: !!data,
    });
  }, [buckets, refetch, onBucketsDataChange, isLoadingBuckets, isError, data]);

  // Handle bucket edit navigation
  const handleEdit = useCallback(
    bucket => {
      dispatch(actions.setBucket(bucket));
      const newRouteStack = [...routeStack];
      if (newRouteStack.length) {
        newRouteStack[newRouteStack.length - 1].pagePath = RouteDefinitions.Artifacts;
      }
      newRouteStack.push({
        breadCrumb: 'Edit Bucket',
        viewMode: ViewMode.Owner,
        pagePath: RouteDefinitions.CreateBucket,
      });
      navigate({ pathname: RouteDefinitions.CreateBucket }, { state: { routeStack: newRouteStack } });
    },
    [dispatch, navigate, routeStack],
  );

  // Handle bucket delete
  const handleDelete = useCallback(
    bucket => {
      setDeletingBucket(bucket);
      deleteBucket({ projectId, bucket: bucket.name });
    },
    [deleteBucket, projectId],
  );

  // Error handling for bucket list
  useEffect(() => {
    if (isError) {
      // Special handling for container not found errors (often related to project switching)
      const errorMessage = error?.data?.error || error?.message || 'Unknown error';
      if (errorMessage.includes('ContainerDoesNotExistError') || errorMessage.includes('container=')) {
        toastError(
          'Failed to load buckets. This may be due to project switching. Please try refreshing the page.',
        );
      } else {
        toastError(buildErrorMessage(error));
      }
    }
  }, [error, isError, toastError]);

  // Error handling for delete mutation
  useEffect(() => {
    if (isDeleteError) {
      toastError(buildErrorMessage(deleteError));
      setDeletingBucket(null);
    }
  }, [deleteError, isDeleteError, toastError]);

  // Success handling for delete mutation
  useEffect(() => {
    if (isDeleteSuccess) {
      toastInfo('The bucket has been deleted successfully');
    }
  }, [isDeleteSuccess, toastInfo]);

  // Handle bucket deletion and auto-select next bucket
  useEffect(() => {
    if (isDeleteSuccess && deletingBucket) {
      // Check if the deleted bucket was the currently selected one
      const wasSelectedBucketDeleted = selectedBucket && selectedBucket.name === deletingBucket.name;

      if (wasSelectedBucketDeleted) {
        // Auto-select the next available bucket
        const remainingBuckets = buckets.filter(bucket => bucket.name !== deletingBucket.name);
        if (remainingBuckets.length > 0) {
          const nextBucket = sortBucketsByRecent(remainingBuckets)[0];
          setTimeout(() => {
            onSelectBucket(nextBucket, true);
          }, 100);
        } else {
          // No buckets left, clear selection
          setTimeout(() => {
            onSelectBucket(null, false);
          }, 100);
        }
      }

      // Clear the deleting bucket tracker
      setDeletingBucket(null);
    }
  }, [isDeleteSuccess, deletingBucket, selectedBucket, buckets, onSelectBucket]);

  return (
    <BucketsPanel
      // Data
      buckets={buckets}
      selectedBucket={selectedBucket}
      selectedFile={selectedFile}
      currentPrefix={currentPrefix}
      configurationTitle={configurationTitle}
      storageConfigurations={storageConfigurations}
      currentStorageUsage={currentStorageUsage}
      isLoadingBuckets={isLoadingBuckets}
      isError={isError}
      collapsed={collapsed}
      // Callbacks
      onSelectBucket={onSelectBucket}
      onCollapsed={onCollapsed}
      onCreateBucket={onCreateBucket}
      onStorageChange={onStorageChange}
      onUpload={onUpload}
      onSelectFile={onSelectFile}
      onSelectFolder={onSelectFolder}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
});

Buckets.displayName = 'Buckets';

export default Buckets;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { useFileUpload } from '@/[fsd]/features/artifacts/lib/hooks/useFileUpload.hooks';
import { FilePreviewCanvas } from '@/[fsd]/features/artifacts/ui';
import { useGetConfigurationsListQuery } from '@/api/configurations';
import { PENDING_BUCKET_SESSION_KEY } from '@/common/artifactConstants';
import { sortBucketsByRecent } from '@/common/bucketSortingUtils';
import { SIDE_BAR_WIDTH, ViewMode } from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';
import AlertDialogV2 from '@/components/AlertDialogV2';
import { useFilePreviewNavigation } from '@/contexts/FilePreviewNavigationContext';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';
import { actions } from '@/slices/artifact';

import Buckets from './Components/Buckets';
import ArtifactTable from './component/ArtifactTable';
import DuplicateDialogContent from './component/DuplicateDialogContent';
import UploadPathDialog from './component/UploadPathDialog';
import UploadingStatus from './component/UploadingStatus';

/**
 * Ensures a folder path has a trailing slash for consistent matching with tree item keys.
 * Empty strings are returned as-is (root level).
 */
const ensureTrailingSlash = path => (path && !path.endsWith('/') ? `${path}/` : path);

// Constants for artifacts layout
const ARTIFACTS_PANEL_WIDTHS = {
  DEFAULT_LEFT_PANEL: 300,
  LARGE_SCREEN_THRESHOLD: 1700,
  LARGE_SCREEN_LEFT_PANEL: 300,
  COLLAPSED_SIDEBAR_OFFSET: 380,
};

const NAVIGATION_STATE_TIMEOUT = {
  RESET_DELAY: 100,
  BUCKET_FETCH_TIMEOUT: 2000,
};

export default function Artifacts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { routeStack = [] } = useMemo(() => locationState || { routeStack: [] }, [locationState]);
  const selectedProjectId = useSelectedProjectId();
  const { windowWidth } = useGetWindowWidth();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [pendingFileSelection, setPendingFileSelection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ref to track when we're deliberately clearing the file preview
  // This prevents the URL-restoration useEffect from re-opening the file
  const isClearingPreviewRef = useRef(false);

  // File preview navigation context
  const { setFilePreviewActive, checkNavigationAllowed } = useFilePreviewNavigation();

  // Calculate panel widths similar to Chat component
  const leftPanelWidth = useMemo(
    () =>
      sideBarCollapsed
        ? ARTIFACTS_PANEL_WIDTHS.DEFAULT_LEFT_PANEL
        : windowWidth > ARTIFACTS_PANEL_WIDTHS.LARGE_SCREEN_THRESHOLD
          ? ARTIFACTS_PANEL_WIDTHS.LARGE_SCREEN_LEFT_PANEL
          : ARTIFACTS_PANEL_WIDTHS.COLLAPSED_SIDEBAR_OFFSET - SIDE_BAR_WIDTH / 2,
    [sideBarCollapsed, windowWidth],
  );

  const [queryParams, setQueryParams] = useState({
    projectId: selectedProjectId,
    selectedBucket: null,
    storage: [],
    configurationTitle: '',
    search: '',
  });
  const [previewFile, setPreviewFile] = useState(null);
  const [collapsedBuckets, setCollapsedBuckets] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState('');

  const styles = artifactsStyles(collapsedBuckets, leftPanelWidth);

  // Bucket data will be provided by Buckets component via callback
  const [allBuckets, setAllBuckets] = useState([]);
  const [refetchBuckets, setRefetchBuckets] = useState(() => () => {});

  // Callback to receive bucket data from Buckets component
  const onBucketsDataChange = useCallback((buckets, refetchFunction) => {
    setAllBuckets(buckets);
    setRefetchBuckets(() => refetchFunction);
  }, []);

  const { data: configurationsResponse = {}, isSuccess } = useGetConfigurationsListQuery(
    {
      projectId: queryParams.projectId,
      type: 's3',
      includeShared: true,
    },
    {
      // Prevent API calls with invalid project IDs
      skip:
        !queryParams.projectId || queryParams.projectId === 'null' || queryParams.projectId === 'undefined',
    },
  );

  // Extract S3 configurations from the response
  const storageConfigurations = useMemo(() => {
    const regularS3Configs = configurationsResponse?.items || [];
    const sharedS3Configs = configurationsResponse?.shared?.items || [];
    return [...regularS3Configs, ...sharedS3Configs];
  }, [configurationsResponse]);

  const onAddBucket = useCallback(() => {
    const navigationAction = () => {
      dispatch(actions.setBucket(null));
      const newRouteStack = [...routeStack];
      if (newRouteStack.length) {
        newRouteStack[newRouteStack.length - 1].pagePath = RouteDefinitions.Artifacts;
      }
      newRouteStack.push({
        breadCrumb: 'New Bucket',
        viewMode: ViewMode.Owner,
        pagePath: RouteDefinitions.CreateBucket,
      });
      navigate(
        {
          pathname: RouteDefinitions.CreateBucket,
        },
        {
          state: {
            routeStack: newRouteStack,
          },
        },
      );
    };

    checkNavigationAllowed(navigationAction);
  }, [dispatch, navigate, routeStack, checkNavigationAllowed]);

  const handlePrefixChange = useCallback(
    newPrefix => {
      const normalizedPrefix = ensureTrailingSlash(newPrefix);
      setCurrentPrefix(normalizedPrefix);
      // Update URL with new prefix/folder path (only if no file is selected)
      if (queryParams.selectedBucket) {
        const params = { bucket: queryParams.selectedBucket.name };
        const fileFromUrl = searchParams.get('file');

        if (normalizedPrefix && !fileFromUrl) {
          // Store in URL without trailing slash for cleaner URLs
          params.folder = normalizedPrefix.replace(/\/$/, '');
        }
        if (fileFromUrl) {
          params.file = fileFromUrl;
        }
        setSearchParams(params);
      }
    },
    [queryParams.selectedBucket, searchParams, setSearchParams],
  );

  const onSelectBucket = useCallback(
    bucket => {
      // Mark that we're deliberately clearing the preview to prevent race condition
      isClearingPreviewRef.current = true;
      setPreviewFile(null);
      setFilePreviewActive(false);
      setCurrentPrefix(''); // Reset folder navigation when bucket changes

      if (bucket) {
        sessionStorage.setItem(
          `artifacts-had-selection-${queryParams.projectId}-${queryParams.configurationTitle}`,
          'true',
        );
        const newParams = { bucket: bucket.name };
        setSearchParams(newParams);
      } else {
        setSearchParams({});
      }

      setQueryParams(prev => ({
        ...prev,
        selectedBucket: bucket,
      }));

      // Reset the flag after a short delay to allow URL to update
      setTimeout(() => {
        isClearingPreviewRef.current = false;
      }, 100);
    },
    [queryParams.projectId, queryParams.configurationTitle, setSearchParams, setFilePreviewActive],
  );

  // Bucket upload hook - handles all upload sources (bucket menu, table toolbar, drag-drop)
  const {
    bucketUploadFileInputRef,
    showUploadPathDialog,
    pendingUploadBucket,
    showDuplicateWarning,
    setShowDuplicateWarning,
    duplicateFilenames,
    onBucketUpload,
    handleBucketFileChange,
    handlePathDialogClose,
    handlePathConfirm,
    handleTableUploadRequest,
    handleCancelDuplicate,
    handleConfirmDuplicate,
  } = useFileUpload({
    selectedProjectId,
    allBuckets,
    queryParams,
    onSelectBucket,
    handlePrefixChange,
    currentPrefix,
  });

  const onStorageChange = useCallback(
    storageTitle => {
      const navigationAction = () => {
        // Clear the selection history when changing storage
        sessionStorage.removeItem(
          `artifacts-had-selection-${queryParams.projectId}-${queryParams.configurationTitle}`,
        );
        setSearchParams({});
        setPreviewFile(null);

        setQueryParams(prev => ({
          ...prev,
          configurationTitle: storageTitle,
          selectedBucket: null,
        }));
      };

      // If previewing a file, show warning and clear preview when confirmed
      if (previewFile) {
        const wrappedNavigationAction = () => {
          setPreviewFile(null);
          navigationAction();
        };
        checkNavigationAllowed(wrappedNavigationAction);
      } else {
        navigationAction();
      }
    },
    [
      checkNavigationAllowed,
      previewFile,
      queryParams.projectId,
      queryParams.configurationTitle,
      setSearchParams,
    ],
  );

  const onPreviewFile = useCallback(
    file => {
      setPreviewFile(file);
      setFilePreviewActive(true);
      if (queryParams.selectedBucket) {
        const fullFilePath = file.key || (currentPrefix ? `${currentPrefix}${file.name}` : file.name);
        setSearchParams({ bucket: queryParams.selectedBucket.name, file: fullFilePath });
      }
    },
    [setFilePreviewActive, queryParams.selectedBucket, currentPrefix, setSearchParams],
  );

  const performFileSelection = useCallback(
    (file, bucket) => {
      if (previewFile) setPreviewFile(null);

      // Select the bucket first if not already selected
      if (!queryParams.selectedBucket || queryParams.selectedBucket.name !== bucket.name) {
        setQueryParams(prev => ({
          ...prev,
          selectedBucket: bucket,
        }));
      }
      // Use file.key if available (from tree selection), otherwise construct from currentPrefix (table selection)
      const fullFilePath = file.key || (currentPrefix ? `${currentPrefix}${file.name}` : file.name);
      const newParams = { bucket: bucket.name, file: fullFilePath };
      setSearchParams(newParams);
      setPreviewFile(file);
      setFilePreviewActive(true);
      setHasUnsavedChanges(false);
    },
    [queryParams.selectedBucket, setFilePreviewActive, previewFile, setSearchParams, currentPrefix],
  );

  // Handle file selection from bucket list
  const onSelectFile = useCallback(
    (file, bucket) => {
      // Check for unsaved changes before switching files
      if (previewFile && hasUnsavedChanges) {
        setPendingFileSelection({ file, bucket });
        setShowUnsavedChangesAlert(true);
        return;
      }

      performFileSelection(file, bucket);
    },
    [previewFile, hasUnsavedChanges, performFileSelection],
  );

  // Handle folder selection from bucket tree (navigates to folder in table)
  const onSelectFolder = useCallback(
    (folderKey, bucket) => {
      isClearingPreviewRef.current = true;
      setPreviewFile(null);

      // Select the bucket first if not already selected
      if (!queryParams.selectedBucket || queryParams.selectedBucket.name !== bucket.name) {
        setQueryParams(prev => ({
          ...prev,
          selectedBucket: bucket,
        }));
      }

      // Update current prefix and URL directly (without going through handlePrefixChange which would re-add the file)
      const normalizedPrefix = ensureTrailingSlash(folderKey);
      setCurrentPrefix(normalizedPrefix);

      // Build complete params once and set URL in a single call to avoid multiple history entries
      const params = { bucket: bucket.name };
      if (normalizedPrefix) {
        params.folder = normalizedPrefix.replace(/\/$/, '');
      }
      setSearchParams(params, { replace: true });

      // Reset the flag after a short delay to allow URL to update
      setTimeout(() => {
        isClearingPreviewRef.current = false;
      }, 100);
    },
    [queryParams.selectedBucket, setSearchParams],
  );

  const handlePathConfirmWithSelection = useCallback(
    folderPath => {
      handlePathConfirm(folderPath, onSelectFolder);
    },
    [handlePathConfirm, onSelectFolder],
  );

  const onCloseFilePreview = useCallback(() => {
    // Mark that we're deliberately clearing the preview to prevent race condition
    isClearingPreviewRef.current = true;

    // Extract parent folder from the current file to keep it selected
    const fileKey = previewFile?.key || searchParams.get('file');
    let parentFolder = '';
    if (fileKey) {
      const lastSlashIndex = fileKey.lastIndexOf('/');
      if (lastSlashIndex > -1) {
        parentFolder = fileKey.substring(0, lastSlashIndex + 1);
      }
    }

    setPreviewFile(null);
    setFilePreviewActive(false); // Clear preview state in context
    setHasUnsavedChanges(false);

    const bucketName = searchParams.get('bucket');
    if (bucketName) {
      const params = { bucket: bucketName };
      if (parentFolder) {
        params.folder = parentFolder;
      }
      setSearchParams(params);
    } else {
      setSearchParams({});
    }

    // Reset the flag after a short delay to allow URL to update
    setTimeout(() => {
      isClearingPreviewRef.current = false;
    }, 100);
  }, [setFilePreviewActive, searchParams, setSearchParams, previewFile]);

  const onUnsavedChangesUpdate = useCallback(hasChanges => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  const onBucketsCollapsed = useCallback(() => {
    setCollapsedBuckets(prev => !prev);
  }, []);

  const handleUnsavedChangesConfirm = useCallback(() => {
    setShowUnsavedChangesAlert(false);
    setHasUnsavedChanges(false);

    if (pendingFileSelection) {
      const { file, bucket } = pendingFileSelection;
      setPendingFileSelection(null);

      performFileSelection(file, bucket);
    }
  }, [pendingFileSelection, performFileSelection]);

  const handleUnsavedChangesCancel = useCallback(() => {
    setShowUnsavedChangesAlert(false);
    setPendingFileSelection(null);
  }, []);

  const [isHandlingNavigationState, setIsHandlingNavigationState] = useState(false);

  // Calculate available table width for responsive column management
  const tableWidth = useMemo(() => {
    // Table uses full width minus sidebar and padding
    return windowWidth - leftPanelWidth - 32; // 32px for padding
  }, [windowWidth, leftPanelWidth]);

  // Handle bucket selection from sessionStorage (e.g., after editing/creating a bucket)
  useEffect(() => {
    const pendingBucket = sessionStorage.getItem(PENDING_BUCKET_SESSION_KEY);
    if (pendingBucket && queryParams.configurationTitle) {
      setIsHandlingNavigationState(true);

      if (allBuckets.length === 0) {
        return;
      }

      const targetBucket = allBuckets.find(bucket => bucket.name === pendingBucket);

      // Always clean up regardless of whether bucket was found
      sessionStorage.removeItem(PENDING_BUCKET_SESSION_KEY);

      if (targetBucket) {
        setQueryParams(prev => ({
          ...prev,
          selectedBucket: targetBucket,
        }));
        setSearchParams({ bucket: targetBucket.name });
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        setIsHandlingNavigationState(false);
      }, NAVIGATION_STATE_TIMEOUT.RESET_DELAY);
    }
  }, [allBuckets, queryParams.configurationTitle, setQueryParams, setSearchParams]);

  // Auto-select bucket on initial load (most recently active first)
  useEffect(
    () => {
      // Only auto-select if:
      // 1. We have buckets loaded
      // 2. There's no currently selected bucket
      // 3. We're not handling navigation state
      // 4. We have a storage integration selected
      if (
        allBuckets.length > 0 &&
        !queryParams.selectedBucket &&
        !isHandlingNavigationState &&
        queryParams.configurationTitle
      ) {
        let bucketToSelect = null;

        const bucketFromUrl = searchParams.get('bucket');
        if (bucketFromUrl) {
          bucketToSelect = allBuckets.find(b => b.name === bucketFromUrl);
        }

        // Fallback: select most recent if URL bucket not found
        if (!bucketToSelect) {
          const sortedBuckets = sortBucketsByRecent(allBuckets);
          bucketToSelect = sortedBuckets[0];
        }

        if (bucketToSelect) {
          setQueryParams(prev => ({
            ...prev,
            selectedBucket: bucketToSelect,
          }));

          // Mark that we've had a selection for this project/storage combination
          sessionStorage.setItem(
            `artifacts-had-selection-${queryParams.projectId}-${queryParams.configurationTitle}`,
            'true',
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      allBuckets,
      isHandlingNavigationState,
      queryParams.configurationTitle,
      queryParams.projectId,
      searchParams,
    ],
  );

  // Auto-open file from URL search params and restore folder path when bucket and buckets data are available
  useEffect(() => {
    // Skip if we're deliberately clearing the preview (prevents race condition with URL updates)
    if (isClearingPreviewRef.current) {
      return;
    }

    if (queryParams.selectedBucket && !isHandlingNavigationState && allBuckets.length > 0) {
      const fileNameFromUrl = searchParams.get('file');
      const folderFromUrl = searchParams.get('folder');
      const bucketNameFromUrl = searchParams.get('bucket');

      // Only restore file if the bucket in URL matches the selected bucket
      // This prevents restoring an old file when switching buckets (race condition)
      if (fileNameFromUrl && bucketNameFromUrl === queryParams.selectedBucket.name && !previewFile) {
        const lastSlashIndex = fileNameFromUrl.lastIndexOf('/');
        const folderPath = lastSlashIndex > -1 ? fileNameFromUrl.substring(0, lastSlashIndex + 1) : '';
        const fileName =
          lastSlashIndex > -1 ? fileNameFromUrl.substring(lastSlashIndex + 1) : fileNameFromUrl;

        if (folderPath) {
          const normalizedFolderPath = ensureTrailingSlash(folderPath);
          setCurrentPrefix(prevPrefix =>
            prevPrefix !== normalizedFolderPath ? normalizedFolderPath : prevPrefix,
          );
        }

        const fileToPreview = {
          name: fileName,
          key: fileNameFromUrl,
        };
        setPreviewFile(fileToPreview);
        setFilePreviewActive(true);
      } else if (folderFromUrl && bucketNameFromUrl === queryParams.selectedBucket.name && !fileNameFromUrl) {
        // Only restore folder path from URL if there's NO file in URL
        // (when browsing folders without selecting a file)
        const normalizedFolderPath = ensureTrailingSlash(folderFromUrl);
        setCurrentPrefix(prevPrefix =>
          prevPrefix !== normalizedFolderPath ? normalizedFolderPath : prevPrefix,
        );
      }
    }
  }, [
    queryParams.selectedBucket,
    previewFile,
    isHandlingNavigationState,
    allBuckets,
    searchParams,
    setFilePreviewActive,
  ]);

  useEffect(() => {
    if (isSuccess && storageConfigurations.length && !queryParams.configurationTitle) {
      const first = storageConfigurations[0] || {};
      const resolvedTitle = first.title || first.elitea_title || first.name;
      setQueryParams(prev => ({
        ...prev,
        storage: [first.title || first.elitea_title || first.name].filter(Boolean),
        configurationTitle: resolvedTitle,
      }));
    }
  }, [storageConfigurations, isSuccess, queryParams.configurationTitle]);

  useEffect(() => {
    if (selectedProjectId !== queryParams.projectId) {
      // Clear artifact slice state when project changes
      dispatch(actions.setBucket(null));
      setPreviewFile(null); // Clear preview file
      setFilePreviewActive(false); // Clear preview state in context
      setIsHandlingNavigationState(false); // Reset navigation state
      // Clear bucket from URL when project changes
      setSearchParams({});

      // IMPORTANT: sync local query params with the newly selected project
      // This enables config and bucket queries that depend on projectId
      setQueryParams(prev => ({
        ...prev,
        projectId: selectedProjectId,
        selectedBucket: null,
        storage: [],
        configurationTitle: '',
        search: '',
      }));
    }
  }, [selectedProjectId, queryParams.projectId, dispatch, setFilePreviewActive, setSearchParams]);

  // Clear selected bucket if it doesn't belong to the current project
  useEffect(() => {
    if (queryParams.selectedBucket && queryParams.projectId && selectedProjectId) {
      // If the selected bucket has a different project context, clear it
      // This handles edge cases where bucket state persists across project switches
      if (queryParams.projectId !== selectedProjectId) {
        setQueryParams(prev => ({
          ...prev,
          selectedBucket: null,
        }));
      }
    }
  }, [queryParams.selectedBucket, queryParams.projectId, selectedProjectId]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear file preview state when leaving Artifacts page
      setFilePreviewActive(false);
    };
  }, [setFilePreviewActive]);

  return (
    <>
      {/* Hidden file input for bucket upload */}
      <input
        ref={bucketUploadFileInputRef}
        type="file"
        multiple
        accept="*/*"
        style={{ display: 'none' }}
        onChange={handleBucketFileChange}
      />

      <UploadingStatus />
      <Box sx={styles.rootBox} />
      <Box sx={styles.rootContainer}>
        {/* Main Content Area with Canvas-like Grid Layout */}
        <Box sx={styles.mainContentContainer}>
          {/* Buckets Sidebar */}
          <Box sx={styles.bucketSidebarBox}>
            <Buckets
              key={`${queryParams.projectId}-${queryParams.configurationTitle}`}
              projectId={queryParams.projectId}
              configurationTitle={queryParams.configurationTitle}
              storageConfigurations={storageConfigurations}
              onSelectBucket={onSelectBucket}
              selectedBucket={queryParams.selectedBucket}
              selectedFile={previewFile}
              currentPrefix={currentPrefix}
              collapsed={collapsedBuckets}
              onCollapsed={onBucketsCollapsed}
              onCreateBucket={onAddBucket}
              onStorageChange={onStorageChange}
              onBucketsDataChange={onBucketsDataChange}
              onUpload={onBucketUpload}
              onSelectFile={onSelectFile}
              onSelectFolder={onSelectFolder}
              // storageUsage={storageUsage}
              // storageUsageRatio={storageUsageRatio}
            />
          </Box>

          <Box sx={styles.mainContentAreaBox}>
            {previewFile ? (
              <Box sx={styles.contentBox}>
                <FilePreviewCanvas
                  key={`${previewFile.name}-${queryParams.selectedBucket?.name}`}
                  file={previewFile}
                  projectId={queryParams.projectId}
                  bucket={queryParams.selectedBucket?.name}
                  onClose={onCloseFilePreview}
                  onDeleted={refetchBuckets}
                  onUnsavedChangesUpdate={onUnsavedChangesUpdate}
                />
              </Box>
            ) : (
              <Box sx={styles.contentBox}>
                <ArtifactTable
                  bucket={queryParams.selectedBucket?.name}
                  key={`${queryParams.projectId}-${queryParams.selectedBucket?.name || 'no'}`}
                  projectId={queryParams.projectId}
                  onPreviewFile={onPreviewFile}
                  selectedBucketData={queryParams.selectedBucket}
                  tableWidth={tableWidth}
                  currentPrefix={currentPrefix}
                  onPrefixChange={handlePrefixChange}
                  onUploadRequest={handleTableUploadRequest}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <AlertDialog
        alarm
        title="Warning"
        alertContent="You have unsaved changes. Do you want to discard current changes and continue?"
        open={showUnsavedChangesAlert}
        onClose={handleUnsavedChangesCancel}
        onCancel={handleUnsavedChangesCancel}
        onConfirm={handleUnsavedChangesConfirm}
      />

      <AlertDialogV2
        alarm
        title="Warning"
        open={showDuplicateWarning}
        setOpen={setShowDuplicateWarning}
        extraContent={<DuplicateDialogContent duplicateFilenames={duplicateFilenames} />}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
        confirmButtonTitle="Proceed"
      />

      <UploadPathDialog
        open={showUploadPathDialog}
        onClose={handlePathDialogClose}
        onConfirm={handlePathConfirmWithSelection}
        bucket={pendingUploadBucket}
        currentPrefix={currentPrefix}
      />
    </>
  );
}

const artifactsStyles = (collapsedBuckets, leftPanelWidth) => ({
  rootBox: {
    width: '100%',
    height: '0.0625rem',
  },
  rootContainer: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    overflow: 'hidden',
    height: 'calc(100dvh)', // Just account for the top border (1px) + top offset (17px)
    backgroundColor: palette.background.tabPanel,
    gap: '0.75rem',
  }),
  mainContentContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  bucketSidebarBox: ({ palette }) => ({
    width: collapsedBuckets ? '3.75rem' : `${leftPanelWidth}px`,
    height: '100%',
    backgroundColor: palette.background.default,
    borderRight: `0.0625rem solid ${palette.border.lines}`,
    transition: 'width 0.2s ease-in-out',
    overflow: 'auto',
    flexShrink: 0,
  }),
  mainContentAreaBox: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  contentBox: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  deleteModal: {
    paper: { maxWidth: '30rem' },
  },
});

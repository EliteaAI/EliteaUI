import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { format } from 'date-fns';
import { useSelector } from 'react-redux';

import {
  SortComparators,
  usePagination,
  useResponsiveColumns,
  useRowSelection,
  useTableSort,
} from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { useArtifactListQuery, useDeleteArtifactMutation, useDeleteArtifactsMutation } from '@/api/artifacts';
import { buildErrorMessage, downloadFileFromArtifact } from '@/common/utils';
import FolderIcon from '@/components/Icons/FolderIcon';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useToast from '@/hooks/useToast';
import { canPreviewFile, formatFileSize, isFileSizePreviewableFlexible } from '@/utils/filePreview';
import { getFileTypeName } from '@/utils/fileTypes';

import {
  expandFoldersToAllItems,
  getItemsAtCurrentLevel,
  getItemsUnderFolder,
  parsePrefixToBreadcrumbs,
} from '../Components/utils/getItemsAtCurrentLevel';
import { useZipDownload } from '../hooks/useZipDownload.hooks';
import ArtifactRowActions from './ArtifactRowActions';
import ArtifactTableContainer from './ArtifactTableContainer';
import ArtifactTableNoFiles from './ArtifactTableNoFiles';
import ArtifactTableToolbar from './ArtifactTableToolbar';
import ZipDownloadProgressDialog from './ZipDownloadProgressDialog';
import { ARTIFACT_TYPES } from './constants';

const ARTIFACT_TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 0,
  DOWNLOAD_DELAY_MS: 100,
  UPLOAD_REFETCH_DELAY: 500,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  DATE_FORMAT: 'dd-MM-yyyy, hh:mm a',
};

const ARTIFACT_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'fileType', label: 'Type', width: '1fr', sortable: true, hideBelow: 550 },
  { field: 'size', label: 'Size', width: '1fr', sortable: true, hideBelow: 700 },
  {
    field: 'modified',
    label: 'Last update',
    width: '1fr',
    sortable: true,
    hideBelow: 900,
    displayField: 'modifiedDisplay',
  },
  { field: 'actions', label: 'Actions', width: '7rem', sortable: false },
];

export default function ArtifactTable(props) {
  const {
    bucket,
    projectId,
    onPreviewFile,
    selectedBucketData,
    tableWidth,
    currentPrefix,
    onPrefixChange,
    onUploadRequest,
  } = props;
  const { toastError, toastSuccess } = useToast();
  const { windowWidth } = useGetWindowWidth();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Breadcrumb segments for current path
  const breadcrumbs = useMemo(() => parsePrefixToBreadcrumbs(currentPrefix || ''), [currentPrefix]);

  const { zipDownloadProgress, startZipDownload, cancelZipDownload } = useZipDownload();
  const fileInputRef = useRef(null);

  const effectiveWidth = useMemo(() => {
    return tableWidth || windowWidth;
  }, [tableWidth, windowWidth]);

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: ARTIFACT_COLUMNS,
    containerWidth: effectiveWidth,
    actionsColumnWidth: ARTIFACT_COLUMNS.find(col => col.field === 'actions')?.width || '8.25rem',
    showCheckbox: true,
  });

  const [
    deleteArtifact,
    { isError: isDeleteArtifactError, isSuccess: isDeleteArtifactSuccess, error: deleteArtifactError },
  ] = useDeleteArtifactMutation();

  const [
    deleteArtifacts,
    { isError: isDeleteArtifactsError, isSuccess: isDeleteArtifactsSuccess, error: deleteArtifactsError },
  ] = useDeleteArtifactsMutation();

  const { data, isFetching, isError, error, refetch } = useArtifactListQuery(
    {
      projectId,
      bucket,
    },
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      pollingInterval: 0,
      skip:
        !projectId ||
        !bucket ||
        typeof bucket !== 'string' ||
        bucket.trim() === '' ||
        projectId === 'null' ||
        projectId === 'undefined',
    },
  );

  const { uploadFinished, isUploading, fileStatuses } = useSelector(state => state.upload);

  const rows = useMemo(() => {
    if (isError) {
      return [];
    }

    const uploadingFilesMap = new Map((fileStatuses || []).map(f => [f.filename, f]));

    const uploadingRows = (fileStatuses || []).map(file => ({
      id: file.filename,
      name: file.filename,
      size: '-',
      modified: 'Uploading...',
      fileType: getFileTypeName(file.filename),
      type: ARTIFACT_TYPES.FILE,
      uploading: true,
      uploadProgress: file.uploadProgress,
      canPreview: canPreviewFile(file.filename) && isFileSizePreviewableFlexible({ size: '-' }),
    }));

    // Transform API response (flat contents list) to table rows
    const contents = data?.contents ?? [];
    const itemsAtCurrentLevel = getItemsAtCurrentLevel(contents, currentPrefix || '');

    const existingRows = itemsAtCurrentLevel.map(item => {
      const displayName = item.name;
      const canPreview = item.isFile && canPreviewFile(displayName) && isFileSizePreviewableFlexible(item);

      return {
        ...item,
        id: item.name,
        key: item.key || (currentPrefix ? `${currentPrefix}${item.name}` : item.name),
        fileType: item.isFile ? getFileTypeName(displayName) : undefined,
        type: item.type,
        uploading: false,
        canPreview,
        size: item.size ? formatFileSize(item.size) : '-',
        modified: item.lastModified || null, // Keep original date for sorting
        modifiedDisplay: item.lastModified
          ? format(new Date(item.lastModified), ARTIFACT_TABLE_CONFIG.DATE_FORMAT)
          : '-',
      };
    });

    if (isUploading) {
      const existingFileNames = new Set(existingRows.map(row => row.name));
      const newUploadingFiles = uploadingRows.filter(
        uploadingFile => !existingFileNames.has(uploadingFile.name),
      );

      const updatedExistingRows = existingRows.map(existingRow => {
        const uploadingFile = uploadingFilesMap.get(existingRow.name);
        if (uploadingFile) {
          return {
            id: uploadingFile.filename,
            name: uploadingFile.filename,
            size: '-',
            modified: 'Uploading...',
            fileType: getFileTypeName(uploadingFile.filename),
            type: ARTIFACT_TYPES.FILE,
            uploading: true,
            uploadProgress: uploadingFile.uploadProgress,
            canPreview: false,
          };
        }
        return existingRow;
      });

      return [...newUploadingFiles, ...updatedExistingRows];
    } else {
      return existingRows;
    }
  }, [data?.contents, fileStatuses, isError, isUploading, currentPrefix]);

  const { sortConfig, handleSort, sortData, resetSort } = useTableSort({
    defaultField: 'modified',
    defaultDirection: 'desc',
    comparators: {
      size: SortComparators.fileSize,
      modified: SortComparators.date,
    },
  });

  const sortedRows = useMemo(() => {
    const uploading = rows.filter(row => row.uploading);
    const nonUploading = rows.filter(row => !row.uploading);

    const folders = nonUploading.filter(row => row.type === ARTIFACT_TYPES.FOLDER);
    const files = nonUploading.filter(row => row.type !== ARTIFACT_TYPES.FOLDER);

    const sortedFolders = sortData(folders);
    const sortedFiles = sortData(files);

    return [...uploading, ...sortedFolders, ...sortedFiles];
  }, [sortData, rows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return sortedRows;

    const lowerQuery = searchQuery.toLowerCase();
    const uploading = sortedRows.filter(row => row.uploading);
    const filteredNonUploading = sortedRows.filter(
      row => !row.uploading && row.name?.toLowerCase().includes(lowerQuery),
    );

    return [...uploading, ...filteredNonUploading];
  }, [sortedRows, searchQuery]);

  const handleSearchChange = useCallback(value => {
    setSearchQuery(value);
  }, []);

  const handleDragFile = useCallback(
    event => {
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        onUploadRequest?.(Array.from(files));
      }
    },
    [onUploadRequest],
  );

  const handleFileInputChange = useCallback(
    event => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onUploadRequest?.(Array.from(files));
      }
      event.target.value = '';
    },
    [onUploadRequest],
  );

  const selectableRows = useMemo(() => filteredRows.filter(row => !row.uploading), [filteredRows]);

  const {
    selectedIds: rowSelectionModel,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
  } = useRowSelection({ rows: selectableRows, idField: 'id' });

  const styles = artifactTableStyles();

  const pagination = usePagination({
    totalRows: filteredRows.length,
    defaultPageSize: ARTIFACT_TABLE_CONFIG.DEFAULT_PAGE_SIZE,
    pageSizeOptions: ARTIFACT_TABLE_CONFIG.PAGE_SIZE_OPTIONS,
  });

  const { paginateData, handlePageChange } = pagination;

  const paginatedRows = useMemo(() => paginateData(filteredRows), [paginateData, filteredRows]);

  const bucketContents = useMemo(() => data?.contents ?? [], [data?.contents]);

  // Handle folder navigation
  const handleFolderClick = useCallback(
    row => {
      if (row.type === ARTIFACT_TYPES.FOLDER && onPrefixChange) {
        onPrefixChange(row.key);
        clearSelection();
        handlePageChange(0);
      }
    },
    [onPrefixChange, clearSelection, handlePageChange],
  );

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback(
    path => {
      if (onPrefixChange) {
        onPrefixChange(path);
        clearSelection();
        handlePageChange(0);
      }
    },
    [onPrefixChange, clearSelection, handlePageChange],
  );

  // Handle row click - navigate into folder or preview file
  const handleRowClick = useCallback(
    row => {
      if (row.type === ARTIFACT_TYPES.FOLDER) {
        handleFolderClick(row);
      }
    },
    [handleFolderClick],
  );

  const onDownload = useCallback(
    row => {
      // Use the full key path from the row to avoid prefix/name drift
      const filename = row.key;
      downloadFileFromArtifact({
        projectId,
        bucket,
        filename,
        handleError: err => {
          toastError('Download file error: ' + err.message);
        },
      });
    },
    [bucket, projectId, toastError],
  );

  const onPreview = useCallback(
    row => {
      onPreviewFile(row);
    },
    [onPreviewFile],
  );

  const onDeleteArtifact = useCallback(
    row => {
      if (row.type === ARTIFACT_TYPES.FOLDER) {
        const itemsToDelete = getItemsUnderFolder(bucketContents, row.key);

        if (itemsToDelete.length > 0) {
          deleteArtifacts({
            projectId,
            bucket,
            fname: itemsToDelete,
          });
        }
      } else {
        // For files, use the key which already has the correct full path
        deleteArtifact({
          projectId,
          bucket,
          artifact: row.key,
        });
      }
    },
    [bucket, deleteArtifact, deleteArtifacts, projectId, bucketContents],
  );

  const onDeleteArtifacts = useCallback(() => {
    const selectedItems = sortedRows.filter(row => rowSelectionModel.includes(row.id));

    const filenames = expandFoldersToAllItems(selectedItems, bucketContents);

    if (filenames.length === 0) {
      toastError('No items to delete');
      return;
    }

    deleteArtifacts({ projectId, bucket, fname: filenames });
  }, [bucket, deleteArtifacts, projectId, rowSelectionModel, sortedRows, bucketContents, toastError]);

  const onDownloadFiles = useCallback(() => {
    if (rowSelectionModel.length === 0) {
      toastError('Please select files to download');
      return;
    }

    const selectedFiles = sortedRows.filter(row => rowSelectionModel.includes(row.id));

    if (selectedFiles.length === 1 && selectedFiles[0].type !== ARTIFACT_TYPES.FOLDER) {
      const row = selectedFiles[0];
      // Use the full key path from the row to avoid prefix/name drift
      const filename = row.key;
      downloadFileFromArtifact({
        projectId,
        bucket,
        filename,
        handleError: err => {
          toastError('Download file error: ' + err.message);
        },
      });
    } else {
      // Download folder(s) or multiple files as ZIP using custom hook
      // Use the key property which already has the correct full path with trailing / for folders
      const filenames = selectedFiles.map(row => row.key);
      startZipDownload({ projectId, bucket, filenames, bucketContents, currentPrefix });
    }
  }, [
    bucket,
    projectId,
    rowSelectionModel,
    sortedRows,
    toastError,
    startZipDownload,
    currentPrefix,
    bucketContents,
  ]);

  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  useEffect(() => {
    if (isDeleteArtifactsSuccess) {
      toastSuccess('The artifacts have been deleted successfully');
    } else if (isDeleteArtifactSuccess) {
      toastSuccess('The artifact has been deleted successfully');
    }
  }, [isDeleteArtifactsSuccess, isDeleteArtifactSuccess, toastSuccess]);

  useEffect(() => {
    const errors = [
      { isError: isDeleteArtifactsError, error: deleteArtifactsError },
      { isError: isDeleteArtifactError, error: deleteArtifactError },
      { isError, error },
    ];

    errors.forEach(({ isError: hasError, error: errorObj }) => {
      if (hasError && errorObj) {
        toastError(buildErrorMessage(errorObj));
      }
    });
  }, [
    isDeleteArtifactsError,
    deleteArtifactsError,
    isDeleteArtifactError,
    deleteArtifactError,
    isError,
    error,
    toastError,
  ]);

  useEffect(() => {
    resetSort();
    handlePageChange(0);
    clearSelection();
  }, [bucket, handlePageChange, clearSelection, resetSort]);

  useEffect(() => {
    if (uploadFinished && !isUploading && bucket && projectId) {
      const timeoutId = setTimeout(() => {
        refetch();
      }, ARTIFACT_TABLE_CONFIG.UPLOAD_REFETCH_DELAY);

      return () => clearTimeout(timeoutId);
    }
  }, [uploadFinished, isUploading, bucket, projectId, refetch]);

  return (
    <>
      <ArtifactTableContainer
        onDrop={handleDragFile}
        toolbar={
          <ArtifactTableToolbar
            fileInputRef={fileInputRef}
            handleFileChange={handleFileInputChange}
            selectedBucketData={selectedBucketData}
            fileCount={rows.length}
            onDownloadFiles={onDownloadFiles}
            rowSelectionModel={rowSelectionModel}
            handleUploadClick={handleUploadClick}
            bucket={bucket}
            onDeleteArtifacts={onDeleteArtifacts}
            totalRows={rows.length}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={handleBreadcrumbClick}
            currentPrefix={currentPrefix}
          />
        }
        isLoading={isFetching}
        loadingMessage="Loading..."
      >
        {paginatedRows.length === 0 && !isFetching ? (
          <ArtifactTableNoFiles
            message="No files in this bucket"
            onUpload={handleUploadClick}
          />
        ) : (
          <>
            <GridTableHeader
              columns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              gridTemplateColumns={gridTemplateColumns}
            />

            <GridTableBody>
              {paginatedRows.map(row => (
                <GridTableRow
                  key={row.id}
                  row={row}
                  isSelected={rowSelectionModel.includes(row.id)}
                  isHovered={hoveredRowId === row.id}
                  onSelect={handleSelectRow}
                  onClick={() => handleRowClick(row)}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  gridTemplateColumns={gridTemplateColumns}
                  columns={dataColumns}
                  namePrefix={
                    row.type === ARTIFACT_TYPES.FOLDER ? <FolderIcon sx={styles.folderIcon} /> : null
                  }
                  sx={row.type === ARTIFACT_TYPES.FOLDER ? styles.folderRow : undefined}
                  actions={
                    <ArtifactRowActions
                      row={row}
                      onPreview={onPreview}
                      onDownload={onDownload}
                      onDelete={onDeleteArtifact}
                    />
                  }
                  isLoading={row.uploading}
                  loadingProgress={row.uploadProgress}
                />
              ))}
            </GridTableBody>

            {filteredRows.length > 0 && <GridTablePagination {...pagination} />}
          </>
        )}
      </ArtifactTableContainer>

      <ZipDownloadProgressDialog
        open={zipDownloadProgress.isOpen}
        progress={zipDownloadProgress}
        bucket={bucket}
        onCancel={cancelZipDownload}
      />
    </>
  );
}

/** @type {MuiSx} */
const artifactTableStyles = () => ({
  folderIcon: ({ palette }) => ({
    fontSize: '1.125rem',
    color: palette.icon.fill.secondary,
  }),
  folderRow: {
    cursor: 'pointer',
  },
});

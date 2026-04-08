import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, Skeleton } from '@mui/material';

import { usePagination, useResponsiveColumns, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import {
  useSecretRowActions,
  useSecretRowUpdate,
  useSecretVisibility,
} from '@/[fsd]/features/settings/lib/hooks';
import {
  EditSecretInputGridTable,
  SecretActionsMenu,
  SecretValueCell,
} from '@/[fsd]/features/settings/ui/secrets';
import { Modal, Text } from '@/[fsd]/shared/ui';
import {
  useLazySecretShowQuery,
  useSecretAddingMutation,
  useSecretDeleteMutation,
  useSecretEditingMutation,
  useSecretHideMutation,
} from '@/api/secrets.js';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import AlertDialog from '@/components/AlertDialog';
import CheckIcon from '@/components/Icons/CheckIcon.jsx';
import CloseIcon from '@/components/Icons/CloseIcon.jsx';
import CopyIcon from '@/components/Icons/CopyIcon.jsx';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon.jsx';
import useCheckPermission from '@/hooks/useCheckPermission';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useToast from '@/hooks/useToast.jsx';
import { isSafari } from '@/utils/browserUtils.js';

const SECRETS_TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 50, 100],
};

const SECRETS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'secretValue', label: 'Value', width: '2fr', sortable: false, hideBelow: 600 },
  { field: 'actions', label: 'Actions', width: '8.25rem', sortable: false },
];

const SecretsTable = memo(props => {
  const { isFetching, rows, setRows, setRowModesModel, rowModesModel, projectId, refetch } = props;

  const { windowWidth } = useGetWindowWidth();
  const isSafariBrowser = isSafari();
  const styles = getStyles(isSafariBrowser);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [editingRowsBackup, setEditingRowsBackup] = useState({});
  const { checkPermission } = useCheckPermission();

  const [addSecret, { isError: isAddingError, error: addingError }] = useSecretAddingMutation();
  const [editSecret, { isError: isEditingError, error: editingError }] = useSecretEditingMutation();
  const [deleteSecret] = useSecretDeleteMutation();
  const [showSecret] = useLazySecretShowQuery();
  const [hideSecret] = useSecretHideMutation();
  const { toastError, toastInfo } = useToast();

  // State to force re-render on window resize and sidebar changes
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Get sidebar collapsed state from Redux
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  // Automatically set new rows to edit mode
  useEffect(() => {
    rows.forEach(row => {
      if (row.isNew && rowModesModel[row.id]?.mode !== 'edit') {
        setRowModesModel(prev => ({
          ...prev,
          [row.id]: { mode: 'edit' },
        }));
      }
    });
  }, [rows, rowModesModel, setRowModesModel]);

  // Handle window resize and sidebar layout changes
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force re-render when sidebar state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sideBarCollapsed]);

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: SECRETS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
  });

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });

  const hasNewRow = useMemo(() => rows.some(row => row.isNew), [rows]);

  const filteredRows = useMemo(() => rows.filter(row => row && row.id != null), [rows]);
  const sortedRows = useMemo(() => {
    // Don't sort when there's a new row being created to avoid disrupting the editing state
    if (hasNewRow) {
      return filteredRows;
    }
    return sortData(filteredRows);
  }, [hasNewRow, filteredRows, sortData]);

  const pagination = usePagination({
    totalRows: sortedRows.length,
    defaultPageSize: SECRETS_TABLE_CONFIG.DEFAULT_PAGE_SIZE,
    pageSizeOptions: SECRETS_TABLE_CONFIG.PAGE_SIZE_OPTIONS,
  });

  const { paginateData } = pagination;
  const paginatedRows = useMemo(() => paginateData(sortedRows), [paginateData, sortedRows]);

  // Custom hooks for business logic
  const {
    isShowSecretMap,
    setIsShowSecretMap,
    handleShowSecret,
    handleHideSecret,
    handleHideSecretPermanently,
  } = useSecretVisibility({
    rows,
    setRows,
    showSecret,
    hideSecret,
    projectId,
    toastError,
    refetch,
  });

  const { processRowUpdate } = useSecretRowUpdate({
    projectId,
    addSecret,
    editSecret,
    rows,
    setRows,
    refetch,
  });

  const {
    anchorElMap,
    openAlert,
    openAlertType,
    handleActionsMenuClick,
    handleActionsMenuClose,
    handleEditClick: originalHandleEditClick,
    handleSaveClick: originalHandleSaveClick,
    handleCopyVisibleSecret,
    onClickDelete,
    onClickHide,
    onCloseAlert,
    onConfirmAlert,
  } = useSecretRowActions({
    rows,
    setRows,
    rowModesModel,
    setRowModesModel,
    deleteSecret,
    showSecret,
    projectId,
    toastError,
    toastInfo,
    refetch,
    isShowSecretMap,
    setIsShowSecretMap,
  });

  // Wrap handleEditClick to backup masked value and clear secretValue for editing
  const handleEditClick = useCallback(
    rowId => async event => {
      // Backup the current row data (with masked value) BEFORE calling original handler
      const row = rows.find(r => r.id === rowId);
      if (row) {
        setEditingRowsBackup(prev => ({
          ...prev,
          [rowId]: { ...row },
        }));
      }

      // Call the original edit handler (it fetches the secret)
      await originalHandleEditClick(rowId)(event);

      // Clear the secretValue so input shows empty, not the fetched secret
      setRows(prevRows =>
        prevRows.map(r => {
          if (r.id === rowId && !r.isNew) {
            return { ...r, secretValue: '' };
          }
          return r;
        }),
      );
    },
    [rows, originalHandleEditClick, setRows],
  );

  // Wrap handleCancelClick to restore original row data
  const handleCancelClick = useCallback(
    rowId => event => {
      event?.preventDefault();

      // Check if this is a new row directly from rows state
      const row = rows.find(r => r.id === rowId);
      if (row?.isNew) {
        // Remove new row
        setRows(prevRows => prevRows.filter(r => r.id !== rowId));

        // Clean up the backup if it exists
        setEditingRowsBackup(prev => {
          const newBackup = { ...prev };
          delete newBackup[rowId];
          return newBackup;
        });

        // Remove from rowModesModel completely
        setRowModesModel(prev => {
          const newModel = { ...prev };
          delete newModel[rowId];
          return newModel;
        });
        return;
      }

      const originalRow = editingRowsBackup[rowId];

      if (originalRow) {
        // Restore the original row data (with masked value)
        setRows(prevRows => prevRows.map(r => (r.id === rowId ? originalRow : r)));

        // Clean up the backup
        setEditingRowsBackup(prev => {
          const newBackup = { ...prev };
          delete newBackup[rowId];
          return newBackup;
        });
      }

      // Set row back to view mode
      setRowModesModel(prev => ({
        ...prev,
        [rowId]: { mode: 'view', ignoreModifications: true },
      }));
    },
    [rows, editingRowsBackup, setRows, setRowModesModel],
  );

  // Wrap handleSaveClick to integrate processRowUpdate and cleanup backup
  const handleSaveClick = useCallback(
    rowId => async event => {
      event?.preventDefault();

      // Find the row being edited
      const row = rows.find(r => r.id === rowId);
      if (!row) return;

      try {
        // Call processRowUpdate to save the changes
        await processRowUpdate(row, row);

        // Clean up the backup
        setEditingRowsBackup(prev => {
          const newBackup = { ...prev };
          delete newBackup[rowId];
          return newBackup;
        });

        // Then call the original save handler to update UI state
        originalHandleSaveClick(rowId)(event);
      } catch {
        toastError('Failed to save secret');
      }
    },
    [rows, processRowUpdate, originalHandleSaveClick, toastError],
  );

  useEffect(() => {
    if (isAddingError) {
      toastError(addingError?.status === 403 ? 'The access is not allowed' : buildErrorMessage(addingError));
    }
  }, [addingError, isAddingError, toastError]);

  useEffect(() => {
    if (isEditingError) {
      toastError(
        editingError?.status === 403 ? 'The access is not allowed' : buildErrorMessage(editingError),
      );
    }
  }, [editingError, isEditingError, toastError]);

  // Check if row is in edit mode
  const isRowInEditMode = useCallback(
    rowId => {
      return rowModesModel[rowId]?.mode === 'edit';
    },
    [rowModesModel],
  );

  // Custom name cell component for rendering name field
  const renderNameCell = useCallback(
    ({ row }) => {
      const isEditing = isRowInEditMode(row.id);
      const value = row.name;

      // Only allow editing name for new secrets
      if (isEditing && row.isNew) {
        // Render editable input for name (only for new rows)
        return (
          <EditSecretInputGridTable
            id={row.id}
            value={value}
            field="name"
            row={row}
            setRows={setRows}
            setRowModesModel={setRowModesModel}
          />
        );
      }
      // For existing secrets or view mode, show name as text
      return (
        <Text.EllipsisTypography
          variant="bodyMedium"
          color="text.secondary"
        >
          {value || '-'}
        </Text.EllipsisTypography>
      );
    },
    [isRowInEditMode, setRows, setRowModesModel],
  );

  const renderCell = useCallback(
    (column, value, row) => {
      const isEditing = isRowInEditMode(row.id);

      if (column.field === 'secretValue') {
        if (isEditing) {
          // Render editable input in edit mode
          return (
            <EditSecretInputGridTable
              id={row.id}
              value={value}
              field={column.field}
              row={row}
              setRows={setRows}
              setRowModesModel={setRowModesModel}
            />
          );
        }
        // Render secret value cell in view mode
        return (
          <SecretValueCell
            label={value}
            secretName={row.name}
            value={row.id}
            tooltip={isSafariBrowser ? 'Use copy icon in actions to copy secret' : 'Copy secret'}
            copyMessage={'The secret has been copied to the clipboard'}
            showSecret={showSecret}
            projectId={projectId}
            toastInfo={toastInfo}
          />
        );
      }

      return value || '-';
    },
    [isRowInEditMode, setRowModesModel, setRows, isSafariBrowser, showSecret, projectId, toastInfo],
  );

  const renderActions = useCallback(
    row => {
      const isEditing = isRowInEditMode(row.id);
      const isSecretVisible = isShowSecretMap[row.id];

      if (isEditing) {
        return (
          <Box sx={styles.actionsContainer}>
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={handleSaveClick(row.id)}
              sx={styles.actionButton}
            >
              <CheckIcon sx={styles.checkIcon} />
            </IconButton>
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={handleCancelClick(row.id)}
              sx={styles.actionButton}
            >
              <CloseIcon sx={styles.closeIcon} />
            </IconButton>
          </Box>
        );
      }

      return (
        <Box sx={styles.actionsContainer}>
          {/* Safari-specific copy action - only show when secret is visible */}
          {isSafariBrowser && !row.isNew && isSecretVisible && (
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={handleCopyVisibleSecret(row.id)}
              sx={styles.actionButton}
            >
              <CopyIcon sx={styles.actionIcon} />
            </IconButton>
          )}

          {/* Show/Hide secret action */}
          {checkPermission(PERMISSIONS.secrets.unsecret) && !row.isNew && (
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={isSecretVisible ? () => handleHideSecret(row.id) : () => handleShowSecret(row.id)}
              sx={styles.actionButton}
            >
              {isSecretVisible ? (
                <VisibilityOffIcon sx={styles.actionIcon} />
              ) : (
                <VisibilityIcon sx={styles.actionIcon} />
              )}
            </IconButton>
          )}
          {/* More actions menu */}
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={handleActionsMenuClick(row.id)}
            sx={styles.actionButton}
          >
            <DotsMenuIcon sx={styles.actionIcon} />
          </IconButton>
        </Box>
      );
    },
    [
      isRowInEditMode,
      isShowSecretMap,
      isSafariBrowser,
      handleSaveClick,
      handleCancelClick,
      handleCopyVisibleSecret,
      handleHideSecret,
      handleShowSecret,
      handleActionsMenuClick,
      checkPermission,
      styles,
    ],
  );

  return !isFetching ? (
    <Box
      key={`secrets-table-${windowSize.width}-${windowSize.height}-${sideBarCollapsed}`}
      sx={styles.container}
    >
      <GridTableContainer
        isLoading={false}
        isEmpty={paginatedRows.length === 0}
        emptyMessage="No secrets"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={hasNewRow ? undefined : handleSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {paginatedRows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              isSelected={false}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              columns={dataColumns}
              renderCell={renderCell}
              actions={renderActions(row)}
              showCheckbox={false}
              NameCellComponent={renderNameCell}
            />
          ))}
        </GridTableBody>

        {sortedRows.length > 0 && <GridTablePagination {...pagination} />}
      </GridTableContainer>

      {/* Render menus and dialogs for all rows */}
      {rows
        .filter(row => row && row.id != null)
        .map(row => (
          <Fragment key={`menu-dialog-${row.id}`}>
            <SecretActionsMenu
              rowId={row.id}
              isNew={row.isNew}
              isDefault={row.is_default}
              anchorEl={anchorElMap[row.id]}
              onClose={handleActionsMenuClose(row.id)}
              onEdit={handleEditClick(row.id)}
              onHide={onClickHide(row.id)}
              onDelete={onClickDelete(row.id)}
            />
            <Modal.DeleteEntityModal
              shouldRequestInputName
              name={row.name}
              open={openAlert === row.id && openAlertType === 'delete'}
              onClose={onCloseAlert()}
              onCancel={onCloseAlert()}
              onConfirm={onConfirmAlert(row.id, handleHideSecretPermanently)}
            />
            <AlertDialog
              id={`alert-dialog-${row.id}`}
              title="Hide secret?"
              alertContent={`Are you sure to hide the secret "${row.name}"? Once hidden, the secret will no longer be visible.`}
              open={openAlert === row.id && openAlertType === 'hide'}
              onClose={onCloseAlert()}
              onCancel={onCloseAlert()}
              onConfirm={onConfirmAlert(row.id, handleHideSecretPermanently)}
              alarm={false}
              confirmButtonText="Hide"
            />
          </Fragment>
        ))}
    </Box>
  ) : (
    <Box sx={styles.skeletonContainer}>
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton
          key={`skeleton-row-${index}`}
          sx={styles.skeleton}
          variant="rectangular"
          width={'100%'}
          height={40}
        />
      ))}
    </Box>
  );
});

SecretsTable.displayName = 'SecretsTable';

/** @type {MuiSx} */
const getStyles = () => ({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionButton: {
    padding: '0.375rem',
    minWidth: 0,
    '&:hover': {
      '& svg': {
        fill: ({ palette }) => palette.icon.fill.secondary,
      },
    },
  },
  actionIcon: {
    fontSize: '1rem',
  },
  checkIcon: {
    width: '1rem',
    height: '1rem',
  },
  closeIcon: {
    width: '1.125rem',
    height: '1.125rem',
  },
  skeletonContainer: {
    marginLeft: '1.25rem',
  },
  skeleton: {
    marginBottom: '0.5rem',
  },
});

export default memo(SecretsTable);

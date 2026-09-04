import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Skeleton, Tooltip, Typography } from '@mui/material';

import {
  FOLDER_PERMISSION_LABELS,
  FOLDER_PERMISSION_OPTIONS,
  MAX_FOLDER_PERMISSION_ENTRIES,
} from '@/[fsd]/entities/folder/lib/constants';
import { useResponsiveColumns, useRowSelection, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import { GridTableBody, GridTableHeader, GridTableRow } from '@/[fsd]/entities/grid-table/ui';
import { Button, Text } from '@/[fsd]/shared/ui';
import { AddButton } from '@/[fsd]/shared/ui/button';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { useGetFolderAccessQuery, useRemoveFolderAccessMutation, useSetFolderAccessMutation } from '@/api';
import NoPermissionsIcon from '@/assets/file-lock.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import EditIcon from '@/components/Icons/EditIcon';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import AddFolderPermissionDialog from './AddFolderPermissionDialog';
import EditFolderPermissionDialog from './EditFolderPermissionDialog';

const FOLDER_PERMISSION_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: true, hideBelow: 600 },
  { field: 'access', label: 'Permissions', width: '10rem', sortable: false },
  { field: 'actions', label: '', width: '3.5rem', sortable: false },
];

const FolderPermissionsTable = memo(props => {
  const { folderId } = props;
  const styles = folderPermissionsTableStyles();
  const projectId = useSelectedProjectId();
  const { windowWidth } = useGetWindowWidth();
  const { toastError, toastSuccess } = useToast();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingUsers, setEditingUsers] = useState([]);

  const { data, isLoading, isError, refetch } = useGetFolderAccessQuery(
    { projectId, folderId },
    { skip: !projectId || !folderId },
  );
  const [setFolderAccess, { isLoading: isSaving }] = useSetFolderAccessMutation();
  const [removeFolderAccess, { isLoading: isRemoving }] = useRemoveFolderAccessMutation();
  const isMutating = isSaving || isRemoving;

  const rows = useMemo(
    () =>
      (data?.overrides || []).map(override => ({
        id: override.id,
        userId: override.user_id,
        name: override.user_name || `User ${override.user_id}`,
        email: override.user_email || '-',
        accessValue: override.access_level,
        accessLabel: FOLDER_PERMISSION_LABELS[override.access_level] || override.access_level,
      })),
    [data?.overrides],
  );

  const existingUserIds = useMemo(() => rows.map(row => row.userId), [rows]);
  const total = data?.total ?? rows.length;

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter(
      row =>
        row.name?.toLowerCase().includes(normalizedQuery) ||
        row.email?.toLowerCase().includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });
  const sortedRows = useMemo(() => sortData(filteredRows), [filteredRows, sortData]);

  const {
    selectedIds,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    getSelectedRows,
    selectRows,
  } = useRowSelection({ rows: sortedRows, idField: 'id' });

  const rowIds = useMemo(() => new Set(rows.map(row => row.id)), [rows]);

  useEffect(() => {
    const validSelectedIds = selectedIds.filter(id => rowIds.has(id));
    if (validSelectedIds.length !== selectedIds.length) {
      selectRows(validSelectedIds);
    }
  }, [rowIds, selectRows, selectedIds]);

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: FOLDER_PERMISSION_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: true,
  });

  const selectedCount = selectedIds.length;
  const exceedsBulkLimit = selectedCount > MAX_FOLDER_PERMISSION_ENTRIES;
  const bulkEditDisabled = selectedCount === 0 || exceedsBulkLimit || isMutating;
  const bulkEditTooltip = exceedsBulkLimit
    ? `Select no more than ${MAX_FOLDER_PERMISSION_ENTRIES} users`
    : 'Edit selected';

  const handleSearchChange = useCallback(
    value => {
      setSearchQuery(value);
      clearSelection();
    },
    [clearSelection],
  );

  const renderCell = useCallback((column, value, row) => {
    const displayValue = column.field === 'access' ? row.accessLabel : value;

    return (
      <Text.EllipsisTypography
        variant="bodyMedium"
        color="text.secondary"
      >
        {displayValue || '-'}
      </Text.EllipsisTypography>
    );
  }, []);

  const renderActions = useCallback(
    row => (
      <Box sx={styles.actionsContainer}>
        <Tooltip
          title="Edit exception"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant="icon"
              sx={styles.actionButton}
              onClick={() => setEditingUsers([row])}
              disabled={isMutating}
            >
              <EditIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    ),
    [isMutating, styles.actionsContainer, styles.actionButton, styles.actionIcon],
  );

  const handleBulkEditClick = useCallback(() => {
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0 || selectedRows.length > MAX_FOLDER_PERMISSION_ENTRIES) return;
    setEditingUsers(selectedRows);
  }, [getSelectedRows]);

  const handleAddConfirm = useCallback(
    async ({ users, permission }) => {
      if (isMutating || users.length > MAX_FOLDER_PERMISSION_ENTRIES) return;

      try {
        await setFolderAccess({
          projectId,
          folderId,
          entries: users.map(user => ({
            user_id: user.id,
            access_level: permission,
          })),
        }).unwrap();
        setAddDialogOpen(false);
        toastSuccess(`Added exceptions for ${users.length} user${users.length === 1 ? '' : 's'}`);
      } catch {
        toastError('Failed to add permission exceptions');
      }
    },
    [folderId, isMutating, projectId, setFolderAccess, toastError, toastSuccess],
  );

  const handleEditConfirm = useCallback(
    async ({ permission }) => {
      if (editingUsers.length === 0 || isMutating) return;

      const isRemoval = permission === FOLDER_PERMISSION_OPTIONS.READ_WRITE;
      const userIds = editingUsers.map(user => user.userId);
      const userCount = editingUsers.length;
      const userLabel = userCount === 1 ? editingUsers[0].name : `${userCount} users`;
      const exceptionLabel = userCount === 1 ? 'exception' : 'exceptions';

      try {
        if (isRemoval) {
          await removeFolderAccess({
            projectId,
            folderId,
            userIds,
          }).unwrap();
        } else {
          await setFolderAccess({
            projectId,
            folderId,
            entries: userIds.map(userId => ({ user_id: userId, access_level: permission })),
          }).unwrap();
        }

        toastSuccess(
          isRemoval
            ? `Removed folder permission ${exceptionLabel} for ${userLabel}`
            : `Updated folder permission ${exceptionLabel} for ${userLabel}`,
        );
        setEditingUsers([]);
        clearSelection();
      } catch {
        toastError(
          isRemoval
            ? `Failed to remove folder permission ${exceptionLabel} for ${userLabel}`
            : `Failed to update folder permission ${exceptionLabel} for ${userLabel}`,
        );
      }
    },
    [
      clearSelection,
      editingUsers,
      folderId,
      isMutating,
      projectId,
      removeFolderAccess,
      setFolderAccess,
      toastError,
      toastSuccess,
    ],
  );

  const renderEmptyState = () => (
    <Box sx={styles.emptyStateWrapper}>
      <Box sx={styles.emptyStateContainer}>
        <Box
          component={NoPermissionsIcon}
          sx={styles.emptyStateIcon}
        />
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={styles.emptyStateTitle}
        >
          No exceptions added yet
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.default"
          sx={styles.emptyStateSubtitle}
        >
          Users retain the permissions granted by their project roles.
        </Typography>
        <Button.BaseBtn
          variant="special"
          onClick={() => setAddDialogOpen(true)}
          startIcon={<PlusIcon />}
        >
          Add Exceptions
        </Button.BaseBtn>
      </Box>
    </Box>
  );

  const renderLoadingState = () => (
    <Box sx={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width="100%"
          height="2.5rem"
          sx={styles.skeleton}
        />
      ))}
    </Box>
  );

  const renderErrorState = () => (
    <Box sx={styles.errorState}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Failed to load permission exceptions
      </Typography>
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        onClick={refetch}
      >
        Retry
      </Button.BaseBtn>
    </Box>
  );

  const renderNoResultsState = () => (
    <Box sx={styles.noResultsState}>
      <Typography
        variant="headingSmall"
        color="text.secondary"
      >
        No results
      </Typography>
    </Box>
  );

  const renderTable = () => (
    <Box sx={styles.tableWrapper}>
      <Box sx={styles.tableScrollContainer}>
        <Box sx={styles.stickyHeader}>
          <GridTableHeader
            columns={visibleColumns}
            sortConfig={sortConfig}
            onSort={handleSort}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={true}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
          />
        </Box>
        <GridTableBody sx={styles.tableBodySx}>
          {sortedRows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              isSelected={selectedIds.includes(row.id)}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              columns={dataColumns}
              showCheckbox={true}
              onSelect={handleSelectRow}
              renderCell={renderCell}
              actions={renderActions(row)}
              dataCellSx={styles.dataCell}
            />
          ))}
        </GridTableBody>
      </Box>
    </Box>
  );

  const renderContent = () => {
    if (isLoading) return renderLoadingState();
    if (isError) return renderErrorState();
    if (rows.length === 0) return renderEmptyState();
    if (searchQuery.trim() && sortedRows.length === 0) return renderNoResultsState();
    return renderTable();
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.sectionHeader}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={styles.sectionTitle}
        >
          Exceptions – {total}
        </Typography>
        {rows.length > 0 && (
          <Box sx={styles.actionsRow}>
            <Box sx={styles.searchWrapper}>
              <SimpleSearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                placeholder="Search"
                autoFocus={false}
              />
            </Box>
            <AddButton
              tooltip="Add exception"
              onAdd={() => {
                if (!isMutating) setAddDialogOpen(true);
              }}
            />
            <Tooltip
              title={bulkEditTooltip}
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  variant="icon"
                  sx={styles.bulkEditButton}
                  onClick={handleBulkEditClick}
                  disabled={bulkEditDisabled}
                >
                  <EditIcon sx={styles.actionIcon} />
                </Button.BaseBtn>
              </Box>
            </Tooltip>
          </Box>
        )}
      </Box>

      {renderContent()}

      <AddFolderPermissionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddConfirm}
        projectId={projectId}
        existingUserIds={existingUserIds}
        loading={isMutating}
      />

      <EditFolderPermissionDialog
        open={editingUsers.length > 0}
        onClose={() => setEditingUsers([])}
        onConfirm={handleEditConfirm}
        users={editingUsers}
        loading={isMutating}
      />
    </Box>
  );
});

FolderPermissionsTable.displayName = 'FolderPermissionsTable';

export default FolderPermissionsTable;

const folderPermissionsTableStyles = () => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  sectionHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    minHeight: '4.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  sectionTitle: {
    fontWeight: 600,
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.6rem',
  },
  searchWrapper: {
    minWidth: '12.5rem',
  },
  tableWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    overflow: 'hidden',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  tableScrollContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
    backgroundColor: palette.background.default.secondary,
    borderRadius: '0.5rem',
  }),
  tableBodySx: {
    '& > div': {
      backgroundColor: 'transparent !important',
    },
  },
  stickyHeader: ({ palette }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: palette.background.default.secondary,
  }),
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionIcon: {
    width: '1rem',
    height: '1rem',
  },
  actionButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
    '&.Mui-disabled': {
      opacity: 0.5,
    },
  }),
  bulkEditButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
    '&.Mui-disabled': {
      opacity: 0.5,
    },
  }),
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0rem 1rem',
  },
  skeletonContainer: {
    width: '100%',
    padding: '1rem 1.5rem',
  },
  skeleton: {
    marginBottom: '0.5rem',
  },
  errorState: ({ palette }) => ({
    flex: 1,
    minHeight: '25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    margin: '0 1.5rem 1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  noResultsState: ({ palette }) => ({
    flex: 1,
    minHeight: '12.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 1.5rem 1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  emptyStateWrapper: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.default.secondary,
    minHeight: '25rem',
  }),
  emptyStateContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '4rem',
    gap: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  emptyStateIcon: ({ palette }) => ({
    width: '2.5rem',
    height: '2.5rem',
    color: palette.icon.fill.default,
    opacity: 0.6,
  }),
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: '-0.5rem',
    textAlign: 'center',
  },
});

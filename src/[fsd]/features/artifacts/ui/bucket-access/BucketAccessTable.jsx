import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Skeleton, Tooltip, Typography } from '@mui/material';

import { useResponsiveColumns, useRowSelection, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { BucketAccessConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { BucketAccessHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { Button, Text } from '@/[fsd]/shared/ui';
import { AddButton } from '@/[fsd]/shared/ui/button';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { useUserListQuery } from '@/api/admin';
import {
  useCreateS3CredentialsMutation,
  useListBucketPermissionsQuery,
  useSetBucketPermissionsMutation,
} from '@/api/artifacts';
import NoPermissionsIcon from '@/assets/file-lock.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import EditIcon from '@/components/Icons/EditIcon';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useToast from '@/hooks/useToast';

import AddBucketUserDialog from './AddBucketUserDialog';
import EditBucketUserDialog from './EditBucketUserDialog';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const BUCKET_ACCESS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: true, hideBelow: 600 },
  { field: 'access', label: 'Permissions', width: '10rem', sortable: false },
  { field: 'actions', label: '', width: '3.5rem', sortable: false },
];

const BucketAccessTable = memo(props => {
  const { bucket, projectId, renderToolbarControls, hidePagination = false } = props;

  const styles = useMemo(() => bucketAccessTableStyle(), []);

  const { windowWidth } = useGetWindowWidth();
  const { toastError, toastSuccess } = useToast();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUsers, setEditingUsers] = useState([]);
  const [optimisticUsers, setOptimisticUsers] = useState([]);

  const { data: permissionsData, isLoading: isLoadingPerms } = useListBucketPermissionsQuery(
    { projectId },
    { skip: !projectId },
  );

  const { data: usersData, isLoading: isLoadingUsers } = useUserListQuery(
    { projectId, page: 0, pageSize: 100 },
    { skip: !projectId },
  );

  const [setBucketPermissions, { isLoading: isSaving }] = useSetBucketPermissionsMutation();
  const [createS3Credentials, { isLoading: isCreatingCreds }] = useCreateS3CredentialsMutation();

  const isFetching = isLoadingPerms || isLoadingUsers;
  const isMutating = isSaving || isCreatingCreds;

  const credsByUserId = useMemo(() => {
    if (!Array.isArray(permissionsData?.rows)) return {};
    const map = {};
    for (const cred of permissionsData.rows) {
      if (!map[cred.user_id]) map[cred.user_id] = [];
      map[cred.user_id].push(cred);
    }
    return map;
  }, [permissionsData]);

  const users = useMemo(() => usersData?.rows || [], [usersData]);

  const usersWithAccess = useMemo(() => {
    const fromServer = users
      .filter(u => {
        const creds = credsByUserId[u.id];
        if (!creds || creds.length === 0) return false;
        return creds.some(c => c.bucket_permissions && bucket in c.bucket_permissions);
      })
      .map(u => {
        const creds = credsByUserId[u.id];
        const cred = creds.find(c => c.bucket_permissions && bucket in c.bucket_permissions);
        const accessValue = BucketAccessHelpers.getAccessValue(cred?.bucket_permissions, bucket);
        return {
          ...u,
          accessValue,
          accessLabel: BucketAccessHelpers.getAccessLabel(accessValue),
        };
      });
    const serverIds = new Set(fromServer.map(u => u.id));
    const pending = optimisticUsers.filter(u => !serverIds.has(u.id));
    return [...fromServer, ...pending];
  }, [users, credsByUserId, bucket, optimisticUsers]);

  const existingUserIds = useMemo(() => usersWithAccess.map(u => u.id), [usersWithAccess]);

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersWithAccess;
    const lowerQuery = searchQuery.toLowerCase();
    return usersWithAccess.filter(
      u => u.name?.toLowerCase().includes(lowerQuery) || u.email?.toLowerCase().includes(lowerQuery),
    );
  }, [usersWithAccess, searchQuery]);

  const sortedUsers = useMemo(() => sortData(filteredUsers), [sortData, filteredUsers]);

  const total = sortedUsers.length;
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedUsers.slice(start, start + rowsPerPage);
  }, [sortedUsers, page, rowsPerPage]);

  const selectionRows = hidePagination ? sortedUsers : paginatedUsers;

  const {
    selectedIds,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    getSelectedRows,
  } = useRowSelection({ rows: selectionRows, idField: 'id' });

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: BUCKET_ACCESS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: true,
  });

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      page,
      pageSize: rowsPerPage,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * rowsPerPage >= total,
      startRow: total > 0 ? page * rowsPerPage + 1 : 0,
      endRow: Math.min((page + 1) * rowsPerPage, total),
      handlePrevPage: () => setPage(p => p - 1),
      handleNextPage: () => setPage(p => p + 1),
      handlePageSizeChange: newSize => {
        setRowsPerPage(newSize);
        setPage(0);
      },
      pageSizeSelectOptions: PAGE_SIZE_OPTIONS.map(size => ({
        label: size.toString(),
        value: size,
      })),
    }),
    [total, page, rowsPerPage],
  );

  const handleAccessChange = useCallback(
    async (user, newAccess) => {
      const creds = credsByUserId[user.id];
      try {
        if (!creds || creds.length === 0) {
          if (!newAccess) return;
          const bucketPermissions = BucketAccessHelpers.buildBucketPermissions(newAccess, bucket, {});
          await createS3Credentials({
            projectId,
            user_id: user.id,
            name: `${user.name || user.email} - bucket access`,
            bucket_permissions: bucketPermissions,
          }).unwrap();
        } else {
          const cred =
            creds.find(c => c.bucket_permissions && bucket in c.bucket_permissions) ||
            creds.find(c => !c.bucket_permissions || Object.keys(c.bucket_permissions).length === 0) ||
            creds[0];
          const updatedPerms = BucketAccessHelpers.buildBucketPermissions(
            newAccess,
            bucket,
            cred.bucket_permissions,
          );
          await setBucketPermissions({
            projectId,
            access_key_id: cred.access_key_id,
            bucket_permissions: updatedPerms,
          }).unwrap();
        }
        if (newAccess) {
          toastSuccess('Access updated');
        } else {
          toastSuccess('Access removed');
        }
      } catch {
        toastError('Failed to update access');
      }
    },
    [credsByUserId, bucket, createS3Credentials, setBucketPermissions, projectId, toastError, toastSuccess],
  );

  const handleEditClick = useCallback(row => {
    setEditingUsers([
      {
        id: row.id,
        name: row.name,
        email: row.email,
        currentPermission: row.accessValue,
      },
    ]);
    setEditDialogOpen(true);
  }, []);

  const handleBulkEditClick = useCallback(() => {
    const selected = getSelectedRows();
    setEditingUsers(
      selected.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        currentPermission: row.accessValue,
      })),
    );
    setEditDialogOpen(true);
  }, [getSelectedRows]);

  const handleEditConfirm = useCallback(
    async ({ permission }) => {
      if (editingUsers.length === 0) return;

      const isRemoval = permission === BucketAccessConstants.PERMISSION_OPTIONS.READ_WRITE;

      const results = await Promise.allSettled(
        editingUsers.map(async editingUser => {
          const user = users.find(u => u.id === editingUser.id);
          if (!user) {
            throw new Error(`User ${editingUser.id} not found`);
          }
          await handleAccessChange(user, isRemoval ? '' : permission);
        }),
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      if (editingUsers.length > 1) {
        if (successCount > 0) {
          toastSuccess(
            `${isRemoval ? 'Removed' : 'Updated'} access for ${successCount} user${successCount !== 1 ? 's' : ''}`,
          );
        }
        if (errorCount > 0) {
          toastError(`Failed to update ${errorCount} user${errorCount !== 1 ? 's' : ''}`);
        }
      }

      setEditDialogOpen(false);
      setEditingUsers([]);
      clearSelection();
    },
    [editingUsers, users, handleAccessChange, toastSuccess, toastError, clearSelection],
  );

  const handleAddConfirm = useCallback(
    async ({ users: usersToAdd, permission }) => {
      const newOptimisticUsers = usersToAdd.map(user => ({
        ...user,
        accessValue: permission,
        accessLabel: BucketAccessHelpers.getAccessLabel(permission),
      }));
      setOptimisticUsers(prev => [...prev, ...newOptimisticUsers]);

      const results = await Promise.allSettled(usersToAdd.map(user => handleAccessChange(user, permission)));

      const failedUserIds = usersToAdd.filter((_, i) => results[i].status === 'rejected').map(u => u.id);

      if (failedUserIds.length > 0) {
        setOptimisticUsers(prev => prev.filter(u => !failedUserIds.includes(u.id)));
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      if (successCount > 0 && usersToAdd.length > 1) {
        toastSuccess(`Added access for ${successCount} user${successCount !== 1 ? 's' : ''}`);
      }

      setAddDialogOpen(false);
    },
    [handleAccessChange, toastSuccess],
  );

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'name') {
      return (
        <Text.EllipsisTypography
          variant="bodyMedium"
          color="text.secondary"
        >
          {row.name || row.email || '-'}
        </Text.EllipsisTypography>
      );
    }
    if (column.field === 'access') {
      return (
        <Text.EllipsisTypography
          variant="bodyMedium"
          color="text.secondary"
        >
          {row.accessLabel}
        </Text.EllipsisTypography>
      );
    }
    return (
      <Text.EllipsisTypography
        variant="bodyMedium"
        color="text.secondary"
      >
        {value || '-'}
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
              onClick={() => handleEditClick(row)}
            >
              <EditIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    ),
    [handleEditClick, styles.actionsContainer, styles.actionButton, styles.actionIcon],
  );

  const toolbarControls = useMemo(
    () => (
      <Box sx={styles.actionsRow}>
        <Box sx={styles.searchWrapper}>
          <SimpleSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search"
            autoFocus={false}
          />
        </Box>
        <AddButton
          tooltip="Add exception"
          onAdd={() => setAddDialogOpen(true)}
        />
        <Tooltip
          title="Edit selected"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant="icon"
              sx={styles.bulkEditButton}
              onClick={handleBulkEditClick}
              disabled={selectedIds.length === 0}
            >
              <EditIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    ),
    [
      searchQuery,
      selectedIds.length,
      handleBulkEditClick,
      styles.bulkEditButton,
      styles.actionIcon,
      styles.actionsRow,
      styles.searchWrapper,
    ],
  );

  useEffect(() => {
    if (permissionsData) {
      setOptimisticUsers([]);
    }
  }, [permissionsData]);

  useEffect(() => {
    if (renderToolbarControls) {
      renderToolbarControls(toolbarControls);
    }
    return () => {
      if (renderToolbarControls) {
        renderToolbarControls(null);
      }
    };
  }, [renderToolbarControls, toolbarControls]);

  const renderEmptyState = () => (
    <Box sx={styles.emptyStateWrapper}>
      <Box sx={styles.emptyStateContainer}>
        <NoPermissionsIcon sx={styles.emptyStateIcon} />
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
          All users have read/write permissions by default.
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

  const hasExceptions = usersWithAccess.length > 0;
  const displayUsers = hidePagination ? sortedUsers : paginatedUsers;

  return (
    <Box sx={styles.root}>
      {/* Section Header */}
      <Box sx={styles.sectionHeader}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={styles.sectionTitle}
        >
          Exceptions – {usersWithAccess.length}
        </Typography>
        {hasExceptions && (renderToolbarControls ? null : toolbarControls)}
      </Box>

      {/* Content */}
      {isFetching ? (
        <Box sx={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height="2.5rem"
              sx={styles.skeleton}
            />
          ))}
        </Box>
      ) : !hasExceptions ? (
        renderEmptyState()
      ) : (
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
              {displayUsers.map(row => (
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
          {!hidePagination && total > 0 && <GridTablePagination {...paginationProps} />}
        </Box>
      )}

      <AddBucketUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddConfirm}
        projectId={projectId}
        existingUserIds={existingUserIds}
        loading={isMutating}
      />

      <EditBucketUserDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingUsers([]);
        }}
        onConfirm={handleEditConfirm}
        users={editingUsers}
        loading={isMutating}
      />
    </Box>
  );
});

const bucketAccessTableStyle = () => ({
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
    backgroundColor: palette.background.secondary,
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
  selectionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
    backgroundColor: palette.background.secondary,
  }),
  tableScrollContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
    backgroundColor: palette.background.secondary,
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
    backgroundColor: palette.background.secondary,
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
  emptyStateWrapper: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.secondary,
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
    backgroundColor: palette.background.emptyState?.default || palette.background.default,
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

BucketAccessTable.displayName = 'BucketAccessTable';

export default BucketAccessTable;

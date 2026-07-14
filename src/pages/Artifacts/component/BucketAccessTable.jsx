import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, IconButton, Skeleton, Tooltip } from '@mui/material';

import { useResponsiveColumns, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { Text } from '@/[fsd]/shared/ui';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { useUserListQuery } from '@/api/admin';
import {
  useCreateS3CredentialsMutation,
  useListBucketPermissionsQuery,
  useSetBucketPermissionsMutation,
} from '@/api/artifacts';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import useToast from '@/hooks/useToast';

import AddBucketUserDialog from './AddBucketUserDialog';
import EditBucketUserDialog from './EditBucketUserDialog';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const BUCKET_ACCESS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: true, hideBelow: 600 },
  { field: 'access', label: 'Permissions', width: '10rem', sortable: false },
  { field: 'actions', label: 'Actions', width: '8.25rem', sortable: false },
];

const getAccessValue = (bucketPermissions, bucket) => {
  const perms = bucketPermissions?.[bucket];
  if (!perms || perms.length === 0) return '';
  if (perms.includes('write')) return 'read_write';
  return 'read';
};

const getAccessLabel = accessValue => {
  if (accessValue === 'read_write') return 'Read & Write';
  if (accessValue === 'read') return 'Read';
  return 'No access';
};

const buildBucketPermissions = (accessValue, bucket, existingPerms) => {
  const updated = { ...(existingPerms || {}) };
  if (!accessValue) {
    delete updated[bucket];
  } else if (accessValue === 'read_write') {
    updated[bucket] = ['read', 'write'];
  } else {
    updated[bucket] = ['read'];
  }
  return updated;
};

const BucketAccessTable = memo(props => {
  const { bucket, projectId, renderToolbarControls } = props;

  const { windowWidth } = useGetWindowWidth();
  const { toastError, toastSuccess } = useToast();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data: permissionsData, isLoading: isLoadingPerms } = useListBucketPermissionsQuery(
    { projectId },
    { skip: !projectId },
  );

  const { data: usersData, isLoading: isLoadingUsers } = useUserListQuery(
    { projectId, page: 0, pageSize: 1000 },
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
    return users
      .filter(u => {
        const creds = credsByUserId[u.id];
        if (!creds || creds.length === 0) return false;
        const accessValue = getAccessValue(creds[0]?.bucket_permissions, bucket);
        return accessValue !== '';
      })
      .map(u => {
        const creds = credsByUserId[u.id];
        const accessValue = getAccessValue(creds[0]?.bucket_permissions, bucket);
        return {
          ...u,
          accessValue,
          accessLabel: getAccessLabel(accessValue),
        };
      });
  }, [users, credsByUserId, bucket]);

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

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: BUCKET_ACCESS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
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
          const bucketPermissions = buildBucketPermissions(newAccess, bucket, {});
          await createS3Credentials({
            projectId,
            user_id: user.id,
            name: `${user.name || user.email} - bucket access`,
            bucket_permissions: bucketPermissions,
          }).unwrap();
        } else {
          // Reuse the first existing credential regardless of whether it has this bucket
          const cred = creds[0];
          const updatedPerms = buildBucketPermissions(newAccess, bucket, cred.bucket_permissions);
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

  const handleRemoveAccess = useCallback(
    async user => {
      await handleAccessChange(user, '');
    },
    [handleAccessChange],
  );

  const handleEditClick = useCallback(row => {
    setEditingUser({
      id: row.id,
      name: row.name,
      email: row.email,
      currentPermission: row.accessValue,
    });
    setEditDialogOpen(true);
  }, []);

  const handleEditConfirm = useCallback(
    async ({ permission }) => {
      if (!editingUser) return;
      const user = users.find(u => u.id === editingUser.id);
      if (user) {
        await handleAccessChange(user, permission);
      }
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    [editingUser, users, handleAccessChange],
  );

  const handleAddConfirm = useCallback(
    async ({ user, permission }) => {
      await handleAccessChange(user, permission);
      setAddDialogOpen(false);
    },
    [handleAccessChange],
  );

  const styles = bucketAccessTableStyles();

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
          title="Edit access"
          placement="top"
        >
          <IconButton
            variant="elitea"
            color="tertiary"
            size="small"
            onClick={() => handleEditClick(row)}
          >
            <EditIcon sx={styles.actionIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title="Remove access"
          placement="top"
        >
          <IconButton
            variant="elitea"
            color="tertiary"
            size="small"
            onClick={() => handleRemoveAccess(row)}
          >
            <DeleteIcon sx={styles.actionIcon} />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [handleEditClick, handleRemoveAccess, styles],
  );

  const toolbarControls = useMemo(
    () => (
      <>
        <Box sx={styles.searchWrapper}>
          <SimpleSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search users"
            autoFocus={false}
          />
        </Box>
        <Tooltip
          title="Add user access"
          placement="top"
        >
          <IconButton
            variant="elitea"
            size="small"
            color="secondary"
            onClick={() => setAddDialogOpen(true)}
          >
            <PlusIcon sx={styles.actionIcon} />
          </IconButton>
        </Tooltip>
      </>
    ),
    [searchQuery, styles.searchWrapper, styles.actionIcon],
  );

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

  return (
    <Box sx={styles.root}>
      {!renderToolbarControls && <Box sx={styles.actionsRow}>{toolbarControls}</Box>}
      <Box sx={styles.tableWrapper}>
        {isFetching ? (
          <Box sx={styles.skeletonContainer}>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height="2.5rem"
                sx={styles.skeleton}
              />
            ))}
          </Box>
        ) : (
          <GridTableContainer
            isLoading={false}
            isEmpty={paginatedUsers.length === 0}
            emptyMessage="No users with access to this bucket"
          >
            <GridTableHeader
              columns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
            />
            <GridTableBody>
              {paginatedUsers.map(row => (
                <GridTableRow
                  key={row.id}
                  row={row}
                  isSelected={false}
                  isHovered={hoveredRowId === row.id}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  gridTemplateColumns={gridTemplateColumns}
                  columns={dataColumns}
                  showCheckbox={false}
                  renderCell={renderCell}
                  actions={renderActions(row)}
                  dataCellSx={styles.dataCell}
                />
              ))}
            </GridTableBody>
            {total > 0 && <GridTablePagination {...paginationProps} />}
          </GridTableContainer>
        )}
      </Box>

      <AddBucketUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddConfirm}
        users={users}
        existingUserIds={existingUserIds}
        loading={isMutating}
      />

      <EditBucketUserDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingUser(null);
        }}
        onConfirm={handleEditConfirm}
        user={editingUser}
        loading={isMutating}
      />
    </Box>
  );
});

BucketAccessTable.displayName = 'BucketAccessTable';

const bucketAccessTableStyles = () => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.6rem',
    padding: '0.75rem 1.5rem',
  },
  searchWrapper: {
    minWidth: '12.5rem',
  },
  tableWrapper: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    maxWidth: '100%',
  },
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
});

export default BucketAccessTable;

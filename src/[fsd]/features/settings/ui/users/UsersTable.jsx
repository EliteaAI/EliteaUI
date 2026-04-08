import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Skeleton } from '@mui/material';

import { useResponsiveColumns, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { Text } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';

import DeleteUserButton from './DeleteUserButton';
import EditUsersButton from './EditUsersButton';

const USERS_TABLE_CONFIG = {
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

const USERS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: true, hideBelow: 600 },
  { field: 'last_login', label: 'Last login', width: '1fr', sortable: true, hideBelow: 800 },
  { field: 'roles', label: 'Role', width: '1fr', sortable: false, hideBelow: 1000 },
  { field: 'actions', label: 'Actions', width: '8.25rem', sortable: false },
];

const UsersTable = memo(props => {
  const {
    users,
    selectedUsers = [],
    total,
    rowsPerPage,
    page,
    onChangePageSize,
    onPageChange,
    isFetching,
    refetch,
    onSelectPage,
    onSelectRow,
    rolesOptions,
    setSelectedUsers,
  } = props;

  const styles = usersTableStyles();
  const { checkPermission } = useCheckPermission();
  const { windowWidth } = useGetWindowWidth();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: USERS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: true,
  });

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });

  const sortedUsers = useMemo(() => sortData(users), [sortData, users]);

  // Adapt server-side selection to grid-table pattern
  const selectedIds = useMemo(() => selectedUsers.map(user => user.id), [selectedUsers]);

  const isAllSelected = useMemo(
    () => users.length === selectedUsers.length && users.length > 0,
    [selectedUsers, users],
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < users.length,
    [selectedIds.length, users.length],
  );

  const handleSelectAll = useCallback(() => {
    onSelectPage && onSelectPage(!isAllSelected);
  }, [isAllSelected, onSelectPage]);

  const handleSelectRow = useCallback(
    userId => {
      const user = users.find(u => u.id === userId);
      const isCurrentlySelected = selectedIds.includes(userId);
      onSelectRow && onSelectRow(user, !isCurrentlySelected);
    },
    [users, selectedIds, onSelectRow],
  );

  // Adapt server-side pagination to grid-table pagination component
  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      page,
      pageSize: rowsPerPage,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * rowsPerPage >= total,
      startRow: page * rowsPerPage + 1,
      endRow: Math.min((page + 1) * rowsPerPage, total),
      handlePrevPage: () => onPageChange(null, page - 1),
      handleNextPage: () => onPageChange(null, page + 1),
      handlePageSizeChange: newPageSize => {
        onChangePageSize({ target: { value: newPageSize } });
      },
      pageSizeSelectOptions: USERS_TABLE_CONFIG.PAGE_SIZE_OPTIONS.map(size => ({
        label: size.toString(),
        value: size,
      })),
    }),
    [total, page, rowsPerPage, onPageChange, onChangePageSize],
  );

  const renderCell = useCallback((column, value) => {
    if (column.field === 'roles') {
      return (
        <Text.EllipsisTypography
          variant="bodyMedium"
          color="text.secondary"
        >
          {value.join(', ')}
        </Text.EllipsisTypography>
      );
    }
    // Return the value itself for other columns to use default rendering
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
    row => {
      return (
        <Box sx={styles.actionsContainer}>
          {checkPermission(PERMISSIONS.users.edit) && (
            <EditUsersButton
              users={row}
              refetch={refetch}
              rolesOptions={rolesOptions}
            />
          )}
          {checkPermission(PERMISSIONS.users.delete) && (
            <DeleteUserButton
              users={[row]}
              refetch={refetch}
              setSelectedUsers={setSelectedUsers}
            />
          )}
        </Box>
      );
    },
    [checkPermission, refetch, rolesOptions, setSelectedUsers, styles.actionsContainer],
  );

  return !isFetching ? (
    <Box
      key={`users-table-${sideBarCollapsed}`}
      sx={styles.tableContainer}
    >
      <GridTableContainer
        isLoading={isFetching}
        isEmpty={sortedUsers.length === 0 && !isFetching}
        emptyMessage="No users"
      >
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
          {sortedUsers.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              isSelected={selectedIds.includes(row.id)}
              isHovered={hoveredRowId === row.id}
              onSelect={handleSelectRow}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              columns={dataColumns}
              renderCell={renderCell}
              actions={renderActions(row)}
              dataCellSx={styles.dataCell}
            />
          ))}
        </GridTableBody>

        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  ) : (
    <Box sx={styles.skeletonContainer}>
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton
          key={`skeleton-row-${index}`}
          sx={styles.skeleton}
          variant="rectangular"
          width="100%"
          height="2.5rem"
        />
      ))}
    </Box>
  );
});

UsersTable.displayName = 'UsersTable';

/** @type {MuiSx} */
const usersTableStyles = () => ({
  tableContainer: {
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
  skeletonContainer: {
    width: '100%',
    marginLeft: '1.25rem',
  },
  skeleton: {
    marginBottom: '0.5rem',
  },
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0rem 1rem',
  },
});

export default UsersTable;

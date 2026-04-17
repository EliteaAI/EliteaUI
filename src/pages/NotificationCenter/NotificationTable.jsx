import { memo, useCallback, useMemo, useState } from 'react';

import { format } from 'date-fns';
import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { useRowSelection } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { useNotificationBulkDeleteMutation, useNotificationBulkMarkSeenMutation } from '@/api/notifications';
import { SortOrderOptions } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import NotificationListItem from '@/components/NotificationListItem';
import useToast from '@/hooks/useToast';

import NotificationTableToolbar from './NotificationTableToolbar';

const NOTIFICATION_TABLE_CONFIG = {
  PAGE_SIZE_OPTIONS: [5, 10, 50, 100],
};

const NOTIFICATION_COLUMNS = [
  { field: 'event_type', label: 'Notification', width: '1fr', sortable: false },
  { field: 'created_at', label: 'Date & Time', width: '11rem', sortable: true },
];

const GRID_TEMPLATE_COLUMNS = '3rem minmax(0, 50rem) 11rem';

const DATA_COLUMNS = NOTIFICATION_COLUMNS.slice(1);

const NotificationTable = memo(props => {
  const {
    isFetching,
    rows,
    rowCount,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    search,
    onSearchChange,
  } = props;
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const styles = notificationTableStyles();
  const { personal_project_id } = useSelector(state => state.user);
  const { toastError, toastSuccess } = useToast();
  const [bulkDeleteNotifications] = useNotificationBulkDeleteMutation();
  const [bulkMarkSeenNotifications] = useNotificationBulkMarkSeenMutation();
  const {
    selectedIds: rowSelectionModel,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectRow,
    selectRows,
  } = useRowSelection({ rows, idField: 'id' });

  const removeIdsFromSelection = useCallback(
    ids => {
      const idsSet = new Set(ids);

      return selectRows(rowSelectionModel.filter(id => !idsSet.has(id)));
    },
    [rowSelectionModel, selectRows],
  );

  const { page, pageSize } = paginationModel;

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;
  const startRow = rowCount === 0 ? 0 : page * pageSize + 1;
  const endRow = Math.min((page + 1) * pageSize, rowCount);

  const pageSizeSelectOptions = useMemo(
    () => NOTIFICATION_TABLE_CONFIG.PAGE_SIZE_OPTIONS.map(n => ({ value: n, label: String(n) })),
    [],
  );

  const handlePrevPage = useCallback(() => {
    setPaginationModel(prev => ({ ...prev, page: prev.page - 1 }));
  }, [setPaginationModel]);

  const handleNextPage = useCallback(() => {
    setPaginationModel(prev => ({ ...prev, page: prev.page + 1 }));
  }, [setPaginationModel]);

  const handlePageSizeChange = useCallback(
    newSize => {
      setPaginationModel({ pageSize: newSize, page: 0 });
    },
    [setPaginationModel],
  );

  const handleSort = useCallback(
    field => {
      setSortModel(prev => ({
        field,
        direction:
          prev.field === field && prev.direction === SortOrderOptions.ASC
            ? SortOrderOptions.DESC
            : SortOrderOptions.ASC,
      }));
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    },
    [setSortModel, setPaginationModel],
  );

  const selectedRowIds = useMemo(() => new Set(rowSelectionModel), [rowSelectionModel]);

  const currentPageSelectedIds = useMemo(
    () => rows.filter(row => selectedRowIds.has(row.id)).map(row => row.id),
    [rows, selectedRowIds],
  );

  const shouldMarkAsRead = useMemo(
    () => rows.some(row => selectedRowIds.has(row.id) && !row.is_seen),
    [rows, selectedRowIds],
  );

  const canMarkToggle = useMemo(
    () => currentPageSelectedIds.length > 0 && !!personal_project_id,
    [currentPageSelectedIds, personal_project_id],
  );

  const handleDeleteSelected = useCallback(async () => {
    if (!currentPageSelectedIds.length || !personal_project_id) return;
    try {
      await bulkDeleteNotifications({ projectId: personal_project_id, ids: currentPageSelectedIds }).unwrap();
      removeIdsFromSelection(currentPageSelectedIds);
      toastSuccess('Notifications deleted successfully');
    } catch (err) {
      toastError(buildErrorMessage(err));
    }
  }, [
    currentPageSelectedIds,
    bulkDeleteNotifications,
    personal_project_id,
    removeIdsFromSelection,
    toastError,
    toastSuccess,
  ]);

  const handleMarkToggle = useCallback(async () => {
    if (!canMarkToggle) return;
    try {
      await bulkMarkSeenNotifications({
        projectId: personal_project_id,
        ids: currentPageSelectedIds,
        isSeen: shouldMarkAsRead,
      }).unwrap();
      removeIdsFromSelection(currentPageSelectedIds);
      toastSuccess(shouldMarkAsRead ? 'Notifications marked as read' : 'Notifications marked as unread');
    } catch (err) {
      toastError(buildErrorMessage(err));
    }
  }, [
    canMarkToggle,
    currentPageSelectedIds,
    bulkMarkSeenNotifications,
    personal_project_id,
    shouldMarkAsRead,
    removeIdsFromSelection,
    toastError,
    toastSuccess,
  ]);

  const handleRowMouseEnter = useCallback(id => () => setHoveredRowId(id), []);
  const handleRowMouseLeave = useCallback(() => setHoveredRowId(null), []);

  const renderNameCell = useCallback(
    ({ row }) => (
      <Box sx={styles.notificationCell}>
        <NotificationListItem
          notification={row}
          clampLines={0}
          sx={styles.listItemOverride}
          contentSX={styles.listItemContent}
          showTime={false}
          context="table"
        />
      </Box>
    ),
    [styles],
  );

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'created_at') {
      const textColor = row.is_seen ? 'text.primary' : 'text.secondary';
      return (
        <Typography
          variant="bodyMedium"
          sx={{ color: textColor }}
        >
          {format(new Date(value), 'dd-MMM-yyyy, kk:mm')}
        </Typography>
      );
    }
    return value;
  }, []);

  return (
    <Box sx={styles.wrapper}>
      <GridTableContainer
        toolbarSx={styles.toolbarOverride}
        toolbar={
          <NotificationTableToolbar
            rowSelectionModel={currentPageSelectedIds}
            onDeleteSelected={handleDeleteSelected}
            onMarkToggle={handleMarkToggle}
            markAsRead={shouldMarkAsRead}
            search={search}
            onSearchChange={onSearchChange}
          />
        }
        isLoading={isFetching}
        isEmpty={!isFetching && rows.length === 0}
        emptyMessage="No notifications"
        loadingMessage="Loading notifications..."
      >
        <GridTableHeader
          columns={NOTIFICATION_COLUMNS}
          gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          sortConfig={sortModel}
          onSort={handleSort}
        />
        <GridTableBody>
          {rows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              isSelected={rowSelectionModel.includes(row.id)}
              isHovered={hoveredRowId === row.id}
              onSelect={handleSelectRow}
              onMouseEnter={handleRowMouseEnter(row.id)}
              onMouseLeave={handleRowMouseLeave}
              gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
              columns={DATA_COLUMNS}
              renderCell={renderCell}
              NameCellComponent={renderNameCell}
              nameField="event_type"
              checkboxCellSx={styles.checkboxCell}
              dataCellSx={styles.dataCell}
            />
          ))}
        </GridTableBody>
        {rowCount > 0 && (
          <GridTablePagination
            totalRows={rowCount}
            isFirstPage={isFirstPage}
            isLastPage={isLastPage}
            startRow={startRow}
            endRow={endRow}
            pageSizeSelectOptions={pageSizeSelectOptions}
            pageSize={pageSize}
            handlePrevPage={handlePrevPage}
            handleNextPage={handleNextPage}
            handlePageSizeChange={handlePageSizeChange}
          />
        )}
      </GridTableContainer>
    </Box>
  );
});

NotificationTable.displayName = 'NotificationTable';

/** @type {MuiSx} */
const notificationTableStyles = () => ({
  wrapper: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '0.3rem',
    height: '100%',
  },
  notificationCell: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxCell: {
    alignSelf: 'start',
    paddingTop: '0.4rem',
  },
  dataCell: {
    alignSelf: 'start',
    paddingTop: '0.8rem',
  },
  listItemOverride: {
    padding: '0',
    border: 'none',
    borderBottom: 'none',
    width: 'auto',
    flex: 1,
    minHeight: 'unset',
    boxSizing: 'border-box',
    minWidth: 0,
  },
  listItemContent: {
    justifyContent: 'center',
  },
  toolbarOverride: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export default NotificationTable;

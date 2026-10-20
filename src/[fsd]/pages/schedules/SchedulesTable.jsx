import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useResponsiveColumns } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import {
  getBrowserTimezone,
  getCronSummaryInBrowserTimezone,
} from '@/[fsd]/shared/lib/helpers/schedule.helpers';
import { useGetWindowWidth } from '@/[fsd]/shared/lib/hooks';
import { Text } from '@/[fsd]/shared/ui';
import EntityTypeIcon from '@/[fsd]/shared/ui/icon/EntityTypeIcon';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';
import AuthorContainer from '@/components/AuthorContainer';
import CalendarIcon from '@/components/Icons/CalendarIcon';

import ScheduleActionsCell from './ScheduleActionsCell';
import ScheduleNameCell from './ScheduleNameCell';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const ENTITY_TYPE_LABELS = { agent: 'Agent', pipeline: 'Pipeline' };
// The API stores run statuses in lower case (failed, skipped, blocked, ...)
const REASON_STATUSES = ['failed', 'skipped', 'blocked'];
const statusLabel = status =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ') : '-';

// Widths and the row height follow the Agents and Pipelines list view (widgets/data-table)
const SCHEDULES_COLUMNS = [
  { field: 'name', label: 'Name & Description', width: 'minmax(12.5rem, 1.3fr)', sortable: true },
  { field: 'entity_name', label: 'Entity', width: 'minmax(10rem, 1.3fr)', sortable: true },
  { field: 'entity_type', label: 'Type', width: '7.5rem', sortable: true },
  { field: 'schedule', label: 'Schedule', width: 'minmax(10rem, 1.6fr)' },
  { field: 'next_run', label: 'Next run', width: '9.5rem', sortable: true },
  { field: 'last_run', label: 'Last run', width: 'minmax(7.5rem, 1fr)', sortable: true },
  { field: 'owner', label: 'Owner', width: '12rem' },
  { field: 'enabled', label: 'Enabled', width: '7.5rem', sortable: true },
  { field: 'actions', label: 'Actions' },
];
const ACTIONS_COLUMN_WIDTH = '6.5625rem';
const ROW_HEIGHT = '3.5rem';

const formatTime = value =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const IconWithLabel = ({ type, label }) => (
  <Box sx={schedulesTableStyles().iconLabel}>
    <EntityTypeIcon type={type} />
    <Text.EllipsisTypography
      variant="bodyMedium"
      color="text.secondary"
    >
      {label}
    </Text.EllipsisTypography>
  </Box>
);

const renderCell = (column, value, row) => {
  const styles = schedulesTableStyles();
  switch (column.field) {
    case 'entity_name':
      return (
        <IconWithLabel
          type={row.entity_type}
          label={[row.entity_name, row.version_name].filter(Boolean).join(' ')}
        />
      );
    case 'entity_type':
      return (
        <IconWithLabel
          type={row.entity_type}
          label={ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type}
        />
      );
    case 'schedule':
      return `${getCronSummaryInBrowserTimezone(row.cron, row.timezone)} (${getBrowserTimezone() ?? row.timezone})`;
    case 'next_run':
      return value ? (
        <Box sx={styles.dateCell}>
          <CalendarIcon sx={styles.calendarIcon} />
          <Typography
            variant="bodyMedium"
            component="span"
            title={new Date(value).toLocaleString()}
          >
            {`${timeFormatter(value, TIME_FORMAT.MMMDD)} ${formatTime(value)}`}
          </Typography>
        </Box>
      ) : (
        '-'
      );
    case 'last_run':
      return (
        <Box sx={styles.lastRun}>
          <Text.EllipsisTypography variant="bodyMedium">
            {statusLabel(row.last_run_status)}
          </Text.EllipsisTypography>
          {REASON_STATUSES.includes(row.last_run_status) && row.last_run_reason && (
            <Text.EllipsisTypography
              variant="bodySmall"
              color="text.secondary"
            >
              {row.last_run_reason}
            </Text.EllipsisTypography>
          )}
        </Box>
      );
    case 'owner':
      return row.owner ? (
        <Box sx={styles.owner}>
          <AuthorContainer
            disabledNavigation
            authors={[row.owner]}
          />
        </Box>
      ) : (
        '-'
      );
    case 'enabled':
      return value ? 'Yes' : 'No';
    default:
      return value ?? '-';
  }
};

const SchedulesTable = memo(props => {
  const {
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onChangePageSize,
    sortConfig,
    onSort,
    isLoading = false,
    emptyMessage = 'No schedules',
  } = props;
  const { windowWidth } = useGetWindowWidth();
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: SCHEDULES_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
    actionsColumnWidth: ACTIONS_COLUMN_WIDTH,
  });

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      page,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: page * pageSize + 1,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage: () => onPageChange(page - 1),
      handleNextPage: () => onPageChange(page + 1),
      handlePageSizeChange: onChangePageSize,
      pageSizeSelectOptions: PAGE_SIZE_OPTIONS.map(size => ({ label: String(size), value: size })),
    }),
    [total, page, pageSize, onPageChange, onChangePageSize],
  );

  return (
    <GridTableContainer
      isLoading={isLoading}
      isEmpty={rows.length === 0}
      emptyMessage={emptyMessage}
    >
      <GridTableHeader
        columns={visibleColumns}
        sortConfig={sortConfig}
        onSort={onSort}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
        columnTestIdPrefix="schedule"
      />
      <GridTableBody minHeight={0}>
        {rows.map(row => (
          <GridTableRow
            key={row.id}
            row={row}
            showCheckbox={false}
            gridTemplateColumns={gridTemplateColumns}
            columns={dataColumns}
            renderCell={renderCell}
            rowHeight={ROW_HEIGHT}
            isHovered={hoveredRowId === row.id}
            onMouseEnter={() => setHoveredRowId(row.id)}
            onMouseLeave={() => setHoveredRowId(null)}
            NameCellComponent={ScheduleNameCell}
            ActionsComponent={ScheduleActionsCell}
            data-testid="schedule-row"
            dataCellTestIdPrefix="schedule"
          />
        ))}
      </GridTableBody>
      {total > 0 && <GridTablePagination {...paginationProps} />}
    </GridTableContainer>
  );
});

SchedulesTable.displayName = 'SchedulesTable';

/** @type {MuiSx} */
const schedulesTableStyles = () => ({
  iconLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  dateCell: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  calendarIcon: { width: '1rem', height: '1rem', flexShrink: 0 },
  lastRun: { minWidth: 0 },
  owner: { display: 'flex', maxWidth: '9.75rem', width: '9.75rem' },
});

export default SchedulesTable;

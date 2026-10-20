import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const ENTITY_TYPE_LABELS = { agent: 'Agent', pipeline: 'Pipeline' };
// The API stores run statuses in lower case (failed, skipped, blocked, ...)
const REASON_STATUSES = ['failed', 'skipped', 'blocked'];
const statusLabel = status =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ') : '-';

const SCHEDULES_COLUMNS = [
  { field: 'name', label: 'Name', width: '1.2fr' },
  { field: 'entity', label: 'Entity', width: '1.4fr' },
  { field: 'entity_type', label: 'Type', width: '0.8fr' },
  { field: 'schedule', label: 'Schedule', width: '1.4fr' },
  { field: 'next_run', label: 'Next run', width: '1fr' },
  { field: 'last_run', label: 'Last run', width: '1.2fr' },
  { field: 'owner', label: 'Owner', width: '0.8fr' },
  { field: 'enabled', label: 'Enabled', width: '0.7fr' },
  { field: 'actions', label: 'Actions', width: '8.25rem' },
];

const formatDate = value => (value ? new Date(value).toLocaleString() : '-');

const IconWithLabel = ({ type, label }) => (
  <Box sx={iconLabelStyle}>
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
  switch (column.field) {
    case 'entity':
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
      return formatDate(value);
    case 'last_run':
      return (
        <Box>
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
      return row.owner?.name ?? '-';
    case 'enabled':
      return value ? 'Yes' : 'No';
    case 'actions':
      return null; // the row actions arrive with US-28 and US-29
    default:
      return value ?? '-';
  }
};

const SchedulesTable = memo(props => {
  const { rows, total, page, pageSize, onPageChange, onChangePageSize } = props;
  const { windowWidth } = useGetWindowWidth();

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: SCHEDULES_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
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
      isEmpty={rows.length === 0}
      emptyMessage="No schedules"
    >
      <GridTableHeader
        columns={visibleColumns}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
        columnTestIdPrefix="schedule"
      />
      <GridTableBody>
        {rows.map(row => (
          <GridTableRow
            key={row.id}
            row={row}
            showCheckbox={false}
            gridTemplateColumns={gridTemplateColumns}
            columns={dataColumns}
            renderCell={renderCell}
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

const iconLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 };

export default SchedulesTable;

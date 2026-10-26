import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Tooltip as MuiTooltip, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
  useResponsiveColumns,
} from '@/[fsd]/entities/grid-table';
import {
  ScheduleEnabledSwitch,
  ScheduleRunStatusChip,
  formatRunStarted,
  toRunStatusLabel,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useGetComponentWidth } from '@/[fsd]/shared/lib/hooks';
import { Icon, Text, Tooltip } from '@/[fsd]/shared/ui';
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

// All 8 columns show at every width (owner: no hidden columns). The tier comes from the measured table
// width: 796 px at a 1280 px window, 956 px at 1440, 1116 px at 1600.
// The regular tier starts at 948 px, a 1280 px window with the main sidebar collapsed (+152 px).
const REGULAR_MIN_PX = 948;
const COMFORTABLE_MIN_PX = 1116;
// Under the compact sum the header and rows scroll sideways together and the Actions column stays pinned
const COMPACT_MIN_PX = 796;
const TABLE_MIN_WIDTH = '49.75rem';
// The measured box also holds the 1.5 rem side gutters of GridTableContainer
const GUTTERS_PX = 48;

// The text columns grow from their compact width; the other columns take the width of the tier
const SCHEDULES_COLUMNS = [
  { field: 'name', label: 'Name & Description', width: 'minmax(10.25rem, 1.3fr)', sortable: true },
  { field: 'entity_name', label: 'Entity Name', width: 'minmax(7.5rem, 1fr)', sortable: true },
  { field: 'schedule', label: 'Schedule', width: 'minmax(7.25rem, 1fr)' },
  { field: 'next_run', label: 'Next run', sortable: true },
  { field: 'last_run', label: 'Last run', sortable: true },
  { field: 'owner', label: 'Owner' },
  { field: 'enabled', label: 'Enabled', sortable: true },
  { field: 'actions', label: 'Actions' },
];
const TIER_WIDTHS = {
  compact: {
    next_run: '5.75rem',
    last_run: '5.75rem',
    owner: '3.5rem',
    enabled: '5.5rem',
    actions: '4.25rem',
  },
  // Last run takes the Next run width; the regular Owner gives 0.75 rem for it. 7.75 rem fits the
  // widest date ("Nov, 30 23:30") with the cell padding (live check at 1440 px)
  regular: {
    next_run: '7.75rem',
    last_run: '7.75rem',
    owner: '6.75rem',
    enabled: '5.5rem',
    actions: '4.25rem',
  },
  comfortable: {
    next_run: '9.25rem',
    last_run: '9.25rem',
    owner: '9.75rem',
    enabled: '6rem',
    actions: '6.5625rem',
  },
};
const ROW_HEIGHT = '3.5rem';

const getTier = tableWidth => {
  if (tableWidth >= COMFORTABLE_MIN_PX) return 'comfortable';
  if (tableWidth >= REGULAR_MIN_PX) return 'regular';
  return 'compact';
};

const formatTime = value =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const IconWithLabel = ({ type, label }) => {
  const typeLabel = ENTITY_TYPE_LABELS[type] ?? type;

  return (
    <Box sx={schedulesTableStyles().iconLabel}>
      <Box
        component="span"
        role="img"
        aria-label={typeLabel}
        title={typeLabel}
        sx={schedulesTableStyles().icon}
      >
        <Icon.EntityTypeIcon type={type} />
      </Box>
      <Tooltip.TypographyWithConditionalTooltip
        title={label}
        placement="top"
        variant="bodyMedium"
        color="text.secondary"
      >
        {label}
      </Tooltip.TypographyWithConditionalTooltip>
    </Box>
  );
};

// One date renderer for Next run and Last run. Compact: MMM DD and the time on two lines, with
// `trailing` (the Last run status icon) after the time; regular: one line; comfortable: the calendar icon
const renderRunDate = (value, tier, trailing = null) => {
  const styles = schedulesTableStyles();
  const date = timeFormatter(value, TIME_FORMAT.MMMDD);
  const time = formatTime(value);
  if (tier === 'compact') {
    return (
      <Box sx={styles.twoLineDate}>
        <Typography
          variant="bodyMedium"
          component="span"
        >
          {date}
        </Typography>
        <Box sx={styles.timeLine}>
          <Typography
            variant="bodySmall"
            component="span"
            color="text.primary"
          >
            {time}
          </Typography>
          {trailing}
        </Box>
      </Box>
    );
  }
  const text = (
    <Typography
      variant="bodyMedium"
      component="span"
      noWrap
    >
      {`${date} ${time}`}
    </Typography>
  );
  if (tier !== 'comfortable') return text;
  return (
    <Box sx={styles.dateCell}>
      <CalendarIcon sx={styles.calendarIcon} />
      {text}
    </Box>
  );
};

const lastRunTooltip = (row, label, reason) => {
  const text = [label, row.last_run && formatRunStarted(row.last_run)].filter(Boolean).join(' - ');
  return reason ? `${text}. ${reason}` : text;
};

const renderCell = (column, value, row, tier) => {
  const styles = schedulesTableStyles();
  const isCompact = tier === 'compact';
  switch (column.field) {
    case 'entity_name':
      return (
        <Box sx={styles.entityName}>
          <IconWithLabel
            type={row.entity_type}
            label={row.entity_name}
          />
          {row.version_name && (
            <Tooltip.TypographyWithConditionalTooltip
              title={row.version_name}
              placement="top"
              variant="bodySmall"
              color="text.secondary"
            >
              {row.version_name}
            </Tooltip.TypographyWithConditionalTooltip>
          )}
        </Box>
      );
    case 'schedule': {
      // Every row shows the browser zone, so the compact cell drops it and the tooltip keeps it
      const rule = ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone);
      const ruleWithZone = `${rule} (${ScheduleHelpers.getBrowserTimezone() ?? row.timezone})`;
      return (
        <MuiTooltip
          title={ruleWithZone}
          placement="top"
        >
          <Typography
            variant="bodyMedium"
            sx={styles.twoLines}
          >
            {isCompact ? rule : ruleWithZone}
          </Typography>
        </MuiTooltip>
      );
    }
    case 'next_run': {
      if (!row.enabled) return 'Paused';
      if (!value) return '-';
      if (tier === 'comfortable') return renderRunDate(value, tier);
      return (
        <MuiTooltip
          title={new Date(value).toLocaleString()}
          placement="top"
        >
          {renderRunDate(value, tier)}
        </MuiTooltip>
      );
    }
    case 'last_run': {
      const status = row.last_run_status;
      if (!row.last_run && !status) return '-';
      const label = status ? toRunStatusLabel(status) : '';
      const reason = REASON_STATUSES.includes(status) ? row.last_run_reason : null;
      const icon = status && (
        <ScheduleRunStatusChip
          status={status}
          variant="icon"
        />
      );
      // Line 1 the run date in the Next run format, line 2 the status icon and word with
      // the reason after it; compact puts the icon after the time and the reason only in the tooltip
      return (
        <MuiTooltip
          title={lastRunTooltip(row, label, reason)}
          placement="top"
        >
          <Box
            component="span"
            tabIndex={isCompact ? 0 : undefined}
            sx={styles.lastRun}
          >
            {row.last_run ? renderRunDate(row.last_run, tier, isCompact ? icon : null) : '-'}
            {!isCompact && status && (
              <Box sx={styles.statusLine}>
                {icon}
                <Typography
                  variant="bodySmall"
                  component="span"
                  sx={styles.statusLabel}
                >
                  {label}
                </Typography>
                {reason && (
                  <Text.EllipsisTypography
                    variant="bodySmall"
                    color="text.secondary"
                  >
                    {reason}
                  </Text.EllipsisTypography>
                )}
              </Box>
            )}
            {isCompact && !row.last_run && icon}
          </Box>
        </MuiTooltip>
      );
    }
    case 'owner': {
      if (!row.owner) return '-';
      const avatar = (
        <AuthorContainer
          disabledNavigation
          showName={false}
          authors={[row.owner]}
        />
      );
      if (isCompact) {
        return (
          <MuiTooltip
            title={row.owner.name ?? ''}
            placement="top"
          >
            <Box
              component="span"
              tabIndex={0}
              sx={styles.owner}
            >
              {avatar}
            </Box>
          </MuiTooltip>
        );
      }
      return (
        <Box sx={styles.owner}>
          {avatar}
          <Tooltip.TypographyWithConditionalTooltip
            title={row.owner.name}
            placement="top"
            variant="bodyMedium"
          >
            {row.owner.name}
          </Tooltip.TypographyWithConditionalTooltip>
        </Box>
      );
    }
    case 'enabled':
      return <ScheduleEnabledSwitch row={row} />;
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
    toolbar,
  } = props;
  const { componentRef, componentWidth } = useGetComponentWidth();
  const tableWidth = componentWidth - GUTTERS_PX;
  const tier = getTier(tableWidth);
  const isCompact = tier === 'compact';
  const isNarrow = tableWidth < COMPACT_MIN_PX;
  const styles = schedulesTableStyles(isCompact, isNarrow);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const containerProps = useMemo(() => ({ ref: componentRef }), [componentRef]);

  const columns = useMemo(
    () => SCHEDULES_COLUMNS.map(col => ({ ...col, width: TIER_WIDTHS[tier][col.field] ?? col.width })),
    [tier],
  );
  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns,
    containerWidth: componentWidth,
    showCheckbox: false,
    actionsColumnWidth: TIER_WIDTHS[tier].actions,
  });
  const renderTierCell = useCallback((column, value, row) => renderCell(column, value, row, tier), [tier]);

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
      containerProps={containerProps}
      toolbar={
        toolbar && (
          <>
            {toolbar}
            {/* Screen readers hear the result count after each filter change */}
            <Box
              sx={styles.visuallyHidden}
              aria-live="polite"
            >
              {isLoading ? '' : `${total} ${total === 1 ? 'schedule' : 'schedules'}`}
            </Box>
          </>
        )
      }
      toolbarSx={styles.toolbar}
    >
      {/* One scroll box for header and rows, as in the Agents list (widgets/data-table) */}
      <Box sx={styles.scrollBox}>
        <Box sx={styles.tableGroup}>
          <Box sx={styles.headerBox}>
            <GridTableHeader
              columns={visibleColumns}
              sortConfig={sortConfig}
              onSort={onSort}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
              columnTestIdPrefix="schedule"
              density={isCompact ? 'compact' : undefined}
            />
          </Box>
          <GridTableBody
            minHeight={0}
            sx={styles.body}
          >
            {rows.map(row => (
              <GridTableRow
                key={row.id}
                row={row}
                showCheckbox={false}
                gridTemplateColumns={gridTemplateColumns}
                columns={dataColumns}
                renderCell={renderTierCell}
                rowHeight={ROW_HEIGHT}
                isHovered={hoveredRowId === row.id}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                NameCellComponent={ScheduleNameCell}
                ActionsComponent={ScheduleActionsCell}
                nameCellSx={styles.compactCell}
                dataCellSx={styles.compactCell}
                actionsCellSx={styles.actionsCell(tier, hoveredRowId === row.id)}
                data-testid="schedule-row"
                dataCellTestIdPrefix="schedule"
              />
            ))}
          </GridTableBody>
        </Box>
      </Box>
      {total > 0 && <GridTablePagination {...paginationProps} />}
    </GridTableContainer>
  );
});

SchedulesTable.displayName = 'SchedulesTable';

// A pinned cell covers the cells under it: the opaque surface plus the translucent row or header fill
const pinnedCell = (palette, fill) => ({
  position: 'sticky',
  right: 0,
  backgroundColor: palette.background.default.secondary,
  backgroundImage: fill ? `linear-gradient(${fill}, ${fill})` : 'none',
});

/** @type {MuiSx} */
const schedulesTableStyles = (isCompact, isNarrow) => ({
  iconLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  icon: { display: 'flex', flexShrink: 0 },
  entityName: { minWidth: 0 },
  twoLines: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  dateCell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  twoLineDate: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  calendarIcon: { width: '1rem', height: '1rem', flexShrink: 0 },
  lastRun: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    maxWidth: '100%',
  },
  timeLine: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 },
  statusLine: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0, maxWidth: '100%' },
  statusLabel: { flexShrink: 0, whiteSpace: 'nowrap' },
  owner: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, maxWidth: '100%' },
  compactCell: isCompact ? { paddingLeft: '0.5rem', paddingRight: '0.5rem' } : {},
  actionsCell:
    (tier, isHovered) =>
    ({ palette }) => ({
      ...(tier !== 'comfortable' && { justifyContent: 'center' }),
      ...(isCompact && { paddingLeft: '0.5rem', paddingRight: '0.5rem' }),
      ...(isNarrow && pinnedCell(palette, isHovered && palette.background.surface.interactive.default)),
    }),
  scrollBox: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflowX: 'auto',
    // Under the compact width the box scrolls both ways, so the pinned cells stick to its right edge
    overflowY: isNarrow ? 'auto' : 'hidden',
  },
  tableGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: TABLE_MIN_WIDTH,
    ...(isNarrow ? { flex: 'none' } : { flex: 1, minHeight: 0, gap: '0.75rem' }),
  },
  headerBox: ({ palette }) =>
    isNarrow
      ? {
          position: 'sticky',
          top: 0,
          zIndex: 1,
          paddingBottom: '0.75rem',
          backgroundColor: palette.background.default.secondary,
          // clip keeps the rounded frame but, unlike hidden, lets the Actions label stick to the scroll box
          '& > .MuiBox-root': { overflow: 'clip' },
          '& [data-testid="schedule-column-header-actions"]': pinnedCell(
            palette,
            palette.background.surface.interactive.default,
          ),
        }
      : {},
  body: isNarrow ? { overflow: 'visible', flex: 'none' } : {},
  toolbar: { flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' },
  visuallyHidden: {
    position: 'absolute',
    width: '0.0625rem',
    height: '0.0625rem',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
});

export default SchedulesTable;

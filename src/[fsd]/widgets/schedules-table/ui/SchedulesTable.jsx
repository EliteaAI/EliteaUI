import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
  useResponsiveColumns,
} from '@/[fsd]/entities/grid-table';
import { useGetComponentWidth } from '@/[fsd]/shared/lib/hooks';

import {
  COMPACT_MIN_PX,
  GUTTERS_PX,
  ROW_HEIGHT,
  SCHEDULES_COLUMNS,
  TABLE_MIN_WIDTH,
  TIER_WIDTHS,
  getTier,
} from '../lib/helpers/scheduleColumns.helpers';
import ScheduleActionsCell from './ScheduleActionsCell';
import ScheduleCell from './ScheduleCell';
import ScheduleNameCell from './ScheduleNameCell';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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
  const renderTierCell = useCallback(
    (column, value, row) => (
      <ScheduleCell
        column={column}
        value={value}
        row={row}
        tier={tier}
      />
    ),
    [tier],
  );

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

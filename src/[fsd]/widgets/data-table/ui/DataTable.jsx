import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import FlowIcon from '@/assets/flow-icon.svg?react';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';
import { isAppAllCard, isApplicationCard, isPipelineCard } from '@/common/checkCardType';
import {
  CARD_LIST_WIDTH,
  CARD_LIST_WIDTH_FULL,
  PAGE_SIZE,
  SearchParams,
  SortFields,
  SortOrderOptions,
  TIME_FORMAT,
  ViewMode,
} from '@/common/constants';
import { getComparator, getPinnedComparator, stableSort, timeFormatter } from '@/common/utils';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import CalendarIcon from '@/components/Icons/CalendarIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import StatusBar from '@/components/StatusBar';
import { useSetUrlSearchParams } from '@/hooks/useCardNavigate';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { actions as settingsActions } from '@/slices/settings';

import DataTableActionsCell from './DataTableActionsCell';
import DataTableCell from './DataTableCell';

const DataTable = memo(props => {
  const {
    data,
    mixedContent,
    isFullWidth,
    total = 0,
    isLoading,
    isLoadingMore,
    loadMoreFunc,
    cardType,
    renderCard,
    page: externalPage,
    pageSize: externalPageSize,
    resetPageOnSort,
    setPage: externalSetPage,
    hideStatusColumn,
  } = props;

  const { windowWidth } = useGetWindowWidth();
  const dispatch = useDispatch();
  const pageSize = useSelector(state => state.settings.pageSize);
  const { viewMode } = renderCard({ metaOnly: true });
  const showLikes = useMemo(() => viewMode !== ViewMode.Owner, [viewMode]);
  const [searchParams] = useSearchParams();
  const setUrlSearchParams = useSetUrlSearchParams();
  const pageSizeFromUrl = useMemo(() => searchParams.get(SearchParams.PageSize), [searchParams]);
  const rowsPerPageOptions = useMemo(() => [10, PAGE_SIZE, 50, 100], []);

  const sortBy = useMemo(() => searchParams.get(SearchParams.SortBy) || SortFields.CreatedAt, [searchParams]);
  const sortOrder = useMemo(
    () => searchParams.get(SearchParams.SortOrder) || SortOrderOptions.DESC,
    [searchParams],
  );

  const [order, setOrder] = useState(sortOrder);
  const [orderBy, setOrderBy] = useState(sortBy);

  const [pinnedRows, setPinnedRows] = useState([]);
  const [unpinnedRows, setUnpinnedRows] = useState([]);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [tablePage, setTablePage] = useState(externalPage || 0);

  const isCredentials = useMemo(() => String(cardType).toLowerCase().includes('credential'), [cardType]);
  const isToolkits = useMemo(() => String(cardType).toLowerCase().includes('toolkit'), [cardType]);
  const isMCPs = useMemo(() => String(cardType).toLowerCase().includes('mcp'), [cardType]);
  const isPipelines = useMemo(() => isPipelineCard(cardType), [cardType]);
  const isAppAll = useMemo(() => isAppAllCard(cardType), [cardType]);

  const styles = useMemo(() => dataTableStyles(isFullWidth), [isFullWidth]);

  const internalRowsPerPage = useMemo(() => {
    const size = parseInt(pageSizeFromUrl || pageSize || PAGE_SIZE);
    return Number.isNaN(size) || !rowsPerPageOptions.includes(size) ? PAGE_SIZE : size;
  }, [pageSize, pageSizeFromUrl, rowsPerPageOptions]);

  const rowsPerPage = externalPageSize || internalRowsPerPage;

  const isSinglePage = useMemo(() => total > 0 && total <= rowsPerPage, [total, rowsPerPage]);

  const uniqueAuthorsCount = useMemo(() => {
    return new Set(data.map(row => row?.author?.name || row?.authors?.[0]?.name).filter(Boolean)).size;
  }, [data]);

  const columnsMeta = useMemo(() => {
    const baseColumns =
      !isCredentials && !isToolkits && !isMCPs && !isPipelines
        ? [
            {
              id: 'status',
              label: '',
              noSort: true,
              width: '0.1875rem',
              headCellPadding: '0',
              rowCellPadding: '0',
              hide: showLikes || isAppAll || hideStatusColumn,
              format: value => <StatusBar status={value} />,
            },
            {
              id: SortFields.Name,
              label: 'Name & Description',
              minWidth: 150,
              width: windowWidth > 1200 ? undefined : 200,
              rowCellPadding: styles.rowCellPadding,
            },
          ]
        : [
            {
              id: SortFields.Name,
              label: 'Name & Description',
              minWidth: 150,
              width: windowWidth > 1200 ? undefined : 200,
              rowCellPadding: styles.rowCellPadding,
            },
          ];
    // Only add toolkit Type column for Toolkits menu (case-insensitive, partial match)
    if (isToolkits) {
      baseColumns.push({
        id: 'typeLabel',
        label: 'Type',
        minWidth: 100,
        width: 150,
        format: (value, row) => (
          <Typography
            variant="bodyMedium"
            sx={styles.typeLabelText}
          >
            {row && (row.typeLabel || row.type) ? row.typeLabel || row.type : value || ''}
          </Typography>
        ),
      });
    }

    // Add credential Type column for Credentials menu (case-insensitive, partial match)
    if (isCredentials) {
      baseColumns.push({
        id: 'type',
        label: 'Type',
        minWidth: 100,
        width: 120,
        format: (value, row) => {
          if (row && row.type) {
            return row.type;
          }
          return value || '';
        },
      });
    }
    baseColumns.push(
      {
        id: 'cardType',
        label: 'Type',
        noSort: !mixedContent,
        hide: true,
        format: value =>
          isApplicationCard(value || cardType) ? (
            <ApplicationsIcon sx={styles.applicationsIcon} />
          ) : isPipelineCard(value || cardType) ? (
            <FlowIcon sx={styles.pipelinesIcon} />
          ) : (
            <FolderIcon sx={styles.folderIcon} />
          ),
      },
      {
        id: SortFields.Likes,
        label: 'Rate',
        width: 100,
        align: 'right',
        hide: !showLikes,
      },
      {
        id: SortFields.Authors,
        label: 'Authors',
        width: 240,
        noSort: isSinglePage && uniqueAuthorsCount <= 1,
      },
      {
        id: SortFields.CreatedAt,
        label: 'Created',
        minWidth: 120,
        width: 140,
        align: 'center',
        format: value => (
          <Box sx={styles.createdCell}>
            <CalendarIcon sx={styles.calendarIcon} />
            <Typography
              variant="bodyMedium"
              component="span"
            >
              {timeFormatter(value, TIME_FORMAT.MMMDD)}
            </Typography>
          </Box>
        ),
      },
    );
    if (isMCPs) {
      baseColumns.push({
        id: SortFields.Online,
        label: 'Status',
        minWidth: 100,
        width: 150,
        format: value => (
          <Box sx={styles.statusContainer}>
            {value ? (
              <Box sx={styles.onlineIconWrapper}>
                <OnlineIcon />
              </Box>
            ) : (
              <Box sx={styles.offlineIconWrapper}>
                <OfflineIcon />
              </Box>
            )}
            <Typography
              variant="bodyMedium"
              component="span"
              sx={styles.statusText(value)}
            >
              {value ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
        ),
      });
    }
    baseColumns.push({
      id: 'actions',
      label: 'Actions',
      width: 105,
      noSort: true,
    });
    return baseColumns;
  }, [
    cardType,
    mixedContent,
    showLikes,
    windowWidth,
    isToolkits,
    isMCPs,
    isCredentials,
    isPipelines,
    isAppAll,
    styles,
    hideStatusColumn,
    uniqueAuthorsCount,
    isSinglePage,
  ]);

  const columns = useMemo(() => columnsMeta.filter(item => !item?.hide), [columnsMeta]);

  const gridHeaderColumns = useMemo(
    () =>
      columns.map(c => ({
        field: c.id,
        label: c.label,
        sortable: !c.noSort,
        width: c.width,
        minWidth: c.minWidth,
        ...(c.align && { align: c.align }),
      })),
    [columns],
  );

  const gridTemplateColumns = useMemo(() => {
    const formatWidth = col => {
      const w = col.width;
      const minW = col.minWidth;
      if (w == null) {
        return `minmax(${(minW ?? 200) / 16}rem, 1fr)`;
      }
      return typeof w === 'number' ? `${w / 16}rem` : w;
    };
    return gridHeaderColumns.map(c => formatWidth(c)).join(' ');
  }, [gridHeaderColumns]);

  const handleSort = useCallback(
    field => {
      let newSortOrder = SortOrderOptions.DESC;
      const isCurrentActive = orderBy === field;
      if (isCurrentActive) {
        newSortOrder = order === SortOrderOptions.DESC ? SortOrderOptions.ASC : SortOrderOptions.DESC;
      }
      const remoteSortItems = [SortFields.Name, SortFields.CreatedAt, SortFields.Likes, SortFields.Authors];
      if (remoteSortItems.includes(field)) {
        setUrlSearchParams({
          [SearchParams.SortBy]: field,
          [SearchParams.SortOrder]: newSortOrder,
        });
      }
      setOrder(newSortOrder);
      setOrderBy(field);

      if (resetPageOnSort) {
        setTablePage(0);
        resetPageOnSort();
      }
    },
    [order, orderBy, resetPageOnSort, setUrlSearchParams],
  );

  const dataColumns = useMemo(
    () =>
      columns
        .filter(c => c.id !== SortFields.Name && c.id !== 'actions')
        .map(c => ({
          ...c,
          field: c.id,
          format: (value, row) => (
            <DataTableCell
              column={c}
              value={value}
              row={row}
              cardType={cardType}
              viewMode={viewMode}
            />
          ),
        })),
    [columns, cardType, viewMode],
  );

  const onPinChange = useCallback((id, newState) => {
    const updateList = (prevState, addState) =>
      addState ? [...prevState, id] : prevState.filter(rowId => rowId !== id);

    setPinnedRows(prev => updateList(prev, newState));
    setUnpinnedRows(prev => updateList(prev, !newState));
  }, []);

  const nameCellProps = useMemo(
    () => ({ cardType, viewMode, onPinChange }),
    [cardType, viewMode, onPinChange],
  );

  const actionsProps = useMemo(() => ({ cardType, viewMode }), [cardType, viewMode]);

  useEffect(() => {
    if (typeof externalPage === 'number' && tablePage !== externalPage) {
      setTablePage(externalPage);
    }
  }, [externalPage, tablePage]);

  const shouldLoadMore = useCallback(
    newTablePage => {
      const loadLimit = (newTablePage + 1) * rowsPerPage;
      if (data.length !== total && data.length < loadLimit) loadMoreFunc();
    },
    [data.length, loadMoreFunc, rowsPerPage, total],
  );

  const handleChangePage = useCallback(
    (_, newPage) => {
      if (externalSetPage) {
        externalSetPage(newPage);
        return;
      }
      setTablePage(newPage);
      shouldLoadMore(newPage);
    },
    [shouldLoadMore, externalSetPage],
  );

  const handleChangeRowsPerPage = useCallback(
    event => {
      const newPageSize = +event.target.value;
      setUrlSearchParams({ [SearchParams.PageSize]: newPageSize });
      externalSetPage ? externalSetPage(0) : setTablePage(0);
      dispatch(settingsActions.setPageSize(newPageSize));
    },
    [dispatch, setUrlSearchParams, externalSetPage],
  );

  const visibleRows = useMemo(() => {
    const itemsWithTypeLabel = data.map(row => ({
      ...row,
      is_pinned: pinnedRows.includes(row.id) || (row.is_pinned && !unpinnedRows.includes(row.id)),
      online:
        row.type === 'mcp' ? McpAuthHelpers.getAccessToken(row?.settings?.url || '') !== null : row.online,
      typeLabel:
        row.label || (row.icon_meta && row.icon_meta.alt ? row.icon_meta.alt.replace(' icon', '') : ''),
    }));

    // Authors sort order (asc/desc) is guaranteed by the backend — only apply pinned-first locally.
    // stableSort preserves the backend's author ordering for non-pinned items.
    const sortedItems =
      orderBy === SortFields.Authors
        ? stableSort(itemsWithTypeLabel, getPinnedComparator())
        : stableSort(itemsWithTypeLabel, getPinnedComparator(getComparator(order, orderBy)));

    return !isToolkits && !isMCPs && !isCredentials
      ? sortedItems.slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage)
      : sortedItems;
  }, [
    data,
    order,
    orderBy,
    isToolkits,
    isMCPs,
    isCredentials,
    tablePage,
    rowsPerPage,
    pinnedRows,
    unpinnedRows,
  ]);

  useEffect(() => {
    if (pageSizeFromUrl && pageSize != pageSizeFromUrl) {
      dispatch(settingsActions.setPageSize(+pageSizeFromUrl));
    }
  }, [dispatch, pageSize, pageSizeFromUrl]);

  return (
    <>
      <GridTableContainer
        isLoading={isLoading || isLoadingMore}
        isEmpty={!isLoading && !isLoadingMore && visibleRows?.length === 0}
        emptyMessage="No Data."
        loadingMessage="Loading..."
        sx={styles.container}
      >
        <Box sx={styles.tableScrollWrapper}>
          <Box sx={styles.tableGroup}>
            <GridTableHeader
              columns={gridHeaderColumns}
              sortConfig={{ field: orderBy, direction: order }}
              onSort={handleSort}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
            />
            <GridTableBody
              sx={styles.tableBody}
              minHeight={0}
            >
              {visibleRows.map(row => (
                <GridTableRow
                  key={row?.id + (row?.cardType || cardType)}
                  row={row}
                  columns={dataColumns}
                  gridTemplateColumns={gridTemplateColumns}
                  showCheckbox={false}
                  rowHeight="3.5rem"
                  isHovered={hoveredRowId === row?.id}
                  onMouseEnter={() => setHoveredRowId(row?.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  isRedesign
                  nameCellProps={nameCellProps}
                  ActionsComponent={DataTableActionsCell}
                  actionsProps={actionsProps}
                />
              ))}
            </GridTableBody>
          </Box>
        </Box>
        <GridTablePagination
          totalRows={total}
          isFirstPage={tablePage === 0}
          isLastPage={total === 0 || tablePage * rowsPerPage + rowsPerPage >= total}
          startRow={total === 0 ? 0 : tablePage * rowsPerPage + 1}
          endRow={total === 0 ? 0 : Math.min(tablePage * rowsPerPage + rowsPerPage, total)}
          pageSizeSelectOptions={rowsPerPageOptions.map(n => ({ value: n, label: String(n) }))}
          pageSize={rowsPerPage}
          handlePrevPage={() => handleChangePage(null, tablePage - 1)}
          handleNextPage={() => handleChangePage(null, tablePage + 1)}
          handlePageSizeChange={newPageSize =>
            handleChangeRowsPerPage({ target: { value: String(newPageSize) } })
          }
        />
      </GridTableContainer>
    </>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;

const TABLE_MIN_WIDTH = '42.5rem';

/** @type {MuiSx} */
const dataTableStyles = isFullWidth => ({
  container: {
    flexGrow: 1,
    width: isFullWidth ? CARD_LIST_WIDTH_FULL : CARD_LIST_WIDTH,
    overflowY: 'hidden',
  },
  tableScrollWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  tableGroup: {
    flex: 1,
    minHeight: 0,
    minWidth: TABLE_MIN_WIDTH,
    borderRadius: '0.5rem',
    gap: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
  },
  rowCellPadding: '0.375rem 1rem',
  tableBody: {
    flex: 1,
    minHeight: 0,
    overflowX: 'hidden',
    overflowY: 'auto',
    maxWidth: '100%',
    minWidth: TABLE_MIN_WIDTH,
  },
  tableCell: ({ palette }) => ({
    padding: '0.375rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    border: 'none',
  }),
  typeLabelText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '1',
    whiteSpaceCollapse: 'preserve',
  },
  createdCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  calendarIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  folderIcon: {
    width: '1rem',
    height: '1rem',
    transform: 'translate(0.25rem, 0.25rem)',
  },
  applicationsIcon: {
    width: '0.8125rem',
    height: '0.8125rem',
    transform: 'translate(0.25rem, 0.25rem)',
  },
  pipelinesIcon: {
    width: '0.8125rem',
    height: '0.8125rem',
    transform: 'translate(0.25rem, 0.25rem)',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  onlineIconWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.icon.fill.default,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
  offlineIconWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.icon.fill.attention,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
  statusText:
    value =>
    ({ palette }) => ({
      ml: '0.5rem',
      color: value ? palette.icon.fill.secondary : palette.icon.fill.disabled,
    }),
});

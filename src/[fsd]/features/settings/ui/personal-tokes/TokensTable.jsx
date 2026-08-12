import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Skeleton } from '@mui/material';

import { usePagination, useResponsiveColumns, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { PERSONAL_TOKENS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import ExpiryInDays from '@/[fsd]/features/settings/ui/personal-tokes/ExpiryInDays';
import TokenActionsCell from '@/[fsd]/features/settings/ui/personal-tokes/TokenActionsCell';
import { Text } from '@/[fsd]/shared/ui';
import { useTokenDeleteMutation, useTokenListQuery } from '@/api/auth';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';

const TOKENS_TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 50, 100],
};

const TOKENS_COLUMNS = [
  { field: 'name', label: 'Token name', width: '1.5fr', sortable: true },
  { field: 'token', label: 'Token value', width: '1fr', sortable: false },
  { field: 'expires', label: 'Expiration', width: '0.8fr', sortable: true },
  { field: 'actions', label: 'Actions', width: '9.375rem', sortable: false },
];

const TokensTable = memo(props => {
  const { showDownload, onIdeSettingsDownload, onPreviewSettings, filteredTokens = null } = props;
  const styles = tokensTableStyles();
  const user = useSelector(state => state.user);
  const {
    data: tokens = [],
    isFetching: isFetchingTokens,
    refetch,
  } = useTokenListQuery({ skip: !user.personal_project_id });
  const [deleteToken] = useTokenDeleteMutation();
  const { windowWidth } = useGetWindowWidth();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const displayTokens = filteredTokens !== null ? filteredTokens : tokens;

  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: TOKENS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
    actionsColumnWidth: '9.375rem',
  });

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });

  const sortedTokens = useMemo(() => sortData(displayTokens), [sortData, displayTokens]);

  const pagination = usePagination({
    totalRows: sortedTokens.length,
    defaultPageSize: TOKENS_TABLE_CONFIG.DEFAULT_PAGE_SIZE,
    pageSizeOptions: TOKENS_TABLE_CONFIG.PAGE_SIZE_OPTIONS,
  });

  const { paginateData } = pagination;
  const paginatedTokens = useMemo(() => paginateData(sortedTokens), [paginateData, sortedTokens]);

  const onDownload = useCallback(
    token => () => {
      onIdeSettingsDownload(token, 'jetbrains');
    },
    [onIdeSettingsDownload],
  );

  const onPreview = useCallback(
    token => () => {
      onPreviewSettings(token);
    },
    [onPreviewSettings],
  );

  const onVsCodeDownload = useCallback(
    token => () => {
      onIdeSettingsDownload(token, 'vscode');
    },
    [onIdeSettingsDownload],
  );

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'name') {
        // Dead branch for THIS table: GridTableRow special-cases the name
        // column via GridTableRowNameCell / nameCellTestId (below), never
        // through renderCell — kept only because TOKENS_COLUMNS declares a
        // 'name' field and other renderCell callers rely on this shape.
        return (
          <Text.EllipsisTypography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.nameCell}
          >
            {row.name}
          </Text.EllipsisTypography>
        );
      }

      if (column.field === 'token') {
        return (
          <Text.EllipsisTypography
            data-testid="token-value-cell"
            variant="bodyMedium"
            color="text.secondary"
          >
            {'...' + row.token.substring(row.token.length - 4)}
          </Text.EllipsisTypography>
        );
      }

      if (column.field === 'expires') {
        return <ExpiryInDays expires={row.expires} />;
      }

      return value || '-';
    },
    [styles.nameCell],
  );

  const renderActions = useCallback(
    row => {
      return (
        <TokenActionsCell
          token={row}
          deleteToken={deleteToken}
          refetch={refetch}
          onDownload={onDownload(row?.token || '')}
          onVsCodeDownload={onVsCodeDownload(row?.token || '')}
          onPreview={onPreview(row)}
          showDownload={showDownload}
        />
      );
    },
    [deleteToken, refetch, onDownload, onVsCodeDownload, onPreview, showDownload],
  );

  return !isFetchingTokens ? (
    <Box
      key={`tokens-table-${sideBarCollapsed}`}
      data-tour={PERSONAL_TOKENS_TOUR_TARGET_IDS.tokenList}
      sx={styles.tableContainer}
    >
      <GridTableContainer
        isLoading={false}
        isEmpty={paginatedTokens.length === 0}
        emptyMessage="No tokens"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={handleSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
          columnTestIdPrefix="personal-token"
        />

        <GridTableBody>
          {paginatedTokens.map(row => (
            <GridTableRow
              key={row.id}
              data-testid="token-row"
              nameCellTestId="token-name-cell"
              row={row}
              isSelected={false}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              columns={dataColumns}
              renderCell={renderCell}
              actions={renderActions(row)}
              showCheckbox={false}
              dataCellSx={styles.dataCell}
              actionsCellSx={styles.dataCell}
            />
          ))}
        </GridTableBody>

        {sortedTokens.length > 0 && <GridTablePagination {...pagination} />}
      </GridTableContainer>
    </Box>
  ) : (
    <Box sx={styles.loadingContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton
          key={index}
          sx={styles.skeleton}
          variant="rectangular"
          width="100%"
          height={40}
        />
      ))}
    </Box>
  );
});

TokensTable.displayName = 'TokensTable';

/** @type {MuiSx} */
const tokensTableStyles = () => ({
  tableContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    margin: '1.25rem',
  },
  skeleton: {
    marginBottom: '0.5rem',
  },
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0rem 1rem',
    height: '100%',
  },
  nameCell: { wordBreak: 'break-word' },
});

export default TokensTable;

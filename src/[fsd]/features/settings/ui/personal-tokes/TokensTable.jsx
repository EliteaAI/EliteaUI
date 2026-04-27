import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, IconButton, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';

import { usePagination, useResponsiveColumns, useTableSort } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import { Text } from '@/[fsd]/shared/ui';
import { useTokenDeleteMutation, useTokenListQuery } from '@/api/auth';
import VsCodeIcon from '@/assets/vscode.svg?react';
import { calculateExpiryInDays } from '@/common/utils';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import JetBrainsIcon from '@/components/Icons/JetBrainsIcon';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import RemoveIcon from '@/components/Icons/RemoveIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';
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

const ExpiryInDays = memo(props => {
  const { expires } = props;
  const theme = useTheme();
  const styles = expiryInDaysStyles();
  const expiryInDays = calculateExpiryInDays(expires);

  if (expiryInDays > 7) {
    return (
      <Box sx={styles.container}>
        <SuccessIcon
          width={16}
          height={16}
          fill={theme.palette.status.published}
        />
        <Text.EllipsisTypography
          sx={styles.text}
          color="text.secondary"
          variant="bodySmall"
        >
          {`in ${expiryInDays} days`}
        </Text.EllipsisTypography>
      </Box>
    );
  }

  if (expiryInDays > 0) {
    return (
      <Box sx={styles.container}>
        <AttentionIcon
          width={16}
          height={16}
          fill={theme.palette.status.onModeration}
        />
        <Text.EllipsisTypography
          sx={styles.text}
          color="text.secondary"
          variant="bodyMedium"
        >
          {`in ${expiryInDays} days`}
        </Text.EllipsisTypography>
      </Box>
    );
  }

  if (expiryInDays === -1) {
    return (
      <Box sx={styles.container}>
        <SuccessIcon
          width={16}
          height={16}
          fill={theme.palette.status.published}
        />
        <Text.EllipsisTypography
          sx={styles.textNever}
          color="text.secondary"
          variant="bodyMedium"
        >
          Never
        </Text.EllipsisTypography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <RemoveIcon
        width={16}
        height={16}
        fill={theme.palette.icon.fill.disabled}
      />
      <Typography
        sx={styles.textNever}
        color="text.primary"
        variant="bodyMedium"
      >
        Expired
      </Typography>
    </Box>
  );
});

ExpiryInDays.displayName = 'ExpiryInDays';

const TokenActionsCell = memo(props => {
  const { token, deleteToken, refetch, onDownload, onVsCodeDownload, onPreview, showDownload } = props;
  const styles = tokenActionsCellStyles();
  const [isDeleting, setIsDeleting] = useState(false);

  const onClickDelete = useCallback(async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      const { error } = await deleteToken({ uuid: token.uuid });
      if (!error) {
        await refetch();
      }
      setIsDeleting(false);
    }
  }, [deleteToken, isDeleting, refetch, token.uuid]);

  return (
    <Box sx={styles.container}>
      {showDownload && (
        <Tooltip
          title="Preview settings"
          placement="top"
        >
          <IconButton
            variant="alita"
            size="small"
            color="tertiary"
            onClick={onPreview}
          >
            <OpenEyeIcon sx={styles.icon} />
          </IconButton>
        </Tooltip>
      )}
      {showDownload && (
        <Tooltip
          title="Download VScode settings"
          placement="top"
        >
          <Box
            sx={styles.downloadBox}
            onClick={onVsCodeDownload}
          >
            <VsCodeIcon
              width={14}
              height={14}
            />
          </Box>
        </Tooltip>
      )}
      {showDownload && (
        <Tooltip
          title="Download Jetbrains settings"
          placement="top"
        >
          <Box
            sx={styles.downloadBox}
            onClick={onDownload}
          >
            <JetBrainsIcon sx={styles.icon} />
          </Box>
        </Tooltip>
      )}
      <DeleteEntityButton
        name={token.name}
        onDelete={onClickDelete}
        title={`Delete token`}
        isLoading={isDeleting}
        validatePermission={false}
        buttonColor="tertiary"
      />
    </Box>
  );
});

TokenActionsCell.displayName = 'TokenActionsCell';

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

  // Use filtered tokens if provided, otherwise use all tokens
  const displayTokens = filteredTokens !== null ? filteredTokens : tokens;

  // Grid table hooks
  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: TOKENS_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
    actionsColumnWidth: '9.375rem', // 150px to fit all 4 action buttons
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
        />

        <GridTableBody>
          {paginatedTokens.map(row => (
            <GridTableRow
              key={row.id}
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
const expiryInDaysStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    minHeight: '100%',
    width: '100%',
    gap: '0.5rem',
    boxSizing: 'border-box',
  },
  text: {
    width: 'calc(100% - 1.5rem)',
  },
  textNever: {
    lineHeight: '100%',
    width: 'calc(100% - 1.5rem)',
  },
});

/** @type {MuiSx} */
const tokenActionsCellStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: { xs: '0.25rem', sm: '0.5rem' },
    minWidth: 0,
    overflow: 'hidden',
  },
  iconButton: {
    padding: 0,
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
  },
  downloadBox: {
    padding: '0.125rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '1.25rem',
    height: '1.25rem',
  },
  deleteButton: {
    marginRight: 0,
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    padding: 0,
  },
  icon: ({ palette }) => ({
    color: palette.icon.fill.default,
    fontSize: '0.875rem',
  }),
});

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

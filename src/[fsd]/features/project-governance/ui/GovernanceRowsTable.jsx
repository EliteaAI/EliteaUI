import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { useResponsiveColumns } from '@/[fsd]/entities/grid-table/lib';
import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTableRow,
} from '@/[fsd]/entities/grid-table/ui';
import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { useGetWindowWidth } from '@/[fsd]/shared/lib/hooks';
import { Text } from '@/[fsd]/shared/ui';

import GovernanceRowActions from './GovernanceRowActions';

// The rows of one governed kind, or the inbox (every kind, `showKind`), with each row's state and, when nobody in the
// project can approve it, "Needs a platform operator" (C-1009, #7269)
const COLUMNS = [
  { field: 'name', label: 'Item', width: '1.4fr' },
  { field: 'kind', label: 'Kind', width: '0.8fr', hideBelow: 700 },
  { field: 'details', label: 'Details', width: '1.6fr', hideBelow: 900 },
  { field: 'state', label: 'State', width: '1.1fr' },
  { field: 'actions', label: 'Actions', width: '14rem' },
];

const GovernanceRowsTable = memo(props => {
  const {
    items,
    showKind = false,
    isLoading,
    emptyMessage,
    userId,
    checkPermission,
    onRun,
    onApprove,
    isBusy,
  } = props;
  const styles = governanceRowsTableStyles();
  const { windowWidth } = useGetWindowWidth();

  const columns = showKind ? COLUMNS : COLUMNS.filter(column => column.field !== 'kind');
  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns,
    containerWidth: windowWidth,
    showCheckbox: false,
    actionsColumnWidth: '14rem',
  });

  const rows = items.map(({ kind, row }) => ({
    ...row,
    id: `${kind}:${row.id}`,
    name: GovernanceHelpers.rowTitle(kind, row),
    kindLabel: GovernanceHelpers.KIND_LABELS[kind],
    governedKind: kind,
    original: row,
  }));

  const renderCell = useCallback(
    (column, _value, row) => {
      if (column.field === 'kind') {
        return (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {row.kindLabel}
          </Typography>
        );
      }
      if (column.field === 'details') {
        return (
          <Text.EllipsisTypography
            variant="bodySmall"
            color="text.secondary"
          >
            {GovernanceHelpers.rowDetails(row.governedKind, row.original).filter(Boolean).join(' · ')}
          </Text.EllipsisTypography>
        );
      }
      if (column.field === 'state') {
        return (
          <Box sx={styles.state}>
            <Typography variant="bodySmall">{GovernanceHelpers.stateLabel(row.state)}</Typography>
            {row.escalated && (
              <Typography
                variant="bodySmall2"
                color="warning.main"
                title={GovernanceHelpers.ESCALATED_HINT}
                data-testid={`governance-escalated-${row.id}`}
              >
                {GovernanceHelpers.ESCALATED_TEXT}
              </Typography>
            )}
          </Box>
        );
      }
      return null;
    },
    [styles.state],
  );

  return (
    <GridTableContainer
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage={emptyMessage}
    >
      <GridTableHeader
        columns={visibleColumns}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
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
            dataCellSx={styles.dataCell}
            data-testid="governance-row"
            nameCellTestId="governance-row-name"
            actions={
              <GovernanceRowActions
                kind={row.governedKind}
                row={row.original}
                userId={userId}
                checkPermission={checkPermission}
                onRun={onRun}
                onApprove={onApprove}
                isBusy={isBusy}
              />
            }
          />
        ))}
      </GridTableBody>
    </GridTableContainer>
  );
});

GovernanceRowsTable.displayName = 'GovernanceRowsTable';

/** @type {MuiSx} */
const governanceRowsTableStyles = () => ({
  state: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem',
    minWidth: 0,
  },
});

export default GovernanceRowsTable;

import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';

import GridTableRowActionsCell from './GridTableRowActionsCell';
import GridTableRowDataCell from './GridTableRowDataCell';
import GridTableRowNameCell from './GridTableRowNameCell';

const GridTableRow = memo(props => {
  const {
    row,
    isSelected = false,
    isHovered = false,
    onSelect,
    onMouseEnter,
    onMouseLeave,
    gridTemplateColumns,
    columns = [],
    idField = 'id',
    nameField = 'name',
    showCheckbox = true,
    namePrefix,
    isRedesign = false,
    NameCellComponent,
    nameCellProps,
    actions,
    actionsCellSx,
    dataCellSx,
    ActionsComponent,
    actionsProps,
    isLoading = false,
    loadingProgress = 0,
    renderCell,
    rowHeight,
    checkboxCellSx,
  } = props;

  const styles = gridTableRowStyles(isSelected, isHovered, gridTemplateColumns, showCheckbox, rowHeight);

  const rowId = row[idField];
  const rowName = row[nameField];

  const handleCheckboxChange = useCallback(() => {
    onSelect?.(rowId);
  }, [onSelect, rowId]);

  // Separate name column from data columns
  const dataColumns = columns.filter(col => col.field !== nameField && col.field !== 'actions');

  return (
    <Box
      sx={styles.row}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showCheckbox && (
        <Box sx={[styles.checkboxCell, checkboxCellSx]}>
          {!isLoading && (
            <Checkbox.BaseCheckbox
              checked={isSelected}
              onChange={handleCheckboxChange}
              sx={styles.checkbox}
              onClick={e => e.stopPropagation()}
            />
          )}
        </Box>
      )}

      <Box sx={styles.nameCell}>
        <GridTableRowNameCell
          isRedesign={isRedesign}
          NameCellComponent={NameCellComponent}
          nameCellProps={nameCellProps}
          row={row}
          isHovered={isHovered}
          namePrefix={namePrefix}
          isLoading={isLoading}
          loadingProgress={loadingProgress}
          rowName={rowName}
          styles={styles}
        />
      </Box>

      {dataColumns.map(column => (
        <GridTableRowDataCell
          key={column.field}
          column={column}
          row={row}
          renderCell={renderCell}
          dataCellSx={dataCellSx}
          styles={styles}
        />
      ))}

      <GridTableRowActionsCell
        ActionsComponent={ActionsComponent}
        actionsProps={actionsProps}
        actions={actions}
        row={row}
        isLoading={isLoading}
        actionsCellSx={actionsCellSx}
        styles={styles}
      />
    </Box>
  );
});

GridTableRow.displayName = 'GridTableRow';

/** @type {MuiSx} */
const gridTableRowStyles = (isSelected, isHovered, gridTemplateColumns, showCheckbox, rowHeight) => ({
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns || (showCheckbox ? '3rem 1fr' : '1fr'),
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
    ...(rowHeight ? { height: rowHeight, minHeight: rowHeight } : { minHeight: '2.5rem' }),
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: isSelected || isHovered ? palette.background.userInputBackground : 'transparent',
    transition: 'background-color 0.2s ease',
    '&:first-of-type': {
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem',
    },
    '&:last-of-type': {
      borderBottom: 'none',
      borderBottomLeftRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem',
    },
  }),
  checkboxCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    position: 'relative',
  },
  checkbox: {
    padding: '0.375rem',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  nameContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  progressBar: ({ palette }) => ({
    width: '100%',
    height: '0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.background.secondary,
    '& .MuiLinearProgress-bar': {
      borderRadius: '0.25rem',
    },
  }),
  dataCell: (column, palette) => ({
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
    color: palette.text.secondary,
    ...(column?.align === 'right' && { justifyContent: 'flex-end' }),
  }),
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
  },
});

export default GridTableRow;

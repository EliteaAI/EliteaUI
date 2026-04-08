import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';
import SortArrows from '@/assets/sort_arrows.svg?react';

const GridTableHeader = memo(props => {
  const {
    columns,
    sortConfig,
    onSort,
    onSelectAll,
    isAllSelected = false,
    isIndeterminate = false,
    gridTemplateColumns,
    showCheckbox = true,
  } = props;

  const styles = gridTableHeaderStyles(gridTemplateColumns, showCheckbox);

  return (
    <Box sx={styles.header}>
      {showCheckbox && (
        <Box sx={styles.checkboxCell}>
          <Checkbox.BaseCheckbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={onSelectAll}
            sx={styles.checkbox}
          />
          <Box sx={styles.divider} />
        </Box>
      )}

      {columns.map((column, index) => {
        const isActive = sortConfig?.field === column.field;
        const isLastItem = index === columns.length - 1;
        const isSortable = column.sortable && onSort;

        return (
          <Box
            key={`header-${column.field || index}`}
            sx={styles.headerCell(isActive, isLastItem, isSortable, column.sortable, column.align)}
            onClick={isSortable || column.sortable ? () => onSort(column.field) : undefined}
          >
            {isSortable && (
              <Box sx={styles.sortButton}>
                <SortArrows style={styles.sortIcon(isActive, sortConfig?.direction === 'desc')} />
              </Box>
            )}
            <Typography
              variant="labelMedium"
              color="text.secondary"
              sx={styles.headerText}
            >
              {column.label}
            </Typography>
            {!isLastItem && <Box sx={styles.divider} />}
          </Box>
        );
      })}
    </Box>
  );
});

GridTableHeader.displayName = 'GridTableHeader';

/** @type {MuiSx} */
const gridTableHeaderStyles = (gridTemplateColumns, showCheckbox) => ({
  header: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns || (showCheckbox ? '3rem 1fr' : '1fr'),
    alignItems: 'stretch',
    width: '100%',
    height: '2.25rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  checkboxCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    borderTopLeftRadius: '0.5rem',
    borderBottomLeftRadius: '0.5rem',
    position: 'relative',
  },
  checkbox: {
    padding: '0.375rem 0.5rem',
  },
  headerCell: (isActive, isLastItem, isSortable, align) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    cursor: isSortable ? 'pointer' : 'default',
    position: 'relative',
    opacity: isActive ? 1 : 0.7,
    transition: 'opacity 0.2s ease',
    minWidth: 0,
    overflow: 'hidden',
    ...(align === 'right' && { justifyContent: 'flex-end' }),
    '&:hover': {
      opacity: 1,
    },
    ...(isLastItem && {
      borderTopRightRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem',
    }),
  }),
  sortButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.375rem',
    borderRadius: '1rem',
  },
  sortIcon: (isActive, isDescending) => ({
    width: '1rem',
    height: '1rem',
    transform: isActive && isDescending ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  }),
  headerText: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  divider: ({ palette }) => ({
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '0.0625rem',
    height: '1.25rem',
    backgroundColor: palette.divider,
  }),
});

export default GridTableHeader;

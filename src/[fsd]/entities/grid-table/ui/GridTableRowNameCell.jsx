import { memo } from 'react';

import DefaultNameCellContent from '@/[fsd]/entities/grid-table/ui/DefaultNameCellContent';
import { DataTableNameCell } from '@/[fsd]/widgets/data-table';

const GridTableRowNameCell = memo(props => {
  const {
    isRedesign,
    NameCellComponent,
    nameCellProps,
    row,
    isHovered,
    namePrefix,
    isLoading,
    loadingProgress,
    rowName,
    styles,
  } = props;

  if (isRedesign) {
    return (
      <DataTableNameCell
        {...nameCellProps}
        row={row}
        isRowHovered={isHovered}
      />
    );
  }

  if (NameCellComponent) {
    return (
      <NameCellComponent
        {...nameCellProps}
        row={row}
        isRowHovered={isHovered}
      />
    );
  }

  return (
    <DefaultNameCellContent
      namePrefix={namePrefix}
      isLoading={isLoading}
      loadingProgress={loadingProgress}
      rowName={rowName}
      styles={styles}
    />
  );
});

GridTableRowNameCell.displayName = 'GridTableRowNameCell';

export default GridTableRowNameCell;

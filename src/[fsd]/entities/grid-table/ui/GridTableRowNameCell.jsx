import { memo } from 'react';

import DefaultNameCellContent from '@/[fsd]/entities/grid-table/ui/DefaultNameCellContent';

const GridTableRowNameCell = memo(props => {
  const {
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

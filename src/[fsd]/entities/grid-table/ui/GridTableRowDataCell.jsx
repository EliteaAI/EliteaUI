import { memo } from 'react';

import { Box } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

function getCellContent(column, value, row, renderCell) {
  if (typeof column.format === 'function') {
    return column.format(value, row);
  }
  if (renderCell) {
    return renderCell(column, value, row);
  }
  return value ?? '-';
}

const GridTableRowDataCell = memo(props => {
  const { column, row, renderCell, dataCellSx, styles } = props;
  const value = row[column.displayField || column.field];
  const cellContent = getCellContent(column, value, row, renderCell);

  if (typeof cellContent === 'string') {
    return (
      <Box sx={[({ palette }) => styles.dataCell(column, palette), dataCellSx]}>
        <Tooltip.TypographyWithConditionalTooltip
          title={cellContent}
          placement="top"
          variant="bodyMedium"
          sx={styles.cellText}
        >
          {cellContent}
        </Tooltip.TypographyWithConditionalTooltip>
      </Box>
    );
  }

  return <Box sx={[({ palette }) => styles.dataCell(column, palette), dataCellSx]}>{cellContent}</Box>;
});

GridTableRowDataCell.displayName = 'GridTableRowDataCell';

export default GridTableRowDataCell;

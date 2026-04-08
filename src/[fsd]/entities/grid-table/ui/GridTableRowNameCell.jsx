import { memo } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';
import { DataTableNameCell } from '@/[fsd]/widgets/DataTable';

const DefaultNameCellContent = memo(props => {
  const { namePrefix, isLoading, loadingProgress, rowName, styles } = props;

  return (
    <>
      {namePrefix}
      <Box sx={styles.nameContent}>
        {isLoading ? (
          <>
            <Typography
              variant="bodyMedium"
              color="text.primary"
              sx={styles.nameText}
            >
              {rowName}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={loadingProgress}
              sx={styles.progressBar}
            />
          </>
        ) : (
          <Tooltip.TypographyWithConditionalTooltip
            title={rowName}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.nameText}
          >
            {rowName}
          </Tooltip.TypographyWithConditionalTooltip>
        )}
      </Box>
    </>
  );
});

DefaultNameCellContent.displayName = 'DefaultNameCellContent';

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

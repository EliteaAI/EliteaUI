import { memo } from 'react';

import { Box } from '@mui/material';

const GridTableRowActionsCell = memo(props => {
  const { ActionsComponent, actionsProps, actions, row, isLoading, actionsCellSx, styles } = props;

  if (!ActionsComponent && !actions) {
    return null;
  }

  let content = null;
  if (!isLoading) {
    if (ActionsComponent) {
      content = (
        <ActionsComponent
          row={row}
          {...actionsProps}
        />
      );
    } else {
      content = actions;
    }
  }

  return <Box sx={[styles.actionsCell, actionsCellSx]}>{content}</Box>;
});

GridTableRowActionsCell.displayName = 'GridTableRowActionsCell';

export default GridTableRowActionsCell;

import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { RUN_STATUS_STYLES } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { StatusDot } from '@/[fsd]/shared/ui';

// The Status cell of a run row: a coloured dot and the label, as the run history design and its Status filter show
// them. A status with no style (or no status) shows the empty mark, so every list reads the same.
const RunStatusCell = memo(props => {
  const { status, emptyMark = '-' } = props;

  const styles = runStatusCellStyles();
  const style = RUN_STATUS_STYLES[status];

  if (!status) return emptyMark;

  return (
    <Box
      component="span"
      sx={styles.root}
      data-testid="run-status-cell"
    >
      <StatusDot color={RUN_STATUS_STYLES[status]?.color} />
      <Typography
        variant="bodySmall"
        component="span"
      >
        {style?.label ?? status}
      </Typography>
    </Box>
  );
});

RunStatusCell.displayName = 'RunStatusCell';

/** @type {MuiSx} */
const runStatusCellStyles = () => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
});

export default RunStatusCell;

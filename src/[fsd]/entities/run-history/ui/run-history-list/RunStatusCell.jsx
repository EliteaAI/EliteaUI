import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { RUN_STATUS_STYLES } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';

// The Status cell of a run row: a coloured dot and the label, as the run history design and its Status filter show
// them. A status with no style (or no status) shows the empty mark, so every list reads the same.
const RunStatusCell = memo(props => {
  const { status, emptyMark = '-' } = props;

  const styles = runStatusCellStyles(RUN_STATUS_STYLES[status]?.color);
  const style = RUN_STATUS_STYLES[status];

  if (!status) return emptyMark;

  return (
    <Box
      component="span"
      sx={styles.root}
      data-testid="run-status-cell"
    >
      <Box
        component="span"
        sx={styles.dot}
      />
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

// The dot takes the palette colour of the status (a palette path such as 'success.main')
/** @type {MuiSx} */
const runStatusCellStyles = color => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  dot: ({ palette }) => ({
    display: 'inline-block',
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color ? color.split('.').reduce((value, key) => value[key], palette) : undefined,
  }),
});

export default RunStatusCell;

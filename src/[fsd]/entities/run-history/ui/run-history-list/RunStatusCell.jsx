import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { RUN_STATUS_STYLES } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { toRunStatusMeta } from '@/[fsd]/entities/schedule';
import { StatusDot } from '@/[fsd]/shared/ui';

const RunStatusCell = memo(props => {
  const { status, emptyMark = '-' } = props;

  const styles = runStatusCellStyles();

  if (!status) return emptyMark;

  // Schedule-only statuses (waiting for input, expired, cancelled) fall back to the shared status table
  const { label, color } = RUN_STATUS_STYLES[status] ?? toRunStatusMeta(status);

  return (
    <Box
      component="span"
      sx={styles.root}
      data-testid="run-status-cell"
    >
      <StatusDot color={color} />
      <Typography
        variant="bodySmall"
        component="span"
      >
        {label}
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

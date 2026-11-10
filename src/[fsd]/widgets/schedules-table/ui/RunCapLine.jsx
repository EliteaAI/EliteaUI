import { memo } from 'react';

import { Typography } from '@mui/material';

// The API sends both only on webhook rows; the line shows only once the cap is reached (#7400)
export const isAtRunCap = row => Number.isInteger(row.run_cap) && (row.running_runs ?? 0) >= row.run_cap;

const RunCapLine = memo(props => {
  const { row } = props;

  return (
    <Typography
      variant="bodySmall"
      component="span"
      color="warning.main"
      data-testid="webhook-run-cap"
    >
      {`${row.running_runs} running / ${row.run_cap}`}
    </Typography>
  );
});

RunCapLine.displayName = 'RunCapLine';
export default RunCapLine;

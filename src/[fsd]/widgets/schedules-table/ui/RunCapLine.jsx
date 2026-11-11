import { memo } from 'react';

import { Typography } from '@mui/material';

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

import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { StatusDot } from '@/[fsd]/shared/ui';

const StatusOptionLabel = memo(props => {
  const { label, color } = props;

  const styles = statusOptionLabelStyles();

  if (!color) {
    return <Typography variant="labelMedium">{label}</Typography>;
  }

  return (
    <Box sx={styles.root}>
      <StatusDot color={color} />
      <Typography variant="labelMedium">{label}</Typography>
    </Box>
  );
});

StatusOptionLabel.displayName = 'StatusOptionLabel';

/** @type {MuiSx} */
const statusOptionLabelStyles = () => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default StatusOptionLabel;

import { memo } from 'react';

import { Box } from '@mui/material';

// A small round status mark. The colour is a palette path (such as 'success.main'), so it follows the theme in light
// and dark mode. Used by the run statuses (the Status column and its filter) and the complexity labels.
const StatusDot = memo(props => {
  const { color } = props;

  const styles = statusDotStyles(color);

  return (
    <Box
      component="span"
      sx={styles.dot}
    />
  );
});

StatusDot.displayName = 'StatusDot';

/** @type {MuiSx} */
const statusDotStyles = color => ({
  dot: ({ palette }) => ({
    display: 'inline-block',
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color ? color.split('.').reduce((value, key) => value[key], palette) : undefined,
  }),
});

export default StatusDot;

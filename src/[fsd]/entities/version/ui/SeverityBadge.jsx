import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const SeverityBadge = memo(props => {
  const { icon, label, count, onClick, disabled } = props;
  return (
    <Box
      sx={[
        styles.counter,
        {
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': disabled ? {} : { opacity: 0.8 },
        },
      ]}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
    >
      {icon && <Box sx={styles.counterIcon}>{icon}</Box>}
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={{ fontWeight: 600, marginLeft: 'auto' }}
      >
        {count}
      </Typography>
    </Box>
  );
});

SeverityBadge.displayName = 'SeverityBadge';

/** @type {MuiSx} */
const styles = {
  counter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '2rem',
    padding: '0.375rem 0.75rem',
    flex: 1,
  }),
  counterIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
};

export default SeverityBadge;

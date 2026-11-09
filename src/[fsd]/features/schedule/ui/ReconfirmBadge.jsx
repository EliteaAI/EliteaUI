import { memo } from 'react';

import { Box, Chip, Link, Typography } from '@mui/material';

// "Run without asking" no longer holds for the next run (tools changed, or another person confirmed it)
const ReconfirmBadge = memo(props => {
  const { onReview } = props;

  return (
    <Box
      sx={styles.root}
      data-testid="schedule-needs-reconfirm"
    >
      <Chip
        size="small"
        color="warning"
        label="Needs re-confirm"
      />
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Runs pause and ask until you confirm the sensitive tools again.{' '}
        <Link
          component="button"
          type="button"
          variant="bodySmall"
          onClick={onReview}
          data-testid="schedule-reconfirm-review"
        >
          Review risks
        </Link>
      </Typography>
    </Box>
  );
});

ReconfirmBadge.displayName = 'ReconfirmBadge';

/** @type {MuiSx} */
const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    padding: '0.75rem 1.5rem 0',
  },
};

export default ReconfirmBadge;

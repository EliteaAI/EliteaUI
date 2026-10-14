import { memo } from 'react';

import { Box, Typography } from '@mui/material';

// Why the run stopped on this case (#6809 item 2): identities only, the paused call's args are not stored.
const PauseDetails = memo(props => {
  const { details } = props;
  const styles = pauseDetailsStyles();
  return (
    <Box
      sx={[styles.expected, styles.pause]}
      data-testid="case-pause-details"
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        {details.title}
      </Typography>
      {details.items.length > 0 && (
        <Box sx={styles.metrics}>
          {details.items.map(({ label, value }) => (
            <Box
              key={label}
              sx={styles.metric}
            >
              <Typography
                variant="labelSmall"
                sx={styles.stepMeta}
              >
                {label}
              </Typography>
              <Typography variant="bodySmall">{value}</Typography>
            </Box>
          ))}
        </Box>
      )}
      <Typography
        variant="bodySmall"
        sx={styles.stepMeta}
      >
        {details.note}
      </Typography>
    </Box>
  );
});

PauseDetails.displayName = 'PauseDetails';

/** @type {MuiSx} */
const pauseDetailsStyles = () => ({
  metricLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  expected: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 1.5rem',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepMeta: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  pause: ({ palette }) => ({
    borderColor: palette.warning.main,
  }),
});

export default PauseDetails;

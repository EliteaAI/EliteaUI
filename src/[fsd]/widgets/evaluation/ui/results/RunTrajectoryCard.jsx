import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { buildRunTrajectorySummary } from '../../lib/helpers';

/**
 * What the agent did across the run (#6809 G7): per-case averages of the trajectory counters over
 * the cases that recorded one, and how many cases were left out and why. Renders nothing for a run
 * that predates the rollup.
 */
const RunTrajectoryCard = memo(props => {
  const { rollup } = props;

  const summary = useMemo(() => buildRunTrajectorySummary(rollup), [rollup]);

  const styles = runTrajectoryCardStyles();

  if (!summary) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-trajectory"
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodySmall2"
          sx={styles.title}
        >
          Trajectory
        </Typography>
        {summary.coverage && (
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            {summary.coverage}
          </Typography>
        )}
      </Box>

      {summary.items.length > 0 && (
        <Box sx={styles.items}>
          {summary.items.map(item => (
            <Box
              key={item.label}
              sx={styles.item}
            >
              <Typography
                variant="labelSmall"
                sx={styles.label}
              >
                {item.label}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.value}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {summary.excluded && (
        <Typography
          variant="bodySmall"
          sx={styles.muted}
          data-testid="evaluation-trajectory-excluded"
        >
          {summary.excluded}
        </Typography>
      )}
    </Box>
  );
});

RunTrajectoryCard.displayName = 'RunTrajectoryCard';

/** @type {MuiSx} */
const runTrajectoryCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '0.75rem 1.5rem 0',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: palette.text.primary,
  }),
  items: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 2rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  value: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  muted: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default RunTrajectoryCard;

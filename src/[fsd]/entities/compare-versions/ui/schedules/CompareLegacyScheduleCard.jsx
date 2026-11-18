import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';

// The cron trigger a version still keeps in pipeline_settings until the schedule migration; read only
const CompareLegacyScheduleCard = memo(props => {
  const { trigger, side } = props;
  const styles = compareLegacyScheduleCardStyles();

  return (
    <Box
      sx={styles.card}
      data-testid={`compare-legacy-schedule-${side}`}
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        {COMPARE_MESSAGES.legacySchedule}
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.value}
      >{`Cron: ${trigger.cron}`}</Typography>
      <Typography
        variant="bodySmall"
        sx={styles.value}
      >{`Timezone: ${trigger.timezone || '—'}`}</Typography>
      <Typography
        variant="bodySmall2"
        sx={styles.note}
      >
        {COMPARE_MESSAGES.legacyScheduleNote}
      </Typography>
    </Box>
  );
});

CompareLegacyScheduleCard.displayName = 'CompareLegacyScheduleCard';

/** @type {MuiSx} */
const compareLegacyScheduleCardStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  title: ({ palette }) => ({ color: palette.text.secondary }),
  value: ({ palette }) => ({ color: palette.text.secondary, fontFamily: 'monospace' }),
  note: ({ palette }) => ({ color: palette.text.primary }),
});

export default CompareLegacyScheduleCard;

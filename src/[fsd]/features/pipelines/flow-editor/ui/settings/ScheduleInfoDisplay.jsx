import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';

const ScheduleInfoDisplay = memo(props => {
  const { cron, timezone, lastRun, sx } = props;

  const styles = scheduleInfoDisplayStyles();

  const formattedLastRun = useMemo(() => {
    if (!lastRun) return null;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone || undefined,
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(lastRun));
  }, [lastRun, timezone]);

  const formattedNextRun = useMemo(() => {
    if (!cron) return null;
    const nextRun = ScheduleHelpers.getNextCronRun(cron);
    if (!nextRun) return '-';
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone || undefined,
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(nextRun);
  }, [cron, timezone]);

  return (
    <Box sx={sx}>
      {cron && (
        <CopyToClipboardButton
          label="Schedule:"
          value={cron}
          tooltip="Copy cron expression"
          copyMessage="The cron expression has been copied to the clipboard."
        />
      )}
      {timezone && (
        <Box sx={styles.row}>
          <Typography variant="bodyMedium">Timezone:</Typography>
          <Typography variant="bodyMedium">{timezone}</Typography>
        </Box>
      )}
      {formattedLastRun && (
        <Box sx={styles.row}>
          <Typography variant="bodyMedium">Last run:</Typography>
          <Typography variant="bodyMedium">{formattedLastRun}</Typography>
        </Box>
      )}
      {formattedNextRun && (
        <Box sx={styles.row}>
          <Typography variant="bodyMedium">Next run:</Typography>
          <Typography variant="bodyMedium">{formattedNextRun}</Typography>
        </Box>
      )}
    </Box>
  );
});

ScheduleInfoDisplay.displayName = 'ScheduleInfoDisplay';

/** @type {MuiSx} */
const scheduleInfoDisplayStyles = () => ({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
  },
});

export default ScheduleInfoDisplay;

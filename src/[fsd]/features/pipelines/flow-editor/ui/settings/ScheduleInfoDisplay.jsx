import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';

const ScheduleInfoDisplay = memo(props => {
  const { cron, timezone, lastRun, sx } = props;

  const styles = scheduleInfoDisplayStyles();

  const timezoneLabel = useMemo(() => {
    if (!timezone) return null;
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone === browserTz) return timezone;
      return `${browserTz} (local)`;
    } catch {
      return timezone;
    }
  }, [timezone]);

  const formattedLastRun = useMemo(() => {
    if (!lastRun) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(lastRun));
  }, [lastRun]);

  const formattedNextRun = useMemo(() => {
    if (!cron) return null;
    const nextRun = ScheduleHelpers.getNextCronRunInTimezone(cron, timezone);
    if (!nextRun) return '-';
    return new Intl.DateTimeFormat(undefined, {
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
      {timezoneLabel && (
        <Box sx={styles.row}>
          <Typography variant="bodyMedium">Timezone:</Typography>
          <Typography variant="bodyMedium">{timezoneLabel}</Typography>
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

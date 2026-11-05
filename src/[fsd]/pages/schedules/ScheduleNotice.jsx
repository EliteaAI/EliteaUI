import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Container, Link } from '@mui/material';

import { TRIGGER_KIND, getListRoute } from '@/[fsd]/entities/schedule';

// The Page404 layout, with the way back to the Schedules or Webhooks list instead of Home
const ScheduleNotice = memo(({ message, kind = TRIGGER_KIND.cron }) => {
  const styles = scheduleNoticeStyles();

  return (
    <Container sx={styles.notice}>
      {message} Open{' '}
      <Link
        component={RouterLink}
        to={getListRoute(kind)}
        color="primary"
      >
        {kind === TRIGGER_KIND.webhook ? 'Webhooks' : 'Schedules'}
      </Link>
    </Container>
  );
});

ScheduleNotice.displayName = 'ScheduleNotice';

export default ScheduleNotice;

/** @type {MuiSx} */
const scheduleNoticeStyles = () => ({
  notice: { marginTop: '3.125rem', minHeight: 'calc(100vh - 11.9375rem)' },
});

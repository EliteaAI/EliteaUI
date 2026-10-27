import { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { Container, Link } from '@mui/material';

import RouteDefinitions from '@/routes';

// The Page404 layout, with the way back to the Schedules list instead of Home
const ScheduleNotice = memo(({ message }) => {
  const styles = scheduleNoticeStyles();

  return (
    <Container sx={styles.notice}>
      {message} Open{' '}
      <Link
        component={RouterLink}
        to={RouteDefinitions.Schedules}
        color="primary"
      >
        Schedules
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

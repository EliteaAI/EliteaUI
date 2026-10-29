import { memo } from 'react';

import { Link, Typography } from '@mui/material';

import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';

const LegacyScheduleNotice = memo(props => {
  const { cron, onOpenSchedules } = props;

  return (
    <BannerMessage variant="info">
      <Typography variant="bodySmall">
        This pipeline version has an old schedule{cron ? ` (${cron})` : ''} that is no longer editable here.
        Create a new one in the{' '}
        <Link
          component="button"
          className="nopan nodrag"
          type="button"
          variant="bodySmall"
          onClick={onOpenSchedules}
        >
          Schedules section
        </Link>
        .
      </Typography>
    </BannerMessage>
  );
});

LegacyScheduleNotice.displayName = 'LegacyScheduleNotice';

export default LegacyScheduleNotice;

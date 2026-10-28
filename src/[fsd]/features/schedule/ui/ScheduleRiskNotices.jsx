import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';

import { RISK_CHECK_STATUS } from '../lib/constants';
import ScheduleRiskBlockBox from './ScheduleRiskBlockBox';

const ScheduleRiskNotices = memo(
  ({ status, blocking, entityType, entityId, versionId, projectId, onRetry }) => {
    const styles = scheduleRiskNoticesStyles();

    return (
      <>
        {status === RISK_CHECK_STATUS.BLOCKED && (
          <ScheduleRiskBlockBox
            blocking={blocking}
            entityType={entityType}
            entityId={entityId}
            versionId={versionId}
            projectId={projectId}
          />
        )}
        {status === RISK_CHECK_STATUS.FAILED && (
          <BannerMessage variant="warning">
            <Box sx={styles.failed}>
              <Typography variant="bodySmall">The risk check did not run. Try again.</Typography>
              <BaseBtn
                type="button"
                variant="elitea"
                color="secondary"
                onClick={onRetry}
              >
                Retry
              </BaseBtn>
            </Box>
          </BannerMessage>
        )}
      </>
    );
  },
);

ScheduleRiskNotices.displayName = 'ScheduleRiskNotices';

/** @type {MuiSx} */
const scheduleRiskNoticesStyles = () => ({
  failed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flex: 1,
  },
});

export default ScheduleRiskNotices;

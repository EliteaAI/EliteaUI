import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import { TabBarItems } from '@/pages/Common/Components/StyledComponents';

import { RISK_CHECK_STATUS } from '../lib/constants';

const RISK_HINT_ID = 'schedule-risk-hint';

const ScheduleFormActions = memo(
  ({ riskStatus, saveDisabled, riskBlocksSave, onSave, onCancel, headerActions }) => {
    const styles = scheduleFormActionsStyles();

    return (
      <TabBarItems>
        {riskStatus === RISK_CHECK_STATUS.CHECKING && (
          <Box sx={styles.riskStatus}>
            <CircularProgress size="1rem" />
            <Typography variant="labelMedium">Checking risks</Typography>
          </Box>
        )}
        {riskStatus === RISK_CHECK_STATUS.BLOCKED && (
          <Box
            id={RISK_HINT_ID}
            sx={styles.riskStatus}
          >
            <Box
              component={AttentionIcon}
              aria-hidden
              sx={styles.riskIcon}
            />
            <Typography variant="labelMedium">Fix the risk check to save</Typography>
          </Box>
        )}
        <BaseBtn
          data-testid="schedule-save-button"
          variant="elitea"
          color="primary"
          disabled={saveDisabled}
          aria-disabled={riskBlocksSave || undefined}
          aria-describedby={riskStatus === RISK_CHECK_STATUS.BLOCKED ? RISK_HINT_ID : undefined}
          onClick={onSave}
        >
          Save
        </BaseBtn>
        <BaseBtn
          data-testid="schedule-cancel-button"
          variant="elitea"
          color="secondary"
          onClick={onCancel}
        >
          Cancel
        </BaseBtn>
        {headerActions}
      </TabBarItems>
    );
  },
);

ScheduleFormActions.displayName = 'ScheduleFormActions';

/** @type {MuiSx} */
const scheduleFormActionsStyles = () => ({
  riskStatus: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  riskIcon: { width: '1rem', height: '1rem' },
});

export default ScheduleFormActions;

import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import {
  useGetSchedulePreferencesQuery,
  useUpdateSchedulePreferencesMutation,
} from '@/[fsd]/features/settings/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox } from '@/[fsd]/shared/ui';

const ScheduleNotificationsSection = memo(() => {
  const styles = scheduleNotificationsSectionStyles();

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { data, isError } = useGetSchedulePreferencesQuery({ projectId }, { skip: !projectId });
  const [updatePreferences] = useUpdateSchedulePreferencesMutation();

  // The API slice rolls the checkbox back on failure; here we only report it
  const handleChange = useCallback(
    async event => {
      try {
        await updatePreferences({ projectId, getNotified: event.target.checked }).unwrap();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the notification setting');
      }
    },
    [projectId, updatePreferences, toastError],
  );

  return (
    <Box sx={styles.root}>
      <FormControlLabel
        label={
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Get notified
          </Typography>
        }
        control={
          <Checkbox.BaseCheckbox
            checked={data?.get_notified ?? false}
            onChange={handleChange}
            disabled={isError || !data}
            slotProps={{ input: { 'aria-describedby': 'schedule-notifications-help' } }}
            data-testid="schedule-get-notified-checkbox"
          />
        }
      />
      <Typography
        id="schedule-notifications-help"
        variant="bodySmall"
        color={isError ? 'error' : 'text.metrics'}
      >
        {isError
          ? 'Could not load the setting'
          : 'Failures, approvals and other schedule events always notify the owner.'}
      </Typography>
    </Box>
  );
});

ScheduleNotificationsSection.displayName = 'ScheduleNotificationsSection';
export default ScheduleNotificationsSection;

/** @type {MuiSx} */
const scheduleNotificationsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

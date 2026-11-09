import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { useGetScheduleSettingsQuery, useUpdateScheduleSettingsMutation } from '@/[fsd]/entities/schedule';
import { WebhookConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const RunWithoutAskingSetting = memo(() => {
  const styles = runWithoutAskingSettingStyles();

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const isAdmin = checkPermission(PERMISSIONS.schedules.admin);
  const { data, isError } = useGetScheduleSettingsQuery({ projectId }, { skip: !projectId });
  const [updateSettings, { isLoading: isSaving }] = useUpdateScheduleSettingsMutation();

  // The API slice rolls the checkbox back on failure; here we only report it
  const handleChange = useCallback(
    async event => {
      try {
        await updateSettings({ projectId, allowRunWithoutAsking: event.target.checked }).unwrap();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the Run without asking setting');
      }
    },
    [projectId, updateSettings, toastError],
  );

  return (
    <Box sx={styles.root}>
      <FormControlLabel
        label={
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Run without approval
          </Typography>
        }
        control={
          <Checkbox.BaseCheckbox
            checked={data?.allow_run_without_asking ?? false}
            onChange={handleChange}
            disabled={!isAdmin || isError || !data || isSaving}
            slotProps={{ input: { 'aria-describedby': 'schedule-run-without-asking-help' } }}
            data-testid="schedule-allow-run-without-asking-checkbox"
          />
        }
      />
      <Typography
        id="schedule-run-without-asking-help"
        variant="bodySmall"
        color={isError ? 'error' : 'text.metrics'}
      >
        {isError
          ? 'Could not load the setting'
          : `If checked, ELITEA will run sensitive actions of schedules and webhooks without asking the owner to approve them. ${WebhookConstants.RUN_WITHOUT_ASKING_SECRET_WARNING} Only a project administrator can change this setting.`}
      </Typography>
    </Box>
  );
});

RunWithoutAskingSetting.displayName = 'RunWithoutAskingSetting';
export default RunWithoutAskingSetting;

/** @type {MuiSx} */
const runWithoutAskingSettingStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

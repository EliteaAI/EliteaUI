import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { useGetScheduleSettingsQuery, useUpdateScheduleSettingsMutation } from '@/[fsd]/entities/schedule';
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
            Allow Run without asking
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
      <Box
        id="schedule-run-without-asking-help"
        sx={styles.help}
      >
        <Typography
          variant="bodySmall"
          color={isError ? 'error' : 'text.metrics'}
        >
          {isError
            ? 'Could not load the setting'
            : 'Scheduled runs with this rule approve sensitive actions by themselves.'}
        </Typography>
        {!isAdmin && (
          <Typography
            variant="bodySmall"
            color="text.metrics"
          >
            Only a project admin can change this setting.
          </Typography>
        )}
      </Box>
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
  help: {
    display: 'flex',
    flexDirection: 'column',
  },
});

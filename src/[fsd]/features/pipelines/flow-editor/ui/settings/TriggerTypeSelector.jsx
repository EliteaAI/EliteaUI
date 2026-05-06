import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { InfoLabelWithTooltip } from '@/[fsd]/shared/ui/label';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useGetPipelineTriggerQuery, useUpdatePipelineTriggerMutation } from '@/api/applications';
import ClockIcon from '@/assets/clock.svg?react';
import { useSelectedProject } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import PipelineScheduleModal from './PipelineScheduleModal';

// Trigger types
export const TRIGGER_TYPES = {
  chat_message: 'chat_message',
  schedule: 'schedule',
};

const TRIGGER_OPTIONS = [
  { label: 'Chat Message', value: TRIGGER_TYPES.chat_message },
  { label: 'Schedule', value: TRIGGER_TYPES.schedule },
];

const TriggerTypeSelector = memo(props => {
  const { disabled } = props;

  const styles = triggerTypeSelectorStyles();
  const { toastSuccess, toastError } = useToast();
  const selectedProject = useSelectedProject();
  const { values } = useFormikContext();

  const versionId = values?.version_details?.id;
  const projectId = selectedProject?.id;

  // State for schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Fetch current trigger configuration
  const { data: triggerData, isLoading: isFetching } = useGetPipelineTriggerQuery(
    { projectId, versionId },
    { skip: !projectId || !versionId },
  );

  const [updateTrigger, { isLoading: isUpdating }] = useUpdatePipelineTriggerMutation();

  const currentTriggerType = useMemo(
    () => triggerData?.type || TRIGGER_TYPES.chat_message,
    [triggerData?.type],
  );

  const currentCron = useMemo(() => triggerData?.cron || '0 0 * * 6', [triggerData?.cron]);

  const handleTriggerTypeChange = useCallback(
    async newType => {
      if (newType === currentTriggerType) return;

      if (newType === TRIGGER_TYPES.schedule) {
        // Open modal to configure schedule
        setIsScheduleModalOpen(true);
      } else {
        // Switch to chat_message
        try {
          await updateTrigger({
            projectId,
            versionId,
            type: newType,
          }).unwrap();
          toastSuccess('Trigger updated to Chat Message');
        } catch (error) {
          toastError(error?.data?.error || 'Failed to update trigger');
        }
      }
    },
    [currentTriggerType, projectId, versionId, updateTrigger, toastSuccess, toastError],
  );

  const handleScheduleSubmit = useCallback(
    async cronExpression => {
      try {
        // Get user's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await updateTrigger({
          projectId,
          versionId,
          type: TRIGGER_TYPES.schedule,
          cron: cronExpression,
          timezone,
        }).unwrap();
        toastSuccess('Schedule configured successfully');
      } catch (error) {
        toastError(error?.data?.error || 'Failed to configure schedule');
      }
    },
    [projectId, versionId, updateTrigger, toastSuccess, toastError],
  );

  const handleScheduleIconClick = useCallback(() => {
    if (currentTriggerType === TRIGGER_TYPES.schedule) {
      setIsScheduleModalOpen(true);
    }
  }, [currentTriggerType]);

  const isLoading = isFetching || isUpdating;

  const triggerTooltip =
    'Choose how this pipeline is triggered.\n* Chat Message (default) requires user input.\n* Schedule runs automatically based on a cron expression (input text is ignored, only static data can be used for schedule, i.e. variable/f-string with default values or fixed).';

  return (
    <Box sx={styles.container}>
      <InfoLabelWithTooltip
        label="Trigger"
        tooltip={triggerTooltip}
        variant="labelSmall"
        sx={styles.labelWrapper}
        iconSize={14}
      />

      <Box sx={styles.selectWrapper}>
        <SingleSelect
          sx={styles.select}
          value={currentTriggerType}
          onValueChange={handleTriggerTypeChange}
          options={TRIGGER_OPTIONS}
          disabled={disabled || isLoading}
          showBorder
          className="nopan nodrag"
        />

        {currentTriggerType === TRIGGER_TYPES.schedule && (
          <Tooltip
            title="Edit schedule"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              sx={styles.scheduleButton}
              onClick={handleScheduleIconClick}
              disabled={disabled || isLoading}
            >
              <ClockIcon style={styles.iconStyle} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <PipelineScheduleModal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSubmit={handleScheduleSubmit}
        cron={currentCron}
        isLoading={isUpdating}
      />
    </Box>
  );
});

TriggerTypeSelector.displayName = 'TriggerTypeSelector';

/** @type {MuiSx} */
const triggerTypeSelectorStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    padding: '0.5rem 1rem',
    boxSizing: 'border-box',
  },
  labelWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  select: {
    flex: 1,
    marginBottom: '0',
  },
  scheduleButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.icon.fill.secondary,
    '&:hover': {
      color: palette.primary.main,
    },
  }),
  iconStyle: {
    width: '1rem',
    height: '1rem',
  },
});

export default TriggerTypeSelector;

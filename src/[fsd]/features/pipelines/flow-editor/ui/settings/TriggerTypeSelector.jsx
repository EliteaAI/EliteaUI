import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';

import LinkIcon from '@mui/icons-material/Link';
import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { InfoLabelWithTooltip } from '@/[fsd]/shared/ui/label';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useGetPipelineTriggerQuery, useUpdatePipelineTriggerMutation } from '@/api/applications';
import ClockIcon from '@/assets/clock.svg?react';
import { useSelectedProject } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import PipelineScheduleModal from './PipelineScheduleModal';
import PipelineWebhookModal from './PipelineWebhookModal';

// Node types that require user interaction and thus only support Chat Message trigger
const INTERACTIVE_NODE_TYPES = [PipelineNodeTypes.Hitl, PipelineNodeTypes.Printer];

// Trigger types
export const TRIGGER_TYPES = {
  chat_message: 'chat_message',
  schedule: 'schedule',
  webhook: 'webhook',
};

// Webhook types
export const WEBHOOK_TYPES = {
  github: 'github',
  gitlab: 'gitlab',
  custom: 'custom',
};

const TRIGGER_OPTIONS = [
  { label: 'Chat Message', value: TRIGGER_TYPES.chat_message },
  { label: 'Schedule', value: TRIGGER_TYPES.schedule },
  { label: 'Webhook', value: TRIGGER_TYPES.webhook },
];

const TriggerTypeSelector = memo(props => {
  const { disabled } = props;

  const styles = triggerTypeSelectorStyles();
  const { toastSuccess, toastError } = useToast();
  const selectedProject = useSelectedProject();
  const { values } = useFormikContext();

  const versionId = values?.version_details?.id;
  const projectId = selectedProject?.id;
  const versionInstructions = values?.version_details?.instructions;

  // Check if the saved version content has nodes/interrupts that require Chat Message trigger.
  // We parse `version_details.instructions` (the saved YAML for this exact versionId) instead of
  // the editor's working copy so the restriction tracks the version we're configuring the trigger
  // for, not whatever pipeline is loaded in the flow editor or the user's unsaved edits.
  const hasInteractiveElements = useMemo(() => {
    if (!versionInstructions) return false;

    let parsed;
    try {
      parsed = YAML.load(versionInstructions);
    } catch {
      return false;
    }
    if (!parsed) return false;

    const hasInteractiveNodes =
      Array.isArray(parsed.nodes) && parsed.nodes.some(node => INTERACTIVE_NODE_TYPES.includes(node?.type));

    const hasInterrupts =
      (Array.isArray(parsed.interrupt_before) && parsed.interrupt_before.length > 0) ||
      (Array.isArray(parsed.interrupt_after) && parsed.interrupt_after.length > 0);

    return hasInteractiveNodes || hasInterrupts;
  }, [versionInstructions]);

  // Filter trigger options based on pipeline content
  const availableTriggerOptions = useMemo(() => {
    if (hasInteractiveElements) {
      return TRIGGER_OPTIONS.filter(opt => opt.value === TRIGGER_TYPES.chat_message);
    }
    return TRIGGER_OPTIONS;
  }, [hasInteractiveElements]);

  // State for schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // State for webhook modal
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

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

  // Track previous hasInteractiveElements to detect when it changes from false to true
  const prevHasInteractiveRef = useRef(hasInteractiveElements);

  // Auto-reset to Chat Message when interactive elements are added to a pipeline with incompatible trigger
  useEffect(() => {
    const wasNotInteractive = !prevHasInteractiveRef.current;
    const isNowInteractive = hasInteractiveElements;
    const hasIncompatibleTrigger =
      currentTriggerType === TRIGGER_TYPES.schedule || currentTriggerType === TRIGGER_TYPES.webhook;

    // Only reset if: became interactive AND has incompatible trigger AND we can make the API call
    if (wasNotInteractive && isNowInteractive && hasIncompatibleTrigger && projectId && versionId) {
      updateTrigger({
        projectId,
        versionId,
        type: TRIGGER_TYPES.chat_message,
      })
        .unwrap()
        .then(() => {
          toastSuccess('Trigger reset to Chat Message (pipeline now contains interactive elements)');
        })
        .catch(() => {
          toastError('Failed to reset trigger');
        });
    }

    prevHasInteractiveRef.current = hasInteractiveElements;
  }, [
    hasInteractiveElements,
    currentTriggerType,
    projectId,
    versionId,
    updateTrigger,
    toastSuccess,
    toastError,
  ]);

  const currentCron = useMemo(() => triggerData?.cron || '0 0 * * 6', [triggerData?.cron]);

  const currentWebhookType = useMemo(
    () => triggerData?.webhook_type || WEBHOOK_TYPES.github,
    [triggerData?.webhook_type],
  );

  const webhookUrl = useMemo(() => triggerData?.webhook_url || '', [triggerData?.webhook_url]);

  const handleTriggerTypeChange = useCallback(
    async newType => {
      if (newType === currentTriggerType) return;

      if (newType === TRIGGER_TYPES.schedule) {
        // Open modal to configure schedule
        setIsScheduleModalOpen(true);
      } else if (newType === TRIGGER_TYPES.webhook) {
        // Save webhook trigger first to generate secret, then open modal
        try {
          await updateTrigger({
            projectId,
            versionId,
            type: TRIGGER_TYPES.webhook,
            webhook_type: currentWebhookType,
          }).unwrap();
          setIsWebhookModalOpen(true);
        } catch (error) {
          toastError(error?.data?.error || 'Failed to configure webhook');
        }
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
    [currentTriggerType, currentWebhookType, projectId, versionId, updateTrigger, toastSuccess, toastError],
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

  const handleWebhookIconClick = useCallback(async () => {
    if (currentTriggerType === TRIGGER_TYPES.webhook) {
      // Ensure webhook is saved (generates secret if not exists) before opening modal
      if (!triggerData?.secret_value) {
        try {
          await updateTrigger({
            projectId,
            versionId,
            type: TRIGGER_TYPES.webhook,
            webhook_type: currentWebhookType,
          }).unwrap();
        } catch (error) {
          toastError(error?.data?.error || 'Failed to load webhook settings');
          return;
        }
      }
      setIsWebhookModalOpen(true);
    }
  }, [
    currentTriggerType,
    currentWebhookType,
    triggerData?.secret_value,
    projectId,
    versionId,
    updateTrigger,
    toastError,
  ]);

  const handleWebhookSubmit = useCallback(
    async (webhookType, newSecretValue) => {
      try {
        // Build request with optional new secret
        const requestData = {
          projectId,
          versionId,
          type: TRIGGER_TYPES.webhook,
          webhook_type: webhookType,
        };

        // If user regenerated the secret, include it in the request
        if (newSecretValue) {
          requestData.webhook_secret_value = newSecretValue;
        }

        await updateTrigger(requestData).unwrap();
        toastSuccess(
          newSecretValue ? 'Webhook configured with new secret' : 'Webhook configured successfully',
        );
      } catch (error) {
        toastError(error?.data?.error || 'Failed to configure webhook');
      }
    },
    [projectId, versionId, updateTrigger, toastSuccess, toastError],
  );

  const isLoading = isFetching || isUpdating;

  const triggerTooltip = useMemo(() => {
    const baseTooltip =
      'Choose how this pipeline is triggered.\n• Chat Message (default) requires user input.\n• Schedule runs automatically based on a cron expression.\n• Webhook allows external systems to trigger the pipeline via HTTP POST.';

    if (hasInteractiveElements) {
      return `${baseTooltip}\n\nNote: This pipeline contains HITL, Printer nodes, or interrupts that require user interaction. Only Chat Message trigger is available.`;
    }
    return baseTooltip;
  }, [hasInteractiveElements]);

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
          options={availableTriggerOptions}
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

        {currentTriggerType === TRIGGER_TYPES.webhook && (
          <Tooltip
            title="Edit webhook settings"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              sx={styles.scheduleButton}
              onClick={handleWebhookIconClick}
              disabled={disabled || isLoading}
            >
              <LinkIcon sx={styles.iconStyle} />
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

      <PipelineWebhookModal
        open={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onSubmit={handleWebhookSubmit}
        webhookType={currentWebhookType}
        webhookUrl={webhookUrl}
        secretValue={triggerData?.secret_value}
        secretHeader={triggerData?.secret_header}
        secretInstructions={triggerData?.secret_instructions}
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

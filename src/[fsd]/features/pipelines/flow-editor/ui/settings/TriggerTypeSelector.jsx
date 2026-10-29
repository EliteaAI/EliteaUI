import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';

import LinkIcon from '@mui/icons-material/Link';
import { Box, IconButton, Link, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import {
  FlowEditorConstants,
  NodeFieldInfoConstants,
  WebhookConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { LegacyScheduleNotice } from '@/[fsd]/features/schedule';
import { useDelegatedOauthToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ModalConstants, ScheduleSectionConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProject, useToast } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { InfoLabelWithTooltip } from '@/[fsd]/shared/ui/label';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useGetPipelineTriggerQuery, useUpdatePipelineTriggerMutation } from '@/api/applications';

import PipelineWebhookModal from './PipelineWebhookModal';

const { PipelineNodeTypes } = FlowEditorConstants;
const { GITLAB_AUTH_METHODS, TRIGGER_TYPES, WEBHOOK_TYPES } = WebhookConstants;
const { SCHEDULES_SECTION_ID } = ScheduleSectionConstants;

// Node types that require user interaction and thus only support Chat Message trigger
const INTERACTIVE_NODE_TYPES = [PipelineNodeTypes.Hitl, PipelineNodeTypes.Printer];

const TRIGGER_OPTIONS = [
  { label: 'Chat Message', value: TRIGGER_TYPES.chat_message },
  { label: 'Webhook', value: TRIGGER_TYPES.webhook },
];

const TriggerTypeSelector = memo(props => {
  const { disabled } = props;

  const styles = triggerTypeSelectorStyles();
  const { toastSuccess, toastError, toastWarning } = useToast();
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

  // Toolkits authenticated by a per-user OAuth login only hold a token for the browser session of the
  // person who logged in, so a pipeline using them cannot run unattended on a schedule or webhook.
  const { delegatedOauthToolkitNames, hasDelegatedOauthToolkit, isResolvingCredentials } =
    useDelegatedOauthToolkits(values?.version_details?.tools, projectId);

  const restrictedToChatMessage = hasInteractiveElements || hasDelegatedOauthToolkit;

  // State for webhook modal
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [pendingTriggerType, setPendingTriggerType] = useState(null);

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

  // Schedule is no longer selectable. A version that still stores one shows it as a disabled option; the user can switch away.
  const isLegacySchedule = currentTriggerType === TRIGGER_TYPES.schedule;

  // Unattended triggers stay visible but greyed out so the restriction is discoverable; the Trigger
  // label tooltip explains why.
  const availableTriggerOptions = useMemo(() => {
    const options = restrictedToChatMessage
      ? TRIGGER_OPTIONS.map(opt =>
          opt.value === TRIGGER_TYPES.chat_message ? opt : { ...opt, disabled: true },
        )
      : TRIGGER_OPTIONS;
    return isLegacySchedule
      ? [...options, { label: 'Schedule', value: TRIGGER_TYPES.schedule, disabled: true }]
      : options;
  }, [restrictedToChatMessage, isLegacySchedule]);

  // Previous restriction state, used to detect a change from false to true. Stays `null` until the
  // credentials behind it have resolved: those queries settle after mount, so the pre-resolution `false`
  // is not a real state and treating it as one would reset a trigger the user never touched.
  const prevRestrictedRef = useRef(null);

  // Auto-reset to Chat Message when the pipeline becomes incompatible with its configured trigger
  useEffect(() => {
    if (isResolvingCredentials) return;

    const wasNotRestricted = prevRestrictedRef.current === false;
    const hasIncompatibleTrigger = currentTriggerType === TRIGGER_TYPES.webhook;

    // Only reset if: became restricted AND has incompatible trigger AND we can make the API call
    if (wasNotRestricted && restrictedToChatMessage && hasIncompatibleTrigger && projectId && versionId) {
      updateTrigger({
        projectId,
        versionId,
        type: TRIGGER_TYPES.chat_message,
      })
        .unwrap()
        .then(() => {
          const reason = hasInteractiveElements
            ? 'pipeline now contains interactive elements'
            : 'pipeline now contains a toolkit that requires user authorization';
          toastSuccess(`Trigger reset to Chat Message (${reason})`);
        })
        .catch(() => {
          toastError('Failed to reset trigger');
        });
    }

    prevRestrictedRef.current = restrictedToChatMessage;
  }, [
    isResolvingCredentials,
    restrictedToChatMessage,
    hasInteractiveElements,
    currentTriggerType,
    projectId,
    versionId,
    updateTrigger,
    toastSuccess,
    toastError,
  ]);

  const currentWebhookType = useMemo(
    () => triggerData?.webhook_type || WEBHOOK_TYPES.github,
    [triggerData?.webhook_type],
  );

  const webhookUrl = useMemo(() => triggerData?.webhook_url || '', [triggerData?.webhook_url]);

  // Triggers saved before signing tokens existed carry no method, and those are secret-token ones.
  const currentGitlabAuthMethod = useMemo(
    () => triggerData?.gitlab_auth_method || GITLAB_AUTH_METHODS.secret_token,
    [triggerData?.gitlab_auth_method],
  );

  const isGitlabSigningMode =
    currentWebhookType === WEBHOOK_TYPES.gitlab &&
    currentGitlabAuthMethod === GITLAB_AUTH_METHODS.signing_token;

  // Saving a gitlab trigger without the method would fall back to the server-side default and
  // silently downgrade a signing-token trigger to a replayable secret token.
  const buildWebhookSaveArgs = useCallback(() => {
    const args = {
      projectId,
      versionId,
      type: TRIGGER_TYPES.webhook,
      webhook_type: currentWebhookType,
    };
    if (currentWebhookType === WEBHOOK_TYPES.gitlab) {
      args.gitlab_auth_method = currentGitlabAuthMethod;
    }
    return args;
  }, [projectId, versionId, currentWebhookType, currentGitlabAuthMethod]);

  const switchTrigger = useCallback(
    async newType => {
      if (newType === TRIGGER_TYPES.webhook) {
        // Save webhook trigger first to generate secret, then open modal
        try {
          await updateTrigger(buildWebhookSaveArgs()).unwrap();
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
    [buildWebhookSaveArgs, projectId, versionId, updateTrigger, toastSuccess, toastError],
  );

  // Under credential governance an unattended trigger runs only a bound version with a mandate; the backend
  // keeps the trigger and says so when this version is not bound yet. The toast provider shows one toast at
  // a time, so the warning takes the place of the success message instead of replacing it a tick later.
  const notifySaved = useCallback(
    (result, successMessage) => {
      if (result?.governance_notice) {
        toastWarning(result.governance_notice);
      } else {
        toastSuccess(successMessage);
      }
    },
    [toastSuccess, toastWarning],
  );

  // Replacing a stored schedule deletes it, so the user confirms first
  const handleTriggerTypeChange = useCallback(
    newType => {
      if (newType === currentTriggerType) return;
      if (isLegacySchedule) {
        setPendingTriggerType(newType);
        return;
      }
      switchTrigger(newType);
    },
    [currentTriggerType, isLegacySchedule, switchTrigger],
  );

  const handleCancelReplace = useCallback(() => setPendingTriggerType(null), []);

  const handleConfirmReplace = useCallback(() => {
    const newType = pendingTriggerType;
    setPendingTriggerType(null);
    switchTrigger(newType);
  }, [pendingTriggerType, switchTrigger]);

  const handleWebhookIconClick = useCallback(async () => {
    if (currentTriggerType === TRIGGER_TYPES.webhook) {
      // Ensure webhook is saved (generates secret if not exists) before opening modal.
      // A signing token is issued by GitLab and pasted in by the user, so there is nothing to
      // pre-generate — opening the modal is what lets them paste one.
      if (!triggerData?.secret_value && !isGitlabSigningMode) {
        try {
          await updateTrigger(buildWebhookSaveArgs()).unwrap();
        } catch (error) {
          toastError(error?.data?.error || 'Failed to load webhook settings');
          return;
        }
      }
      setIsWebhookModalOpen(true);
    }
  }, [
    currentTriggerType,
    isGitlabSigningMode,
    buildWebhookSaveArgs,
    triggerData?.secret_value,
    updateTrigger,
    toastError,
  ]);

  const handleWebhookSubmit = useCallback(
    async ({ webhookType, secretValue, gitlabAuthMethod, signingTokenValue }) => {
      try {
        const requestData = {
          projectId,
          versionId,
          type: TRIGGER_TYPES.webhook,
          webhook_type: webhookType,
        };

        if (webhookType === WEBHOOK_TYPES.gitlab) {
          requestData.gitlab_auth_method = gitlabAuthMethod || GITLAB_AUTH_METHODS.secret_token;
        }

        // The two GitLab methods are stored under separate keys so switching between them does
        // not overwrite the other one's secret.
        if (signingTokenValue) {
          requestData.webhook_signing_secret_value = signingTokenValue;
        } else if (secretValue) {
          requestData.webhook_secret_value = secretValue;
        }

        const result = await updateTrigger(requestData).unwrap();

        let successMessage = 'Webhook configured successfully';
        if (signingTokenValue) {
          successMessage = 'Webhook configured with the GitLab signing token';
        } else if (secretValue) {
          successMessage = 'Webhook configured with new secret';
        }
        notifySaved(result, successMessage);
      } catch (error) {
        toastError(error?.data?.error || 'Failed to configure webhook');
      }
    },
    [projectId, versionId, updateTrigger, toastError, notifySaved],
  );

  const isLoading = isFetching || isUpdating;

  const scrollToSchedules = useCallback(() => {
    document.getElementById(SCHEDULES_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const triggerTooltip = useMemo(() => {
    const baseTooltip =
      NodeFieldInfoConstants.COMMON_NODE_FIELD_INFO[NodeFieldInfoConstants.NODE_FIELD_KEYS.trigger];

    if (hasInteractiveElements) {
      return `${baseTooltip}\n\nNote: This pipeline contains HITL, Printer nodes, or interrupts that require user interaction. Only Chat Message trigger is available.`;
    }
    if (hasDelegatedOauthToolkit) {
      return `${baseTooltip}\n\nNote: ${delegatedOauthToolkitNames.join(', ')} ${
        delegatedOauthToolkitNames.length > 1 ? 'require' : 'requires'
      } an interactive user login, which is not possible in unattended runs. Only Chat Message trigger is available.`;
    }
    return baseTooltip;
  }, [hasInteractiveElements, hasDelegatedOauthToolkit, delegatedOauthToolkitNames]);

  return (
    <Box sx={styles.container}>
      <InfoLabelWithTooltip
        label="Trigger"
        tooltip={triggerTooltip}
        pinnable
        variant="labelSmall"
        sx={styles.labelWrapper}
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
          data-testid="pipeline-entry-point-trigger-select"
        />

        {currentTriggerType === TRIGGER_TYPES.webhook && (
          <Tooltip
            title="Edit webhook settings"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              sx={styles.webhookButton}
              onClick={handleWebhookIconClick}
              disabled={disabled || isLoading}
            >
              <LinkIcon sx={styles.iconStyle} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <BannerMessage
        variant="info"
        containerSx={styles.hint}
      >
        <Typography variant="bodySmall">
          To run this pipeline on a timer, use the{' '}
          <Link
            component="button"
            className="nopan nodrag"
            type="button"
            variant="bodySmall"
            onClick={scrollToSchedules}
          >
            Schedules section
          </Link>
          .
        </Typography>
      </BannerMessage>

      {isLegacySchedule && (
        <LegacyScheduleNotice
          cron={triggerData?.cron}
          onOpenSchedules={scrollToSchedules}
        />
      )}

      <Modal.BaseModal
        open={Boolean(pendingTriggerType)}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Replace schedule"
        content="The old schedule of this version will be deleted and replaced by the new trigger. Continue?"
        onClose={handleCancelReplace}
        onConfirm={handleConfirmReplace}
        confirmButtonText="Replace"
        data-testid="replace-dialog"
        confirmButtonTestId="replace-dialog-confirm"
        cancelButtonTestId="replace-dialog-cancel"
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
        gitlabAuthMethod={currentGitlabAuthMethod}
        secretConfigured={triggerData?.secret_configured}
        signingSecretConfigured={triggerData?.signing_secret_configured}
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
    boxSizing: 'border-box',
  },
  // Lines the label up with the labels of the other panel fields
  labelWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingLeft: '0.75rem',
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
  webhookButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.icon.secondary,
    '&:hover': {
      color: palette.primary.main,
    },
  }),
  hint: {
    marginTop: '0.25rem',
  },
  iconStyle: {
    width: '1rem',
    height: '1rem',
  },
});

export default TriggerTypeSelector;

import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { ConfigurationModal } from '@/[fsd]/features/agent/ui/agent-details/configurations/index.js';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';
import { useForkedFromApplicationDetailsQuery, useGetPipelineTriggerQuery } from '@/api/applications';
import { buildForkedEntityHref, capitalizeFirstChar } from '@/common/utils.jsx';
import { LabelLinkWithToolTip } from '@/components/Fork/LabelLinkWithToolTip.jsx';
import { useSelectedProject } from '@/hooks/useSelectedProject';

const TRIGGER_TYPE_LABELS = {
  chat_message: 'Chat Message',
  schedule: 'Schedule',
  webhook: 'Webhook',
};

const WEBHOOK_TYPE_LABELS = {
  github: 'GitHub',
  gitlab: 'GitLab',
  custom: 'Custom',
};

const ApplicationInformation = memo(props => {
  const { style, showPipeline = false } = props;
  const {
    values: { id, version_details },
  } = useFormikContext();

  const versionId = version_details?.id;
  const pipelineInstructions = version_details?.instructions || '';
  const styles = useMemo(() => applicationInformationStyles(), []);

  const { is_forked: isForked, meta } = useMemo(
    () =>
      version_details || {
        is_forked: false,
        meta: { parent_project_id: null, parent_entity_id: null },
      },
    [version_details],
  );

  const entityType = version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent';
  const agentType = `${entityType}s`;
  const entityTitle = capitalizeFirstChar(entityType);
  const isPipeline = entityType === 'pipeline';

  const selectedProject = useSelectedProject();
  const projectId = selectedProject?.id;

  const { data: originalApplicationDetails, error } = useForkedFromApplicationDetailsQuery(
    { projectId: meta?.parent_project_id, applicationId: meta?.parent_entity_id },
    { skip: !meta?.parent_project_id || !meta?.parent_entity_id || !isForked },
  );

  const { data: triggerData } = useGetPipelineTriggerQuery(
    { projectId, versionId },
    { skip: !isPipeline || !projectId || !versionId },
  );

  const [showPipelineModal, setShowPipelineModal] = useState(false);

  const onShowPipelineModal = useCallback(() => {
    setShowPipelineModal(true);
  }, []);

  const onClosePipelineModal = useCallback(() => {
    setShowPipelineModal(false);
  }, []);

  const accordionItems = useMemo(
    () => [
      {
        title: 'Information',
        content: (
          <Box sx={styles.contentContainer}>
            <CopyToClipboardButton
              label={`${entityTitle} ID:`}
              value={id}
              tooltip="Copy ID"
              copyMessage="The ID has been copied to the clipboard"
              data-testid="copy-id"
            />
            {versionId !== undefined && (
              <CopyToClipboardButton
                label="Version ID:"
                value={versionId}
                tooltip="Copy version ID"
                copyMessage="The version ID has been copied to the clipboard"
              />
            )}
            {isPipeline && triggerData?.type && (
              <Box sx={styles.pipelineLink}>
                <Typography variant="bodyMedium">Trigger:</Typography>
                <Typography variant="bodyMedium">
                  {TRIGGER_TYPE_LABELS[triggerData.type] || triggerData.type}
                </Typography>
              </Box>
            )}
            {isPipeline && triggerData?.type === 'schedule' && triggerData?.cron && (
              <CopyToClipboardButton
                label="Schedule:"
                value={triggerData.cron}
                tooltip="Copy cron expression"
                copyMessage="The cron expression has been copied to the clipboard"
              />
            )}
            {isPipeline && triggerData?.type === 'schedule' && triggerData?.timezone && (
              <Box sx={styles.pipelineLink}>
                <Typography variant="bodyMedium">Timezone:</Typography>
                <Typography variant="bodyMedium">{triggerData.timezone}</Typography>
              </Box>
            )}
            {isPipeline && triggerData?.type === 'schedule' && triggerData?.last_run && (
              <Box sx={styles.pipelineLink}>
                <Typography variant="bodyMedium">Last run:</Typography>
                <Typography variant="bodyMedium">
                  {new Intl.DateTimeFormat(undefined, {
                    timeZone: triggerData.timezone || undefined,
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(triggerData.last_run))}
                </Typography>
              </Box>
            )}
            {isPipeline && triggerData?.type === 'webhook' && triggerData?.webhook_type && (
              <Box sx={styles.pipelineLink}>
                <Typography variant="bodyMedium">Webhook type:</Typography>
                <Typography variant="bodyMedium">
                  {WEBHOOK_TYPE_LABELS[triggerData.webhook_type] || triggerData.webhook_type}
                </Typography>
              </Box>
            )}
            {isForked && (
              <LabelLinkWithToolTip
                label="Forked from:"
                value={originalApplicationDetails?.name || 'Original agent'}
                tooltip={
                  error?.status !== 403
                    ? `Go to original ${entityType}`
                    : 'You do not have permission to see the original agent'
                }
                disabled={error?.status === 403}
                href={buildForkedEntityHref(agentType, meta)}
              />
            )}
            {showPipeline && (
              <Box sx={styles.pipelineLink}>
                <Typography variant="bodyMedium">Pipeline:</Typography>
                <Typography
                  sx={styles.showLink}
                  variant="bodyMedium"
                  onClick={onShowPipelineModal}
                >
                  Show
                </Typography>
              </Box>
            )}
          </Box>
        ),
      },
    ],
    [
      id,
      versionId,
      isForked,
      originalApplicationDetails?.name,
      error?.status,
      entityType,
      agentType,
      meta,
      showPipeline,
      isPipeline,
      triggerData?.type,
      triggerData?.cron,
      triggerData?.timezone,
      triggerData?.last_run,
      triggerData?.webhook_type,
      styles.contentContainer,
      styles.pipelineLink,
      styles.showLink,
      onShowPipelineModal,
      entityTitle,
    ],
  );

  return (
    <>
      <BasicAccordion
        data-testid="agent-information-section"
        style={style}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        accordionSX={styles.accordion}
        items={accordionItems}
      />
      {showPipeline && showPipelineModal && (
        <ConfigurationModal.StyledShowContextModal
          context={pipelineInstructions}
          open={showPipelineModal}
          onClose={onClosePipelineModal}
          contextLabel="Pipeline"
          renderContextAsMermaid
        />
      )}
    </>
  );
});

ApplicationInformation.displayName = 'ApplicationInformation';

/** @type {MuiSx} */
const applicationInformationStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
    paddingBottom: '1.5rem',
  },
  pipelineLink: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
  },
  showLink: ({ palette }) => ({
    cursor: 'pointer',
    color: palette.text.button.showMore,
  }),
});

export default ApplicationInformation;

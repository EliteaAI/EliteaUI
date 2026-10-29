import { memo, useCallback, useEffect, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { buildOwnerViewModeParams } from '@/[fsd]/entities/schedule';
import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import FailIcon from '@/assets/fail-icon.svg?react';
import SuccessIcon from '@/assets/success-icon.svg?react';
import { ChatParticipantType, SearchParams, sioEvents } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import RouteDefinitions from '@/routes';

import { findNoticeAgent } from '../../lib/helpers';

const STATUSES = {
  success: { label: 'Success', variant: 'info', Icon: SuccessIcon, iconColor: 'success' },
  failed: { label: 'Failed', variant: 'error', Icon: FailIcon, iconColor: 'error' },
};

const buildRunPath = ({ entity_id, conversation_id, isPipeline }) =>
  `${NavigationHelpers.buildRoute(isPipeline ? RouteDefinitions.PipelineRunHistory : RouteDefinitions.ApplicationsRunHistory, { tab: 'all', agentId: entity_id })}?${buildOwnerViewModeParams({ [SearchParams.HistoryRunId]: String(conversation_id) })}`;

/**
 * Shows the result of a scheduled run of an agent that is a participant of the open chat.
 */
const ScheduleRunNotice = memo(props => {
  const { conversationId, participants } = props;
  const projectId = useSelectedProjectId();
  const [event, setEvent] = useState(null);
  const styles = scheduleRunNoticeStyles();

  const handleFinished = useCallback(
    payload => {
      const agent = STATUSES[payload?.status] && findNoticeAgent(payload, participants, projectId);
      if (agent)
        setEvent({
          ...payload,
          isPipeline: agent.entity_settings?.agent_type === ChatParticipantType.Pipelines,
        });
    },
    [participants, projectId],
  );

  useSocket(sioEvents.schedule_run_finished, handleFinished);

  useEffect(() => {
    setEvent(null);
  }, [conversationId]);

  const handleClose = useCallback(() => setEvent(null), []);

  const status = STATUSES[event?.status];
  if (!status) return null;

  const { Icon, iconColor, label, variant } = status;

  return (
    <BannerMessage
      variant={variant}
      showIcon={false}
      containerSx={styles.container}
    >
      <Box
        component={Icon}
        sx={({ palette }) => ({ ...styles.icon, color: palette.icon[iconColor] })}
      />
      <Typography
        variant="bodySmall"
        role="status"
        data-testid="schedule-run-notice"
        sx={styles.text}
      >
        {label}
        {event.conversation_id != null && (
          <>
            {' '}
            <Link
              component={RouterLink}
              to={buildRunPath(event)}
              sx={styles.link}
            >
              Open run
            </Link>
          </>
        )}
      </Typography>
      <StyledTooltip
        title="Dismiss notice"
        placement="top"
      >
        <BaseBtn
          variant={BUTTON_VARIANTS.icon}
          aria-label="Dismiss notice"
          onClick={handleClose}
          sx={styles.closeButton}
        >
          <CloseIcon sx={styles.closeIcon} />
        </BaseBtn>
      </StyledTooltip>
    </BannerMessage>
  );
});

ScheduleRunNotice.displayName = 'ScheduleRunNotice';

/** @type {MuiSx} */
const scheduleRunNoticeStyles = () => ({
  container: { alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '0.5rem' },
  icon: { fontSize: '1rem', flexShrink: 0 },
  text: { flex: 1, color: 'inherit', wordBreak: 'break-word' },
  link: ({ palette }) => ({
    color: palette.components.button.text.create,
    textDecorationColor: palette.components.button.text.create,
  }),
  closeButton: { padding: 0, flexShrink: 0 },
  closeIcon: { fontSize: '1rem' },
});

export default ScheduleRunNotice;

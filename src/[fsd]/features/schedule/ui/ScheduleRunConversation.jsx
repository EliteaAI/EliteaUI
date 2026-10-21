import { memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { Box } from '@mui/material';

import { RunHistoryChat } from '@/[fsd]/entities/run-history/ui';
import { SCHEDULE_RUNS_TAG, scheduleApi } from '@/[fsd]/entities/schedule';
import { ChatMessageList } from '@/[fsd]/features/chat';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';

import { useWaitingRunDecision } from '../lib/hooks/useWaitingRunDecision.hooks';

// The conversation of one run, in the message list the Agents and Pipelines chat uses
const ScheduleRunConversation = memo(props => {
  const { run, schedule } = props;

  const dispatch = useDispatch();
  // A decided run changes status on the server, so the run list loads again
  const onDecided = useCallback(
    () => dispatch(scheduleApi.util.invalidateTags([SCHEDULE_RUNS_TAG])),
    [dispatch],
  );
  const onHitlResume = useWaitingRunDecision({ schedule, onDecided });

  const styles = scheduleRunConversationStyles();

  return (
    <Box
      data-testid="schedule-run-conversation"
      sx={styles.root}
    >
      {/* A new status remounts the chat, so a run that just ended shows its final messages (R4.4) */}
      {run.status === 'waiting_for_approval' && !onHitlResume && (
        <BannerMessage
          variant="info"
          message="Only the owner can approve or reject this run"
        />
      )}
      <Box sx={styles.chat}>
        <RunHistoryChat
          key={`${run.id}:${run.status}`}
          selectedHistoryItem={run.conversation_id}
          ChatMessageListComponent={ChatMessageList}
          onHitlResume={onHitlResume}
        />
      </Box>
    </Box>
  );
});

ScheduleRunConversation.displayName = 'ScheduleRunConversation';

/** @type {MuiSx} */
const scheduleRunConversationStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    height: '32rem',
    boxSizing: 'border-box',
  },
  chat: { display: 'flex', flex: 1, minHeight: 0 },
});

export default ScheduleRunConversation;

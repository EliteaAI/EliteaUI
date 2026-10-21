import { memo } from 'react';

import { Box } from '@mui/material';

import { RunHistoryChat } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';

// The conversation of one run, in the message list the Agents and Pipelines chat uses
const ScheduleRunConversation = memo(props => {
  const { run } = props;

  const styles = scheduleRunConversationStyles();

  return (
    <Box
      data-testid="schedule-run-conversation"
      sx={styles.root}
    >
      {/* A new status remounts the chat, so a run that just ended shows its final messages (R4.4) */}
      <RunHistoryChat
        key={`${run.id}:${run.status}`}
        selectedHistoryItem={run.conversation_id}
        ChatMessageListComponent={ChatMessageList}
      />
    </Box>
  );
});

ScheduleRunConversation.displayName = 'ScheduleRunConversation';

/** @type {MuiSx} */
const scheduleRunConversationStyles = () => ({
  root: { display: 'flex', width: '100%', height: '32rem', boxSizing: 'border-box' },
});

export default ScheduleRunConversation;

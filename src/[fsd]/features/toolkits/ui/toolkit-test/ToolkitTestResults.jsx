import { memo, useMemo, useRef } from 'react';

import { Box } from '@mui/material';

import { ChatMessageList } from '@/[fsd]/features/chat';
import { getMockToolkitIndexConversation } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { WELCOME_MESSAGE_ID } from '@/common/constants';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';

const ToolkitTestResults = memo(props => {
  const { chatHistory } = props;
  const styles = toolkitTestResultsStyles();
  const questionItemRef = useRef(null);

  const messages = useMemo(
    () => chatHistory.filter(message => message.id !== WELCOME_MESSAGE_ID),
    [chatHistory],
  );

  // The message list only scrolls to the bottom when the conversation identity changes, so the id
  // follows the message count to bring each new run into view.
  const conversation = useMemo(
    () => ({ ...getMockToolkitIndexConversation(messages), id: `toolkit-test-${messages.length}` }),
    [messages],
  );

  const onCopyToClipboard = useChatCopyToClipboard(messages);

  if (!messages.length) return null;

  return (
    <Box sx={styles.root}>
      <ChatMessageList
        chat_history={messages}
        activeConversation={conversation}
        isLoading={false}
        isStreaming={false}
        isLoadingMore={false}
        askingQuestionId=""
        questionItemRef={questionItemRef}
        onCopyToClipboard={onCopyToClipboard}
      />
    </Box>
  );
});

ToolkitTestResults.displayName = 'ToolkitTestResults';

/** @type {MuiSx} */
const toolkitTestResultsStyles = () => ({
  root: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});

export default ToolkitTestResults;

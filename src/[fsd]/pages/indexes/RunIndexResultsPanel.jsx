import { memo } from 'react';

import { ChatMessageList } from '@/[fsd]/features/chat/ui/chat-box';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';

const RunIndexResultsPanel = memo(props => {
  const { chatHistory, chatConversation, questionItemRef } = props;
  const styles = runIndexResultsPanelStyles();

  return (
    <ChatBodyContainer sx={styles.chatBody}>
      <ChatMessageList
        chat_history={chatHistory}
        activeConversation={chatConversation}
        isLoading={false}
        isStreaming={false}
        isLoadingMore={false}
        interaction_uuid="toolkit-test"
        askingQuestionId=""
        lastResponseMinHeight={0}
        questionItemRef={questionItemRef}
        onRegenerateAnswer={() => null}
        onCopyToClipboard={() => null}
      />
    </ChatBodyContainer>
  );
});

RunIndexResultsPanel.displayName = 'RunIndexResultsPanel';

/** @type {MuiSx} */
const runIndexResultsPanelStyles = () => ({
  chatBody: {
    flex: 1,
    minHeight: 0,
  },
});

export default RunIndexResultsPanel;

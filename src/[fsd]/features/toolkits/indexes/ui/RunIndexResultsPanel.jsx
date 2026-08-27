import { memo } from 'react';

import { ChatMessageList } from '@/[fsd]/features/chat';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';

const RunIndexResultsPanel = memo(props => {
  const { chatHistory, chatConversation, questionItemRef } = props;
  const styles = runIndexResultsPanelStyles();
  const onCopyToClipboard = useChatCopyToClipboard(chatHistory);

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
        onCopyToClipboard={onCopyToClipboard}
      />
    </ChatBodyContainer>
  );
});

RunIndexResultsPanel.displayName = 'RunIndexResultsPanel';

/** @type {MuiSx} */
const runIndexResultsPanelStyles = () => ({
  chatBody: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    borderRadius: '0 !important',
    border: 'none !important',
    background: palette.background.eliteaDefault,
  }),
});

export default RunIndexResultsPanel;

import { memo, useEffect, useMemo, useRef } from 'react';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import ChatMessageList from '@/components/Chat/ChatMessageList';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ContentContainer } from '@/pages/Common';

const RunHistoryChat = memo(props => {
  const { selectedHistoryItem, prettifyChat } = props;
  const { isSmallWindow } = useIsSmallWindow();

  const projectId = useSelectedProjectId();

  const [
    fetchConversationDetails,
    { data: conversationDetails, isFetching: isConversationDetailsFetching, reset },
  ] = RunHistoryApi.useLazyGetRunHistoryDetailsQuery();

  useEffect(() => {
    if (selectedHistoryItem) {
      fetchConversationDetails({
        projectId,
        conversationId: selectedHistoryItem,
      });
    } else reset();
  }, [fetchConversationDetails, projectId, reset, selectedHistoryItem]);

  const styles = runHistoryChatStyles(isSmallWindow);

  const { isLoadingData, chatHistory, conversationData } = useMemo(() => {
    const conversation = selectedHistoryItem ? (conversationDetails ?? null) : null;

    const currentConversationMessages = conversation ? convertConversationToChatHistory(conversation) : [];

    return {
      isLoadingData: isConversationDetailsFetching,
      chatHistory: prettifyChat
        ? ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages)
        : currentConversationMessages,
      conversationData: conversation,
    };
  }, [selectedHistoryItem, conversationDetails, isConversationDetailsFetching, prettifyChat]);

  const onCopyToClipboard = useChatCopyToClipboard(chatHistory);

  return (
    <ContentContainer sx={styles.wrapper}>
      <ChatBodyContainer sx={styles.chatContainer}>
        <ChatMessageList
          chat_history={chatHistory}
          activeConversation={conversationData}
          isLoading={isLoadingData}
          isStreaming={false}
          isLoadingMore={false}
          askingQuestionId=""
          lastResponseMinHeight={0}
          questionItemRef={useRef()}
          onRegenerateAnswer={() => null}
          onCopyToClipboard={onCopyToClipboard}
        />
      </ChatBodyContainer>
    </ContentContainer>
  );
});

RunHistoryChat.displayName = 'RunHistoryChat';

/** @type {MuiSx} */
const runHistoryChatStyles = isSmallWindow => ({
  wrapper: {
    flex: 7,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '.75rem',
    paddingRight: '1.5rem',

    ...(isSmallWindow ? { paddingLeft: '1.5rem', minHeight: '40rem', paddingBottom: '1.5rem' } : {}),
  },
});

export default RunHistoryChat;

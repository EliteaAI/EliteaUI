import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { ChatMessageList } from '@/[fsd]/features/chat/ui/chat-box';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useLazyMessageTracesQuery } from '@/api';
import {
  buildTraceListParams,
  convertConversationToChatHistory,
} from '@/common/convertChatConversationMessages';
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
  const [getMessageTraces] = useLazyMessageTracesQuery();
  const [traceSteps, setTraceSteps] = useState(null);

  useEffect(() => {
    if (selectedHistoryItem) {
      fetchConversationDetails({
        projectId,
        conversationId: selectedHistoryItem,
      });
    } else {
      reset();
      setTraceSteps(null);
    }
  }, [fetchConversationDetails, getMessageTraces, projectId, reset, selectedHistoryItem]);

  useEffect(() => {
    if (!selectedHistoryItem || !conversationDetails) return;
    getMessageTraces({
      projectId,
      conversationId: selectedHistoryItem,
      params: buildTraceListParams(conversationDetails.message_groups),
    }).then(r => setTraceSteps(r.data || null));
  }, [conversationDetails, getMessageTraces, projectId, selectedHistoryItem]);

  const styles = runHistoryChatStyles(isSmallWindow);

  const { isLoadingData, chatHistory, conversationData } = useMemo(() => {
    const conversation = selectedHistoryItem ? (conversationDetails ?? null) : null;

    const currentConversationMessages = conversation
      ? convertConversationToChatHistory(conversation, traceSteps)
      : [];

    return {
      isLoadingData: isConversationDetailsFetching,
      chatHistory: prettifyChat
        ? ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages)
        : currentConversationMessages,
      conversationData: conversation,
    };
  }, [selectedHistoryItem, conversationDetails, traceSteps, isConversationDetailsFetching, prettifyChat]);

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

import { memo, useCallback, useRef } from 'react';

import { Box } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { useIndexHistory } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { LLMModelSelector } from '@/[fsd]/widgets/LLMModelSelector';
import ChatMessageList from '@/components/Chat/ChatMessageList';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import useToast from '@/hooks/useToast';
import { ContentContainer } from '@/pages/Common';

const IndexChatContainer = memo(props => {
  const {
    selectedModel,
    onSelectModel,
    modelList,
    llmSettings,
    onSetLLMSettings,
    isFullScreenChat,
    toggleFullScreenChat,
    clearChat,
    chatHistory,
    conversation,
  } = props;
  const styles = indexChatContainerStyles();
  const questionItemRef = useRef();
  const { toastInfo, toastError } = useToast();

  const { isHistoryMode, historyMessages, historyConversation, isHistoryLoading } = useIndexHistory();

  const onCopyToClipboard = useCallback(
    id => async () => {
      const messages = isHistoryMode ? historyMessages : chatHistory;
      const message = messages.find(item => item.id === id);

      if (message) {
        try {
          let contentToCopy = '';

          if (message.exception) {
            contentToCopy = JSON.stringify(message.exception);
          } else if (message.message_items?.length) {
            contentToCopy = message.message_items
              .map(item => item.content || item.item_details?.content || '')
              .filter(Boolean)
              .join('\n');
          } else {
            contentToCopy = message.content || '';
          }

          await navigator.clipboard.writeText(contentToCopy);
          toastInfo('Copied to clipboard');
        } catch {
          toastError('Failed to copy to clipboard');
        }
      }
    },
    [chatHistory, historyMessages, isHistoryMode, toastInfo, toastError],
  );

  return (
    <Box sx={styles.wrapper}>
      <ContentContainer height="100%">
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            {isHistoryMode ? (
              <Box />
            ) : (
              <LLMModelSelector
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                models={modelList}
                llmSettings={llmSettings}
                onSetLLMSettings={onSetLLMSettings}
              />
            )}
          </Box>
          <Box sx={styles.additionalControls}>
            <FullScreenToggle
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={toggleFullScreenChat}
            />
            {!isHistoryMode && <ChatButton.ClearChatButton onClear={clearChat} />}
          </Box>
        </Box>

        <ChatBodyContainer sx={styles.chatContainer}>
          <ChatMessageList
            chat_history={chatHistory}
            activeConversation={conversation}
            isLoading={false}
            isStreaming={false}
            isLoadingMore={false}
            interaction_uuid="toolkit-test"
            askingQuestionId=""
            lastResponseMinHeight={0}
            questionItemRef={questionItemRef}
            onRegenerateAnswer={() => null}
            onCopyToClipboard={onCopyToClipboard}
            {...(isHistoryMode
              ? {
                  chat_history: historyMessages,
                  activeConversation: historyConversation,
                  isLoading: isHistoryLoading,
                }
              : { interaction_uuid: 'toolkit-test' })}
          />
        </ChatBodyContainer>
      </ContentContainer>
    </Box>
  );
});

IndexChatContainer.displayName = 'IndexChatContainer';

/** @type {MuiSx} */
const indexChatContainerStyles = () => ({
  wrapper: {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    gap: '0.5rem',
    marginBottom: '.875rem',
  },
  headerLeft: {
    minWidth: 0,
    flex: '1 1 0',
  },
  additionalControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  clearIcon: {
    fontSize: '1rem',

    path: {
      fill: ({ palette }) => `${palette.icon.fill.secondary} !important`,
    },
  },
  chatContainer: {
    height: 'calc(100% - 2.625rem)',
    mainHeight: 'calc(100% - 2.625rem)',
  },
});

export default IndexChatContainer;
